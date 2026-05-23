import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { getCurrentDbUser } from '@/lib/current-user';

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const batchId = searchParams.get('batchId');
    const subjectId = searchParams.get('subjectId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    if (authUser.role === 'student') {
      query.$or = [{ userId: authUser.userId }, { studentId: authUser.userId }];
    } else if (searchParams.get('mine') === 'true') {
      const currentUser = await getCurrentDbUser(request);
      if (!currentUser) return unauthorizedResponse('User not found', 404);
      if (currentUser.role === 'teacher') {
        query.teacherId = currentUser._id;
      } else if (currentUser.role === 'hod' && currentUser.departmentId) {
        query.departmentId = currentUser.departmentId;
      }
    } else if (userId) {
      query.userId = userId;
    }

    if (studentId && authUser.role !== 'student') query.studentId = studentId;
    if (teacherId && authUser.role !== 'student') query.teacherId = teacherId;
    if (batchId) query.batchId = batchId;
    if (subjectId) query.subjectId = subjectId;

    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      query.date = { $gte: selectedDate, $lt: nextDate };
    } else if (startDate && endDate) {
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(0, 0, 0, 0);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      query.date = {
        $gte: rangeStart,
        $lt: rangeEnd,
      };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email role rollNumber enrollmentNumber')
      .populate('studentId', 'name email role rollNumber enrollmentNumber semester')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'code name semester year')
      .populate('batchId', 'batchCode semester year')
      .sort({ date: -1, timestamp: -1 })
      .limit(Math.min(Number(searchParams.get('limit') || 200), 500));

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create attendance record
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can create attendance records', 403);
    }

    const body = await request.json();
    const attendance = await Attendance.create(body);

    return NextResponse.json({ success: true, data: attendance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - Update attendance record
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can update attendance records', 403);
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 });
    }

    const attendance = await Attendance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete attendance record
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can delete attendance records', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 });
    }

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
