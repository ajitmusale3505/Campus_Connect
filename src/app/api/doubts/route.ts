import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doubt from '@/models/Doubt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// GET - Fetch doubts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    console.log('=== Doubts GET: Starting ===');

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const isResolved = searchParams.get('isResolved');

    let query: any = {};

    if (studentId) {
      if (authUser.role === 'student' && studentId !== authUser.userId) {
        return unauthorizedResponse('Forbidden', 403);
      }
      query.studentId = studentId;
    }
    if (isResolved !== null && isResolved !== undefined) {
      query.isResolved = isResolved === 'true';
    }

    console.log('=== Doubts GET: Query ===', query);

    const doubts = await Doubt.find(query)
      .populate('studentId', 'name email role avatarUrl')
      .populate('answers.authorId', 'name email role avatarUrl')
      .populate('resolvedBy', 'name email role')
      .sort({ timestamp: -1 })
      .lean();

    console.log('=== Doubts GET: Found ===', doubts.length);

    return NextResponse.json(
      { success: true, data: doubts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('=== Doubts GET: Error ===', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create doubt
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user from token
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const body = await request.json();
    
    // Create doubt with authenticated user ID
    // If isAnonymous is true, we still save studentId for tracking but won't display it
    const doubtData = {
      ...body,
      studentId: decoded.userId,
      isAnonymous: body.isAnonymous !== undefined ? body.isAnonymous : true,
      text: body.question || body.text, // Support both field names
    };

    const doubt = await Doubt.create(doubtData);

    return NextResponse.json({ success: true, data: doubt }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating doubt:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - Update doubt (add reply, upvote, resolve)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Doubt ID is required' }, { status: 400 });
    }

    let doubt;

    switch (action) {
      case 'addReply':
        doubt = await Doubt.findByIdAndUpdate(
          id,
          { $push: { replies: data.reply } },
          { new: true, runValidators: true }
        ).populate('studentId', 'name email role avatarUrl')
         .populate('replies.authorId', 'name email role avatarUrl');
        break;

      case 'upvote':
        doubt = await Doubt.findByIdAndUpdate(
          id,
          { 
            $inc: { upvotes: 1 },
            $addToSet: { upvotedBy: data.userId }
          },
          { new: true }
        );
        break;

      case 'resolve':
        if (!['teacher', 'hod', 'principal'].includes(authUser.role)) {
          return unauthorizedResponse('Only faculty can resolve doubts', 403);
        }

        doubt = await Doubt.findByIdAndUpdate(
          id,
          { 
            isResolved: true,
            resolvedBy: authUser.userId
          },
          { new: true }
        );
        break;

      default:
        doubt = await Doubt.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        });
    }

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doubt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete doubt
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Doubt ID is required' }, { status: 400 });
    }

    const doubt = await Doubt.findByIdAndDelete(id);

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
