import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doubt from '@/models/Doubt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// POST - Upvote answer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; answerId: string } }
) {
  try {
    await dbConnect();

    // Get authenticated user from token
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { id: doubtId, answerId } = params;

    const doubt = await Doubt.findOneAndUpdate(
      { _id: doubtId, 'answers._id': answerId },
      { $inc: { 'answers.$.upvotes': 1 } },
      { new: true }
    );

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt or answer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doubt });
  } catch (error: any) {
    console.error('Error upvoting answer:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
