import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/assignments/[id]/submissions - List submissions (teacher/hod/principal)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(req);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const assignment = await Assignment.findById(params.id)
      .populate('submissions.studentId', 'name email rollNumber')
      .populate('teacherId', 'name email');

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (authUser.role === 'teacher' && assignment.teacherId.toString() !== authUser.userId) {
      return unauthorizedResponse('Forbidden', 403);
    }

    if (authUser.role === 'student') {
      const ownSubmission = assignment.submissions.filter(
        (submission: any) =>
          (submission.studentId?._id?.toString?.() || submission.studentId?.toString?.()) === authUser.userId
      );

      return NextResponse.json({
        success: true,
        data: ownSubmission,
      });
    }

    return NextResponse.json({
      success: true,
      data: assignment.submissions,
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/assignments/[id]/submissions - Submit assignment (student)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(req);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (authUser.role !== 'student') {
      return unauthorizedResponse('Only students can submit assignments', 403);
    }

    const body = await req.json();
    const { attachments, comments, content, fileUrl } = body;

    const assignment = await Assignment.findById(params.id);

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if assignment is still open
    if (new Date() > new Date(assignment.dueDate)) {
      return NextResponse.json(
        { success: false, error: 'Assignment deadline has passed' },
        { status: 400 }
      );
    }

    // Check if student already submitted
    const existingSubmission = assignment.submissions.find(
      (sub: any) => sub.studentId.toString() === authUser.userId
    );

    if (existingSubmission) {
      return NextResponse.json(
        { success: false, error: 'Assignment already submitted' },
        { status: 400 }
      );
    }

    // Add submission
    const normalizedAttachments = [
      ...(Array.isArray(attachments) ? attachments : []),
      ...(fileUrl ? [fileUrl] : []),
    ];

    assignment.submissions.push({
      studentId: new mongoose.Types.ObjectId(authUser.userId),
      submittedAt: new Date(),
      content: content || '',
      fileUrl: fileUrl || '',
      attachments: normalizedAttachments,
      comments: comments || '',
      grade: null,
      feedback: '',
      gradedAt: null,
    } as any);

    await assignment.save();

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/[id]/submissions - Grade submission (teacher)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(req);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (authUser.role !== 'teacher') {
      return unauthorizedResponse('Only teachers can grade assignments', 403);
    }

    const body = await req.json();
    const { studentId, grade, feedback, annotations } = body;

    if (!studentId || grade === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const assignment = await Assignment.findById(params.id);

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if teacher owns this assignment
    if (assignment.teacherId.toString() !== authUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Find and update submission
    const submission = assignment.submissions.find(
      (sub: any) => sub.studentId.toString() === studentId
    );

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Validate grade
    if (grade < 0 || grade > assignment.totalMarks) {
      return NextResponse.json(
        { success: false, error: `Grade must be between 0 and ${assignment.totalMarks}` },
        { status: 400 }
      );
    }

    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.annotations = annotations || [];
    submission.gradedAt = new Date();

    await assignment.save();

    await Notification.create({
      userId: studentId,
      text: `Your submission for "${assignment.title}" has been graded: ${grade}/${assignment.totalMarks}.`,
      type: 'success',
      category: 'general',
      link: '/student/assignments',
      read: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment graded successfully',
    });
  } catch (error: any) {
    console.error('Error grading assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
