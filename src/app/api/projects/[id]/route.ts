import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProjectAllocation from '@/models/ProjectAllocation';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const project = await ProjectAllocation.findById(params.id)
      .populate('guideId', 'name email department')
      .populate('coGuideId', 'name email department')
      .populate('students', 'name email rollNumber semester department');

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const hasAccess =
      authUser.role === 'principal' ||
      authUser.role === 'hod' ||
      (authUser.role === 'teacher' &&
        ((project.guideId as any)?._id?.toString?.() === authUser.userId ||
          project.guideId?.toString() === authUser.userId ||
          (project.coGuideId as any)?._id?.toString?.() === authUser.userId ||
          project.coGuideId?.toString() === authUser.userId)) ||
      (authUser.role === 'student' &&
        project.students.some(
          (student: any) => (student?._id?.toString?.() || student?.toString?.()) === authUser.userId
        ));

    if (!hasAccess) {
      return unauthorizedResponse('Forbidden', 403);
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const project = await ProjectAllocation.findById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const canEdit =
      authUser.role === 'principal' ||
      authUser.role === 'hod' ||
      (authUser.role === 'teacher' &&
        (project.guideId?.toString() === authUser.userId ||
          project.coGuideId?.toString() === authUser.userId));

    if (!canEdit) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const body = await request.json();

    const updated = await ProjectAllocation.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate('guideId', 'name email department')
      .populate('coGuideId', 'name email department')
      .populate('students', 'name email rollNumber semester department');

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!['hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Only HOD/Principal can delete projects', 403);
    }

    const deleted = await ProjectAllocation.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
