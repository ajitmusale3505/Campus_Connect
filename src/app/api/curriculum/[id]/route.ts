import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SyllabusUpdate from '@/models/SyllabusUpdate';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

const ALLOWED_REVIEW_STATUS = ['approved', 'rejected', 'revision-requested'] as const;

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

    if (!['teacher', 'hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const update = await SyllabusUpdate.findById(params.id)
      .populate('submittedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('changeLogs.updatedBy', 'name email');

    if (!update) {
      return NextResponse.json({ success: false, error: 'Curriculum update not found' }, { status: 404 });
    }

    if (authUser.role === 'teacher' && update.submittedBy?.toString() !== authUser.userId) {
      return unauthorizedResponse('Forbidden', 403);
    }

    return NextResponse.json({ success: true, data: update });
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
      return unauthorizedResponse('Only HOD/Principal can review curriculum submissions', 403);
    }

    const update = await SyllabusUpdate.findById(params.id);
    if (!update) {
      return NextResponse.json({ success: false, error: 'Curriculum update not found' }, { status: 404 });
    }

    const body = await request.json();
    const requestedStatus = String(body.status || '').trim();

    if (!(ALLOWED_REVIEW_STATUS as readonly string[]).includes(requestedStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review status' },
        { status: 400 }
      );
    }

    update.status = requestedStatus as any;
    update.reviewComments = typeof body.reviewComments === 'string' ? body.reviewComments.trim() : '';
    update.reviewedBy = authUser.userId as any;
    update.reviewedAt = new Date();

    if (requestedStatus === 'approved') {
      const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : new Date();
      if (Number.isNaN(effectiveDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid effectiveDate' }, { status: 400 });
      }
      update.effectiveDate = effectiveDate;
    }

    await update.save();

    const populated = await SyllabusUpdate.findById(params.id)
      .populate('submittedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('changeLogs.updatedBy', 'name email');

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
