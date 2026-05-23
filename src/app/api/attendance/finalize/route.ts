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
      return unauthorizedResponse('Only faculty can finalize attendance', 403);
    }

    const { batchId, subjectId, date, sessionToken } = await request.json();
    if (!batchId || !subjectId || !date) {
      return NextResponse.json({ success: false, error: 'batchId, subjectId and date are required' }, { status: 400 });
    }

    const [batch, subject] = await Promise.all([
      Batch.findById(batchId).select('teacherId subjectId studentIds batchCode'),
      Subject.findById(subjectId).select('name code'),
    ]);

    if (!batch || !subject) {
      return NextResponse.json({ success: false, error: 'Batch or subject not found' }, { status: 404 });
    }

    if (batch.subjectId.toString() !== subject._id.toString()) {
      return NextResponse.json({ success: false, error: 'Batch does not match selected subject' }, { status: 400 });
    }

    if (currentUser.role === 'teacher' && batch.teacherId?.toString() !== currentUser._id.toString()) {
      return unauthorizedResponse('This batch is not assigned to the current teacher', 403);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const studentIds = (batch.studentIds || []).map((studentId: any) => studentId.toString());

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { createdAbsent: 0, existingRecords: 0, totalStudents: 0 },
      });
    }

    const existingRecords = await Attendance.find({
      batchId: batch._id,
      subjectId: subject._id,
      date: attendanceDate,
      studentId: { $in: studentIds },
    }).select('studentId status');

    const recordedStudentIds = new Set(existingRecords.map((record) => record.studentId?.toString()).filter(Boolean));
    const absentStudentIds = studentIds.filter((studentId) => !recordedStudentIds.has(studentId));
    const teacherId = new mongoose.Types.ObjectId(currentUser._id.toString());
    const now = new Date();

    const createdRecords = [];
    for (const studentId of absentStudentIds) {
      const record = await Attendance.findOneAndUpdate(
        { studentId, batchId: batch._id, date: attendanceDate },
        {
          userId: studentId,
          studentId,
          teacherId,
          batchId: batch._id,
          subjectId: subject._id,
          date: attendanceDate,
          timestamp: now,
          status: 'absent',
          markedVia: 'QR',
          qrTokenUsed: sessionToken || '',
          subject: subject.name,
          remarks: 'Auto-marked absent when QR attendance session was stopped.',
        },
        { upsert: true, new: true, runValidators: true }
      );
      createdRecords.push(record);

      await Notification.create({
        userId: studentId,
        text: `Attendance Marked: You were marked Absent for ${subject.name} because your QR was not scanned before the session ended.`,
        type: 'warning',
        category: 'general',
        link: '/student/attendance',
        read: false,
        timestamp: now,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        createdAbsent: createdRecords.length,
        existingRecords: existingRecords.length,
        totalStudents: studentIds.length,
        batchCode: batch.batchCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to finalize attendance' }, { status: 400 });
  }
}
