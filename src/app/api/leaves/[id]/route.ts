import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// PATCH - Update leave request status (Approve/Reject)
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

    if (!hasRole(authUser, ['hod', 'principal'])) {
      return unauthorizedResponse('Only HOD/Principal can review leave requests', 403);
    }

    const id = params.id;
    const body = await request.json();

    const updateData: Record<string, any> = {
      ...body,
    };

    if (updateData.status && ['approved', 'rejected'].includes(updateData.status)) {
      updateData.reviewedBy = authUser.userId;
      updateData.reviewedAt = new Date();
    }
    
    // body could contain status, substituteTeacherId, comments, reviewedBy, reviewedAt
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedLeave) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedLeave });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}
