import mongoose, { Schema, Document, Model } from 'mongoose';

interface IAttachment {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document';
}

interface IChatReply {
  authorId: mongoose.Types.ObjectId;
  text: string;
  attachments: IAttachment[];
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  timestamp: Date;
}

export interface IChatMessage extends Document {
  roomId: string;
  authorId: mongoose.Types.ObjectId;
  text: string;
  attachments: IAttachment[];
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  timestamp: Date;
  replies: IChatReply[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['image', 'pdf', 'document'],
    },
  },
  { _id: false }
);

const ChatReplySchema: Schema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    attachments: [AttachmentSchema],
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ChatMessageSchema: Schema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    attachments: [AttachmentSchema],
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    replies: [ChatReplySchema],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient chat room queries
ChatMessageSchema.index({ roomId: 1, timestamp: -1 });

const ChatMessage: Model<IChatMessage> = 
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
