import mongoose, { Schema, Document } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  targetAudience: {
    departments?: string[];
    years?: number[];
    roles?: ('student' | 'teacher' | 'hod' | 'principal')[];
    specific?: mongoose.Types.ObjectId[];
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'academic' | 'administrative' | 'event' | 'examination' | 'general';
  publishDate: Date;
  expiryDate?: Date;
  attachments?: string[];
  isActive: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetAudience: {
      departments: [String],
      years: [Number],
      roles: [String],
      specific: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    category: {
      type: String,
      enum: ['academic', 'administrative', 'event', 'examination', 'general'],
      required: true,
      index: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    attachments: [String],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

const Notice: mongoose.Model<INotice> =
  mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;
