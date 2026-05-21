import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doubt from '@/models/Doubt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// POST - Upvote doubt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const doubtId = params.id;
    
    // Check if user already upvoted
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    if (doubt.upvotedBy.includes(decoded.userId as any)) {
      return NextResponse.json({ error: 'Already upvoted' }, { status: 400 });
    }

    // Add upvote and track user
    const updatedDoubt = await Doubt.findByIdAndUpdate(
      doubtId,
      { 
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: decoded.userId }
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedDoubt });
  } catch (error: any) {
    console.error('Error upvoting doubt:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
