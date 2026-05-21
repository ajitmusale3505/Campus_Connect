import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doubt from '@/models/Doubt';
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

    const body = await request.json();
    const status = String(body.status || body.action || '').toLowerCase();

    const doubt = await Doubt.findById(params.id);
    if (!doubt) {
      return NextResponse.json({ success: false, error: 'Doubt not found' }, { status: 404 });
    }

    if (status === 'resolved' || status === 'resolve') {
      if (!['teacher', 'hod', 'principal'].includes(authUser.role)) {
        return unauthorizedResponse('Only faculty can resolve doubts', 403);
      }

      doubt.isResolved = true;
      doubt.resolvedBy = authUser.userId as any;
      await doubt.save();

      return NextResponse.json({ success: true, data: doubt });
    }

    if (status === 'open') {
      if (!['teacher', 'hod', 'principal'].includes(authUser.role)) {
        return unauthorizedResponse('Only faculty can reopen doubts', 403);
      }

      doubt.isResolved = false;
      doubt.resolvedBy = undefined;
      await doubt.save();

      return NextResponse.json({ success: true, data: doubt });
    }

    return NextResponse.json({ success: false, error: 'Unsupported status update' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
