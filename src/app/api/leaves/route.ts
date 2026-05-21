import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import User from '@/models/User';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch all leave requests
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Forbidden', 403);
    }
    
    // Ensure User model is registered before populating
    if (!User) console.log("User model not found"); 

    const query: Record<string, any> = {};
    if (authUser.role === 'teacher') {
      query.facultyId = authUser.userId;
    }
    
    const leaves = await LeaveRequest.find(query)
      .populate('facultyId', 'name email department')
      .populate('substituteTeacherId', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new leave request
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const body = await request.json();

    const leavePayload = {
      ...body,
      facultyId: authUser.userId,
      status: 'pending',
    };
    
    const leave = await LeaveRequest.create(leavePayload);
    
    return NextResponse.json({ success: true, data: leave }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
