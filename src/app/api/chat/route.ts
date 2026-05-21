import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch chat messages
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const messages = await ChatMessage.find({ roomId })
      .populate('authorId', 'name email role avatarUrl')
      .populate('replies.authorId', 'name email role avatarUrl')
      .sort({ timestamp: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create chat message
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const message = await ChatMessage.create({
      ...body,
      authorId: authUser.userId,
    });

    const populatedMessage = await ChatMessage.findById((message as any)._id)
      .populate('authorId', 'name email role avatarUrl');

    return NextResponse.json({ success: true, data: populatedMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - Update chat message (add reply, upvote)
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
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    let message;

    switch (action) {
      case 'addReply':
        message = await ChatMessage.findByIdAndUpdate(
          id,
          { $push: { replies: data.reply } },
          { new: true, runValidators: true }
        ).populate('authorId', 'name email role avatarUrl')
         .populate('replies.authorId', 'name email role avatarUrl');
        break;

      case 'upvote':
        message = await ChatMessage.findByIdAndUpdate(
          id,
          { 
            $inc: { upvotes: 1 },
            $addToSet: { upvotedBy: data.userId }
          },
          { new: true }
        );
        break;

      default:
        message = await ChatMessage.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete chat message
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await ChatMessage.findByIdAndDelete(id);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
