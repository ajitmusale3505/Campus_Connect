import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProjectAllocation from '@/models/ProjectAllocation';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

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

    if (!['hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Only HOD/Principal can assign project guides', 403);
    }

    const body = await request.json();
    const teacherId = body.teacherId;

    if (!teacherId) {
      return NextResponse.json({ success: false, error: 'teacherId is required' }, { status: 400 });
    }

    const teacher = await User.findById(teacherId).select('role');
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Invalid teacherId' }, { status: 400 });
    }

    const project = await ProjectAllocation.findByIdAndUpdate(
      params.id,
      {
        $set: {
          guideId: teacherId,
          status: 'ongoing',
        },
      },
      { new: true, runValidators: true }
    )
      .populate('guideId', 'name email department')
      .populate('coGuideId', 'name email department')
      .populate('students', 'name email rollNumber semester department');

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
