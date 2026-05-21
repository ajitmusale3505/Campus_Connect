import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// PUT - Update single notification
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

    const notificationId = params.id;
    const body = await request.json();

    const existing = await Notification.findById(notificationId);
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (
      existing.userId.toString() !== authUser.userId &&
      !hasRole(authUser, ['teacher', 'hod', 'principal'])
    ) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      body,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete notification
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

    const notificationId = params.id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (
      notification.userId.toString() !== authUser.userId &&
      !hasRole(authUser, ['teacher', 'hod', 'principal'])
    ) {
      return unauthorizedResponse('Forbidden', 403);
    }

    await Notification.findByIdAndDelete(notificationId);

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
