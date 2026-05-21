import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch all messages for a specific room
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }
    
    // Ensure User model is registered
    if (!User) console.log("User model not found");
    
    const { roomId } = params;
    
    const messages = await ChatMessage.find({ roomId })
      .populate('authorId', 'name avatarUrl role')
      .populate('replies.authorId', 'name avatarUrl role')
      .sort({ timestamp: 1 }); // Oldest first for chat history
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new message in a room
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { roomId } = params;
    const body = await request.json();
    
    const { text, isAnonymous, attachments } = body;
    const normalizedText = (text || '').trim();
    const normalizedAttachments = Array.isArray(attachments)
      ? attachments
          .filter((item) => item?.url)
          .map((item) => ({
            name: item.name || 'attachment',
            url: item.url,
            type: item.type || 'document',
          }))
      : [];
    
    if (!normalizedText && normalizedAttachments.length === 0) {
      return NextResponse.json(
        { error: 'Message text or attachment is required' },
        { status: 400 }
      );
    }
    
    const newMessage = await ChatMessage.create({
      roomId,
      authorId: authUser.userId,
      text: normalizedText || 'Attachment',
      attachments: normalizedAttachments,
      isAnonymous: !!isAnonymous,
      timestamp: new Date(),
    });
    
    // Fetch the inserted message and populate author so we can return it
    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate('authorId', 'name avatarUrl role');
      
    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to post message' },
      { status: 500 }
    );
  }
}
