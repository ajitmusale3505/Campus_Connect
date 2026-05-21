import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Escalation from '@/models/Escalation';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

const STATUS_FLOW: Record<string, string[]> = {
  open: ['assigned', 'in-progress', 'resolved', 'closed'],
  assigned: ['in-progress', 'resolved', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

function normalizeStatus(status?: string) {
  if (!status) return undefined;
  const normalized = status.trim().toLowerCase();
  if (normalized === 'in progress') return 'in-progress';
  return normalized;
}

function canTransition(from: string, to: string) {
  if (from === to) return true;
  return (STATUS_FLOW[from] || []).includes(to);
}

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

    const escalation = await Escalation.findById(params.id)
      .populate('reportedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('relatedStudentId', 'name email rollNumber semester department');

    if (!escalation) {
      return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    }

    const isOwner = escalation.reportedBy.toString() === authUser.userId;
    const isAssignee = escalation.assignedTo?.toString() === authUser.userId;
    const isAdmin = ['hod', 'principal'].includes(authUser.role);

    if (!isOwner && !isAssignee && !isAdmin) {
      return unauthorizedResponse('Forbidden', 403);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...(escalation as any).toObject(),
        createdBy: (escalation as any).reportedBy,
      },
    });
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

    const escalation = await Escalation.findById(params.id);
    if (!escalation) {
      return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    }

    const isAdmin = ['hod', 'principal'].includes(authUser.role);
    const isAssignee = escalation.assignedTo?.toString() === authUser.userId;

    if (!isAdmin && !(authUser.role === 'teacher' && isAssignee)) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const body = await request.json();

    if (body.teacherId || body.assignedTo) {
      if (!isAdmin) {
        return unauthorizedResponse('Only HOD/Principal can assign escalations', 403);
      }

      const assignedTo = body.teacherId || body.assignedTo;
      const teacher = await User.findById(assignedTo).select('role');
      if (!teacher || teacher.role !== 'teacher') {
        return NextResponse.json({ success: false, error: 'Invalid teacherId' }, { status: 400 });
      }

      escalation.assignedTo = assignedTo;
      if (escalation.status === 'open') {
        escalation.status = 'assigned';
      }
    }

    const requestedStatus = normalizeStatus(body.status);
    if (requestedStatus) {
      if (!['open', 'assigned', 'in-progress', 'resolved', 'closed'].includes(requestedStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      if (!canTransition(escalation.status, requestedStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status transition: ${escalation.status} -> ${requestedStatus}` },
          { status: 400 }
        );
      }

      escalation.status = requestedStatus as any;
      if (requestedStatus === 'resolved' || requestedStatus === 'closed') {
        escalation.resolutionDate = new Date();
      }
    }

    if (body.resolution !== undefined) {
      escalation.resolution = body.resolution;
      if (body.resolution && escalation.status !== 'resolved') {
        escalation.status = 'resolved';
        escalation.resolutionDate = new Date();
      }
    }

    escalation.activityLog.push({
      action: body.activityAction || 'updated',
      performedBy: authUser.userId as any,
      timestamp: new Date(),
      notes: body.notes || '',
    });

    await escalation.save();

    const populated = await Escalation.findById(params.id)
      .populate('reportedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('relatedStudentId', 'name email rollNumber semester department');

    return NextResponse.json({
      success: true,
      data: {
        ...(populated as any).toObject(),
        createdBy: (populated as any).reportedBy,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
