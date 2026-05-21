import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// GET /api/assignments - List assignments (for both teacher and student)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    console.log('=== Assignments GET: Starting ===');

    const authUser = getAuthUser(req);
    if (!authUser) {
      return unauthorizedResponse();
    }

    console.log('=== Assignments GET: User ===', { role: authUser.role });

    let assignments;
    
    if (authUser.role === 'teacher') {
      // Teachers see only their own assignments
      assignments = await Assignment.find({ teacherId: authUser.userId })
        .populate('teacherId', 'name email')
        .populate('submissions.studentId', 'name email')
        .sort({ createdAt: -1 });
    } else if (authUser.role === 'student') {
      // Students see all published assignments
      assignments = await Assignment.find({ published: true })
        .populate('teacherId', 'name email')
        .sort({ createdAt: -1 });

      assignments = assignments.map((assignment: any) => {
        const plain = assignment.toObject();
        plain.submissions = (plain.submissions || []).filter(
          (submission: any) =>
            (submission.studentId?._id?.toString?.() || submission.studentId?.toString?.()) === authUser.userId
        );
        return plain;
      });
    } else if (hasRole(authUser, ['hod', 'principal'])) {
      assignments = await Assignment.find({})
        .populate('teacherId', 'name email')
        .populate('submissions.studentId', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unauthorized role' },
        { status: 403 }
      );
    }

    console.log('=== Assignments GET: Found ===', assignments.length);

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    console.error('=== Assignments GET: Error ===', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Create new assignment (teachers only)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    console.log('=== Assignments POST: Starting ===');

    const authUser = getAuthUser(req);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (authUser.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can create assignments' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log('=== Assignments POST: Body ===', body);
    
    const { title, description, subject, class: className, totalMarks, dueDate, rubric, published } = body;

    // Validate required fields
    if (!title || !subject || !className || !totalMarks || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const assignment = await Assignment.create({
      teacherId: authUser.userId,
      title,
      description: description || '',
      subject,
      class: className,
      totalMarks,
      dueDate: new Date(dueDate),
      rubric: rubric || '',
      published: published !== false, // Default to true
      submissions: [],
    });

    console.log('=== Assignments POST: Created ===', assignment._id);

    const students = await User.find({ role: 'student' }).select('_id');
    if (students.length > 0) {
      await Notification.insertMany(
        students.map((student) => ({
          userId: student._id,
          text: `New assignment posted: ${title}. Due ${new Date(dueDate).toLocaleDateString()}.`,
          type: 'info',
          category: 'general',
          link: '/student/assignments',
          read: false,
          timestamp: new Date(),
        }))
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    });
  } catch (error: any) {
    console.error('=== Assignments POST: Error ===', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
