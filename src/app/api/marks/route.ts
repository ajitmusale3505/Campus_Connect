import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Mark from '@/models/Mark';
import Notification from '@/models/Notification';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch marks
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || searchParams.get('userId');
    const subject = searchParams.get('subject');
    const semester = searchParams.get('semester');

    let query: any = {};

    if (authUser.role === 'student') {
      query.userId = authUser.userId;
    } else if (studentId) {
      query.userId = studentId;
    }

    if (subject) {
      query.subject = subject;
    }

    if (semester) {
      query.semester = semester;
    }

    const marks = await Mark.find(query)
      .populate('userId', 'name email role')
      .sort({ date: -1 });

    return NextResponse.json({ success: true, data: marks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create mark record
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can create marks', 403);
    }

    const body = await request.json();

    if (!body.userId || !body.subject || !body.assessment || body.score === undefined || body.total === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const mark = await Mark.create(body);

    const percentage = (Number(body.score) / Number(body.total || 1)) * 100;

    if (percentage < 60) {
      await Notification.create({
        userId: body.userId,
        text: `Intervention needed: You scored ${percentage.toFixed(1)}% in ${body.subject} (${body.assessment}). Please review teacher guidance.`,
        type: 'warning',
        category: 'general',
        link: '/student/marks',
        read: false,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ success: true, data: mark }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// PUT - Update mark record
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can update marks', 403);
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Mark ID is required' }, { status: 400 });
    }

    const mark = await Mark.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!mark) {
      return NextResponse.json({ success: false, error: 'Mark record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mark });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE - Delete mark record
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can delete marks', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Mark ID is required' }, { status: 400 });
    }

    const mark = await Mark.findByIdAndDelete(id);

    if (!mark) {
      return NextResponse.json({ success: false, error: 'Mark record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
