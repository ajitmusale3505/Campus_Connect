import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doubt from '@/models/Doubt';
import mongoose from 'mongoose';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// POST - Add answer to doubt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const doubtId = params.id;
    const body = await request.json();

    const doubt = await Doubt.findById(doubtId);

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    const answer = {
      text: body.text,
      upvotes: 0,
      isAnonymous: body.isAnonymous !== undefined ? body.isAnonymous : true,
      files: body.files || [],
      createdAt: new Date(),
      authorId: new mongoose.Types.ObjectId(authUser.userId),
    };

    doubt.answers.push(answer);
    await doubt.save();

    return NextResponse.json({ success: true, data: doubt }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding answer:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
