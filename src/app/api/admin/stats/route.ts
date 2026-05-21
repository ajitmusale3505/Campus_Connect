import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Mark from '@/models/Mark';
import Assignment from '@/models/Assignment';
import ProjectAllocation from '@/models/ProjectAllocation';
import Escalation from '@/models/Escalation';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!['hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Only HOD/Principal can view admin stats', 403);
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const [users, attendanceRecords, marks, assignments, projects, escalations] = await Promise.all([
      User.find({}).select('_id role department semester').lean(),
      Attendance.find({ date: { $gte: sixMonthsAgo } }).select('userId status date').lean(),
      Mark.find({ date: { $gte: sixMonthsAgo } }).select('userId score total date').lean(),
      Assignment.find({}).select('submissions').lean(),
      ProjectAllocation.find({}).select('status').lean(),
      Escalation.find({}).select('status').lean(),
    ]);

    const userById = new Map<string, any>();
    for (const user of users) {
      userById.set(String(user._id), user);
    }

    const totalStudents = users.filter((user: any) => user.role === 'student').length;
    const totalFaculty = users.filter((user: any) => user.role === 'teacher').length;

    const attendancePresent = attendanceRecords.filter((record: any) => ['present', 'late'].includes(record.status)).length;
    const overallAttendance = attendanceRecords.length
      ? (attendancePresent / attendanceRecords.length) * 100
      : 0;

    const markPercentages = marks
      .filter((mark: any) => mark.total > 0)
      .map((mark: any) => (mark.score / mark.total) * 100);

    const overallMarksAverage = markPercentages.length
      ? markPercentages.reduce((sum: number, value: number) => sum + value, 0) / markPercentages.length
      : 0;

    const overallPassRate = markPercentages.length
      ? (markPercentages.filter((value: number) => value >= 40).length / markPercentages.length) * 100
      : 0;

    const monthBuckets: Record<string, { attendanceTotal: number; attendancePresent: number; marksTotal: number; marksCount: number; marksPassCount: number }> = {};
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = monthKey(date);
      monthBuckets[key] = {
        attendanceTotal: 0,
        attendancePresent: 0,
        marksTotal: 0,
        marksCount: 0,
        marksPassCount: 0,
      };
    }

    for (const record of attendanceRecords as any[]) {
      const key = monthKey(new Date(record.date));
      if (!monthBuckets[key]) continue;
      monthBuckets[key].attendanceTotal += 1;
      if (['present', 'late'].includes(record.status)) {
        monthBuckets[key].attendancePresent += 1;
      }
    }

    for (const mark of marks as any[]) {
      const key = monthKey(new Date(mark.date));
      if (!monthBuckets[key] || !mark.total) continue;
      const percentage = (mark.score / mark.total) * 100;
      monthBuckets[key].marksTotal += percentage;
      monthBuckets[key].marksCount += 1;
      if (percentage >= 40) {
        monthBuckets[key].marksPassCount += 1;
      }
    }

    const attendanceTrend = Object.entries(monthBuckets).map(([key, bucket]) => ({
      month: monthLabelFromKey(key),
      attendance: bucket.attendanceTotal ? (bucket.attendancePresent / bucket.attendanceTotal) * 100 : 0,
    }));

    const marksTrend = Object.entries(monthBuckets).map(([key, bucket]) => ({
      month: monthLabelFromKey(key),
      average: bucket.marksCount ? bucket.marksTotal / bucket.marksCount : 0,
    }));

    const passRateTrend = Object.entries(monthBuckets).map(([key, bucket]) => ({
      month: monthLabelFromKey(key),
      rate: bucket.marksCount ? (bucket.marksPassCount / bucket.marksCount) * 100 : 0,
    }));

    const departmentStatsMap: Record<string, any> = {};

    for (const user of users as any[]) {
      const department = user.department || 'Unassigned';
      if (!departmentStatsMap[department]) {
        departmentStatsMap[department] = {
          department,
          studentCount: 0,
          facultyCount: 0,
          attendancePresent: 0,
          attendanceTotal: 0,
          marksTotal: 0,
          marksCount: 0,
        };
      }

      if (user.role === 'student') {
        departmentStatsMap[department].studentCount += 1;
      }

      if (user.role === 'teacher') {
        departmentStatsMap[department].facultyCount += 1;
      }
    }

    for (const record of attendanceRecords as any[]) {
      const user = userById.get(String(record.userId));
      if (!user) continue;

      const department = user.department || 'Unassigned';
      const bucket = departmentStatsMap[department];
      if (!bucket) continue;

      bucket.attendanceTotal += 1;
      if (['present', 'late'].includes(record.status)) {
        bucket.attendancePresent += 1;
      }
    }

    for (const mark of marks as any[]) {
      const user = userById.get(String(mark.userId));
      if (!user || !mark.total) continue;

      const department = user.department || 'Unassigned';
      const bucket = departmentStatsMap[department];
      if (!bucket) continue;

      bucket.marksTotal += (mark.score / mark.total) * 100;
      bucket.marksCount += 1;
    }

    const departmentStats = Object.values(departmentStatsMap).map((entry: any) => {
      const attendanceAvg = entry.attendanceTotal ? (entry.attendancePresent / entry.attendanceTotal) * 100 : 0;
      const marksAvg = entry.marksCount ? entry.marksTotal / entry.marksCount : 0;

      let risk: 'low' | 'medium' | 'high' = 'low';
      if (attendanceAvg < 75 || marksAvg < 60) {
        risk = 'high';
      } else if (attendanceAvg < 85 || marksAvg < 70) {
        risk = 'medium';
      }

      return {
        department: entry.department,
        studentCount: entry.studentCount,
        facultyCount: entry.facultyCount,
        attendanceAvg,
        marksAvg,
        risk,
      };
    });

    const projectSummary = {
      active: projects.filter((project: any) => project.status === 'ongoing').length,
      completed: projects.filter((project: any) => project.status === 'completed').length,
      upcoming: projects.filter((project: any) => project.status === 'proposed').length,
    };

    const escalationSummary = {
      open: escalations.filter((item: any) => item.status === 'open').length,
      assigned: escalations.filter((item: any) => item.status === 'assigned').length,
      inProgress: escalations.filter((item: any) => item.status === 'in-progress').length,
      resolved: escalations.filter((item: any) => item.status === 'resolved').length,
    };

    const facultyUtilization = totalFaculty
      ? Math.min(100, (assignments.length / Math.max(totalFaculty, 1)) * 25)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          students: totalStudents,
          faculty: totalFaculty,
        },
        averages: {
          attendance: overallAttendance,
          marks: overallMarksAverage,
          passRate: overallPassRate,
          facultyUtilization,
        },
        trends: {
          attendance: attendanceTrend,
          marks: marksTrend,
          passRate: passRateTrend,
        },
        departments: departmentStats,
        projects: projectSummary,
        escalations: escalationSummary,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
