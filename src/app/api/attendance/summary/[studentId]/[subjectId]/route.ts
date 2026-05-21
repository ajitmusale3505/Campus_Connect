import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Subject from '@/models/Subject';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string; subjectId: string } }
) {
  try {
    await dbConnect();
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const studentId = params.studentId === 'me' ? authUser.userId : params.studentId;
    if (authUser.role === 'student' && studentId !== authUser.userId) {
      return unauthorizedResponse('Students can only view their own attendance', 403);
    }

    const [subject, records] = await Promise.all([
      Subject.findById(params.subjectId).lean(),
      Attendance.find({ studentId, subjectId: params.subjectId })
        .populate('batchId', 'batchCode')
        .populate('teacherId', 'name')
        .sort({ date: -1 })
        .lean(),
    ]);

    const present = records.filter((record) => record.status === 'present').length;
    const late = records.filter((record) => record.status === 'late').length;
    const absent = records.filter((record) => record.status === 'absent').length;
    const attended = present + late;
    const totalLectures = records.length;
    const percentage = totalLectures ? Math.round((attended / totalLectures) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      data: {
        subject,
        totalLectures,
        present,
        late,
        absent,
        attended,
        percentage,
        requiredMoreLectures: percentage >= 75 || totalLectures === 0
          ? 0
          : Math.ceil((0.75 * totalLectures - attended) / 0.25),
        records,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
