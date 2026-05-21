import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Batch from '@/models/Batch';
import Notification from '@/models/Notification';
import Subject from '@/models/Subject';
import { unauthorizedResponse } from '@/lib/auth';
import { getCurrentDbUser, hasDbRole } from '@/lib/current-user';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentDbUser(request);
    if (!currentUser) return unauthorizedResponse();
    if (!hasDbRole(currentUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can mark attendance', 403);
    }

    const body = await request.json();
    const { batchId, subjectId, date, records } = body;
    if (!batchId || !subjectId || !date || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: 'batchId, subjectId, date and records are required' }, { status: 400 });
    }

    const [batch, subject] = await Promise.all([Batch.findById(batchId), Subject.findById(subjectId)]);
    if (!batch || !subject) {
      return NextResponse.json({ success: false, error: 'Batch or subject not found' }, { status: 404 });
    }

    if (currentUser.role === 'teacher' && batch.teacherId?.toString() !== currentUser._id.toString()) {
      return unauthorizedResponse('This batch is not assigned to the current teacher', 403);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const teacherId = new mongoose.Types.ObjectId(currentUser._id.toString());

    const saved = [];
    for (const item of records) {
      if (!item.studentId || !['present', 'absent', 'late'].includes(item.status)) continue;

      const record = await Attendance.findOneAndUpdate(
        { studentId: item.studentId, batchId, date: attendanceDate },
        {
          userId: item.studentId,
          studentId: item.studentId,
          teacherId,
          batchId,
          subjectId,
          date: attendanceDate,
          timestamp: new Date(),
          status: item.status,
          markedVia: 'Manual',
          subject: subject.name,
          remarks: item.remarks || '',
        },
        { upsert: true, new: true, runValidators: true }
      );
      saved.push(record);

      if (item.status === 'present' || item.status === 'late') {
        await Notification.create({
          userId: item.studentId,
          text: `Attendance Marked: Your attendance for ${subject.name} has been marked ${item.status}.`,
          type: 'success',
          category: 'general',
          link: '/student/attendance',
          read: false,
          timestamp: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
