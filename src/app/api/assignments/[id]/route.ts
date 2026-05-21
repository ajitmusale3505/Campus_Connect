import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

function getTeacherId(assignment: any): string {
  return (
    assignment?.teacherId?._id?.toString?.() ||
    assignment?.teacherId?.toString?.() ||
    ''
  );
}

// GET /api/assignments/[id] - Get single assignment
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
      .populate('teacherId', 'name email')
      .populate('submissions.studentId', 'name email');

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const assignmentTeacherId = getTeacherId(assignment);

    if (authUser.role === 'teacher' && assignmentTeacherId !== authUser.userId) {
      return unauthorizedResponse('Forbidden', 403);
    }

    if (authUser.role === 'student') {
      if (!assignment.published) {
        return unauthorizedResponse('Assignment is not published', 403);
      }

      const plain = assignment.toObject() as any;
      plain.submissions = (plain.submissions || []).filter(
        (submission: any) => submission.studentId?._id?.toString() === authUser.userId
      );

      return NextResponse.json({
        success: true,
        data: plain,
      });
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Forbidden', 403);
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/[id] - Update assignment
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
      return unauthorizedResponse('Only teachers can update assignments', 403);
    }

    const body = await req.json();
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

    // Validate dueDate if provided
    if (body.dueDate) {
      const dueDateObj = new Date(body.dueDate);
      if (dueDateObj <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'Due date must be in the future' },
          { status: 400 }
        );
      }
      body.dueDate = dueDateObj;
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - Delete assignment
export async function DELETE(
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
      return unauthorizedResponse('Only teachers can delete assignments', 403);
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

    await Assignment.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
