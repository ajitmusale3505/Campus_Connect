import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// POST - Bulk create notifications
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    // Only teachers, HODs, and principals can send bulk notifications
    if (!['teacher', 'hod', 'principal'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, text, type, category, link } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Create notification for each user
    const notifications = userIds.map(userId => ({
      userId,
      text,
      type: type || 'info',
      category: category || 'general',
      link: link || '',
      timestamp: new Date(),
      read: false,
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    return NextResponse.json({ 
      success: true, 
      data: createdNotifications,
      count: createdNotifications.length 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bulk notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
