import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Batch from '@/models/Batch';
import Notification from '@/models/Notification';
import Subject from '@/models/Subject';
import User from '@/models/User';
import { unauthorizedResponse } from '@/lib/auth';
import { getCurrentDbUser, hasDbRole } from '@/lib/current-user';
import { verifyStudentQrToken } from '@/lib/qr-attendance';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentDbUser(request);
    if (!currentUser) return unauthorizedResponse();
    if (!hasDbRole(currentUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Students cannot mark their own attendance', 403);
    }

    const body = await request.json();
    const { qrPayload, batchId, subjectId, date, sessionToken } = body;

    if (!qrPayload || !batchId || !subjectId || !date || !sessionToken) {
      return NextResponse.json(
        { success: false, error: 'qrPayload, sessionToken, batchId, subjectId and date are required' },
        { status: 400 }
      );
    }

    const decoded = verifyStudentQrToken(String(qrPayload));
    const student = await User.findById(decoded.studentId);
    const batch = await Batch.findById(batchId);
    const subject = await Subject.findById(subjectId);

    if (!student || student.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Invalid student QR code' }, { status: 400 });
    }

    if (!batch || !subject) {
      return NextResponse.json({ success: false, error: 'Batch or subject not found' }, { status: 404 });
    }

    if (batch.subjectId.toString() !== subject._id.toString()) {
      return NextResponse.json({ success: false, error: 'Batch does not match selected subject' }, { status: 400 });
    }

    if (currentUser.role === 'teacher' && batch.teacherId?.toString() !== currentUser._id.toString()) {
      return unauthorizedResponse('This batch is not assigned to the current teacher', 403);
    }

    const studentSemester = Number(student.semester);
    const subjectSemester = Number(subject.semester);

    if (studentSemester !== subjectSemester) {
      return NextResponse.json(
        {
          success: false,
          error: `Student is registered for semester ${student.semester || 'unknown'}, but this attendance session is for semester ${subject.semester}.`,
        },
        { status: 403 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { studentId: student._id, batchId: batch._id, date: attendanceDate },
      {
        userId: student._id,
        studentId: student._id,
        teacherId: new mongoose.Types.ObjectId(currentUser._id.toString()),
        batchId: batch._id,
        subjectId: subject._id,
        date: attendanceDate,
        timestamp: new Date(),
        status: 'present',
        markedVia: 'QR',
        qrTokenUsed: sessionToken,
        subject: subject.name,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await Promise.all([
      Batch.findByIdAndUpdate(batch._id, { $addToSet: { studentIds: student._id } }),
      User.findByIdAndUpdate(student._id, { $addToSet: { batchIds: batch._id } }),
    ]);

    await Notification.create({
      userId: student._id,
      text: `Attendance Marked: Your attendance for ${subject.name} has been marked Present.`,
      type: 'success',
      category: 'general',
      link: '/student/attendance',
      read: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        record,
        student: {
          id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to scan attendance' }, { status: 400 });
  }
}
