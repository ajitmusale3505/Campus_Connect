import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import Notification from '@/models/Notification';

// GET - Fetch all events (public for all authenticated users)
export async function GET() {
  try {
    console.log('=== Events GET: Starting ===');
    await dbConnect();
    
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ startDate: 1 })
      .lean(); // Use lean() for faster queries
    
    console.log('=== Events GET: Found ===', events.length, 'events');
    
    const response = NextResponse.json(events);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    console.error('=== Events GET: Error ===', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Create new event with conflict detection (principal only)
export async function POST(request: NextRequest) {
  try {
    console.log('=== Events POST: Starting ===');
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      console.log('=== Events POST: No token ===');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      role: string;
    };
    
    console.log('=== Events POST: Decoded ===', { userId: decoded.userId, role: decoded.role });
    
    if (decoded.role !== 'principal') {
      console.log('=== Events POST: Not principal ===');
      return NextResponse.json({ error: 'Only principals can create events' }, { status: 403 });
    }
    
    const body = await request.json();
    console.log('=== Events POST: Body ===', body);
    
    // Check for conflicts
    const conflicts = await Event.find({
      venue: body.venue,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startDate: { $lte: body.endDate },
          endDate: { $gte: body.startDate }
        }
      ]
    });
    
    console.log('=== Events POST: Conflicts found ===', conflicts.length);
    
    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Conflict detected',
          conflicts: conflicts.map(c => ({
            id: c._id,
            title: c.title,
            startDate: c.startDate,
            endDate: c.endDate
          }))
        },
        { status: 409 }
      );
    }
    
    const event = await Event.create({
      ...body,
      organizer: decoded.userId,
      status: body.status || 'scheduled'
    });
    
    console.log('=== Events POST: Created ===', event);
    
    // Create notifications for all users (students and teachers)
    try {
      const allUsers = await User.find({ 
        role: { $in: ['student', 'teacher'] } 
      }).select('_id');
      
      const notifications = allUsers.map(user => ({
        userId: user._id,
        text: `New event scheduled: ${body.title} on ${new Date(body.startDate).toLocaleDateString()}`,
        type: 'info',
        category: 'event',
        link: body.eventType === 'exam' ? '/student' : '/student/events',
        timestamp: new Date(),
        read: false
      }));
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log('=== Events POST: Created notifications ===', notifications.length);
      }
    } catch (notifError) {
      console.error('=== Events POST: Notification Error ===', notifError);
      // Don't fail the event creation if notifications fail
    }
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('=== Events POST: Error ===', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
