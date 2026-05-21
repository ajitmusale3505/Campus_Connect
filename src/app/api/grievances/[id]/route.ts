import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Grievance from '@/models/Grievance';
import User from '@/models/User';
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

    const grievance = await Grievance.findById(params.id)
      .populate('submittedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('timeline.performedBy', 'name email role');

    if (!grievance) {
      return NextResponse.json({ success: false, error: 'Grievance not found' }, { status: 404 });
    }

    const isAdmin = ['hod', 'principal'].includes(authUser.role);
    const isOwner = grievance.submittedBy?.toString() === authUser.userId;

    if (!isAdmin && !isOwner) {
      return unauthorizedResponse('Forbidden', 403);
    }

    return NextResponse.json({ success: true, data: grievance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
      return unauthorizedResponse('Only HOD/Principal can update grievance status', 403);
    }

    const grievance = await Grievance.findById(params.id);
    if (!grievance) {
      return NextResponse.json({ success: false, error: 'Grievance not found' }, { status: 404 });
    }

    const body = await request.json();

    if (body.assignedTo) {
      const assignee = await User.findById(body.assignedTo).select('role');
      if (!assignee || !['teacher', 'hod', 'principal'].includes(assignee.role)) {
        return NextResponse.json({ success: false, error: 'Invalid assignedTo user' }, { status: 400 });
      }
      grievance.assignedTo = body.assignedTo;
    }

    if (body.status) {
      grievance.status = body.status;
      if (body.status === 'resolved' || body.status === 'closed') {
        grievance.resolutionDate = new Date();
      }
    }

    if (body.resolution !== undefined) {
      grievance.resolution = body.resolution;
    }

    if (body.assignedCommittee !== undefined) {
      grievance.assignedCommittee = body.assignedCommittee;
    }

    grievance.timeline.push({
      action: body.timelineAction || 'updated',
      performedBy: authUser.userId as any,
      timestamp: new Date(),
      notes: body.notes || '',
    });

    await grievance.save();

    return NextResponse.json({ success: true, data: grievance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
