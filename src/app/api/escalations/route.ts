import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Escalation from '@/models/Escalation';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import mongoose from 'mongoose';

function normalizeStatus(status?: string) {
  if (!status) return undefined;
  const normalized = status.trim().toLowerCase();
  if (normalized === 'in progress') return 'in-progress';
  return normalized;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = normalizeStatus(searchParams.get('status') || undefined);

    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    }

    if (authUser.role === 'student') {
      query.reportedBy = authUser.userId;
    } else if (authUser.role === 'teacher') {
      query.assignedTo = authUser.userId;
    }

    const escalations = await Escalation.find(query)
      .populate('reportedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('relatedStudentId', 'name email rollNumber semester department')
      .sort({ createdAt: -1 });

    const data = escalations.map((escalation: any) => ({
      ...escalation.toObject(),
      createdBy: escalation.reportedBy,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (authUser.role !== 'student') {
      return unauthorizedResponse('Only students can create escalations', 403);
    }

    const body = await request.json();

    if (!body.title || !body.description) {
      return NextResponse.json({ success: false, error: 'title and description are required' }, { status: 400 });
    }

    const escalation = new Escalation({
      title: body.title,
      description: body.description,
      category: body.category || 'other',
      priority: body.priority || 'medium',
      reportedBy: new mongoose.Types.ObjectId(authUser.userId),
      relatedStudentId: new mongoose.Types.ObjectId(authUser.userId),
      relatedChatId: body.relatedChatId,
      status: 'open',
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      activityLog: [
        {
          action: 'created',
          performedBy: new mongoose.Types.ObjectId(authUser.userId),
          timestamp: new Date(),
          notes: body.notes || '',
        },
      ],
    } as any);

    await escalation.save();

    const populated = await Escalation.findById(escalation._id)
      .populate('reportedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .populate('relatedStudentId', 'name email rollNumber semester department');

    return NextResponse.json(
      {
        success: true,
        data: {
          ...(populated as any).toObject(),
          createdBy: (populated as any).reportedBy,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
