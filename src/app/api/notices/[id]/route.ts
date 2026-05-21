import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notice from '@/models/Notice';
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

    if (authUser.role !== 'principal') {
      return unauthorizedResponse('Only principal can update notices', 403);
    }

    const body = await request.json();
    const updateData: Record<string, any> = {
      ...body,
    };

    if (body.publishDate) {
      updateData.publishDate = new Date(body.publishDate);
    }

    if (body.expiryDate) {
      updateData.expiryDate = new Date(body.expiryDate);
    }

    const notice = await Notice.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!notice) {
      return NextResponse.json({ success: false, error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: notice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

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

    if (authUser.role !== 'principal') {
      return unauthorizedResponse('Only principal can delete notices', 403);
    }

    const notice = await Notice.findByIdAndDelete(params.id);

    if (!notice) {
      return NextResponse.json({ success: false, error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
