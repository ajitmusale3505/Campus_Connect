import mongoose, { Schema, Document, Model } from 'mongoose';

interface IAnswer {
  text: string;
  upvotes: number;
  isAnonymous: boolean;
  authorId?: mongoose.Types.ObjectId;
  files?: string[];
  createdAt: Date;
}

export interface IDoubt extends Document {
  studentId?: mongoose.Types.ObjectId;
  question: string;
  text: string;
  subject?: string;
  timestamp: Date;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  isResolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  answers: IAnswer[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema: Schema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    files: [{
      type: String,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const DoubtSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    answers: [AnswerSchema],
    isAnonymous: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Doubt: Model<IDoubt> = 
  mongoose.models.Doubt || mongoose.model<IDoubt>('Doubt', DoubtSchema);

export default Doubt;
