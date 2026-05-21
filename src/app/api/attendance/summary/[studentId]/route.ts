import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Batch from '@/models/Batch';
import Subject from '@/models/Subject';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    await dbConnect();
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const studentId = params.studentId === 'me' ? authUser.userId : params.studentId;
    if (authUser.role === 'student' && studentId !== authUser.userId) {
      return unauthorizedResponse('Students can only view their own attendance', 403);
    }

    const student = await User.findById(studentId).select('batchIds subjectIds departmentId collegeId year semester');
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const records = await Attendance.find({ studentId })
      .populate('subjectId', 'code name type credits hoursPerWeek semester year')
      .populate('batchId', 'batchCode teacherId')
      .populate('teacherId', 'name')
      .sort({ date: -1 })
      .lean();

    const subjectMap = new Map<string, any>();
    for (const record of records) {
      const subject: any = record.subjectId;
      if (!subject?._id) continue;
      const key = subject._id.toString();
      const summary = subjectMap.get(key) || {
        subject,
        batch: record.batchId,
        teacher: record.teacherId,
        totalLectures: 0,
        present: 0,
        absent: 0,
        late: 0,
      };

      summary.totalLectures += 1;
      if (record.status === 'present') summary.present += 1;
      if (record.status === 'late') summary.late += 1;
      if (record.status === 'absent') summary.absent += 1;
      subjectMap.set(key, summary);
    }

    const activeBatches = await Batch.find({ _id: { $in: student.batchIds || [] }, isActive: true })
      .populate('subjectId', 'code name type credits hoursPerWeek semester year')
      .populate('teacherId', 'name')
      .lean();

    for (const batch of activeBatches as any[]) {
      const subject = batch.subjectId;
      if (!subject?._id) continue;
      const key = subject._id.toString();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject,
          batch,
          teacher: batch.teacherId,
          totalLectures: 0,
          present: 0,
          absent: 0,
          late: 0,
        });
      }
    }

    if (subjectMap.size === 0 && student.departmentId && student.semester) {
      const subjects = await Subject.find({
        departmentId: student.departmentId,
        semester: student.semester,
      }).lean();

      for (const subject of subjects) {
        subjectMap.set(subject._id.toString(), {
          subject,
          batch: null,
          teacher: null,
          totalLectures: 0,
          present: 0,
          absent: 0,
          late: 0,
        });
      }
    }

    const summaries = Array.from(subjectMap.values()).map((item) => {
      const attended = item.present + item.late;
      const percentage = item.totalLectures ? Math.round((attended / item.totalLectures) * 1000) / 10 : 0;
      return {
        ...item,
        attended,
        percentage,
        requiredMoreLectures: percentage >= 75 || item.totalLectures === 0
          ? 0
          : Math.ceil((0.75 * item.totalLectures - attended) / 0.25),
      };
    });

    return NextResponse.json({ success: true, data: summaries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
