import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Grievance from '@/models/Grievance';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!['hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Only HOD/Principal can view grievances', 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: Record<string, any> = {};
    if (status) {
      query.status = status;
    }

    const grievances = await Grievance.find(query)
      .populate('submittedBy', 'name email role department')
      .populate('assignedTo', 'name email role department')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: grievances });
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

    const body = await request.json();

    if (!body.subject || !body.description || !body.category) {
      return NextResponse.json({ success: false, error: 'subject, description, and category are required' }, { status: 400 });
    }

    const isAnonymous = body.isAnonymous === true;

    const grievance = await Grievance.create({
      submittedBy: isAnonymous ? undefined : new mongoose.Types.ObjectId(authUser.userId),
      isAnonymous,
      category: body.category,
      subject: body.subject,
      description: body.description,
      severity: body.severity || 'medium',
      status: 'submitted',
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      timeline: [
        {
          action: 'submitted',
          performedBy: isAnonymous ? undefined : new mongoose.Types.ObjectId(authUser.userId),
          timestamp: new Date(),
          notes: body.notes || '',
        },
      ],
    } as any);

    return NextResponse.json({ success: true, data: grievance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
