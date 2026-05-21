import mongoose, { Schema, Document, Model } from 'mongoose';

interface ISubmission {
  studentId: mongoose.Types.ObjectId;
  submittedAt: Date;
  fileUrl?: string;
  content?: string;
  attachments?: string[];
  comments?: string;
  grade?: number | null;
  feedback?: string;
  annotations?: string[];
  gradedAt?: Date | null;
}

export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  class: string;
  totalMarks: number;
  dueDate: Date;
  rubric?: string;
  attachments?: string[];
  submissions: ISubmission[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String,
    },
    content: {
      type: String,
    },
    attachments: {
      type: [String],
    },
    comments: {
      type: String,
    },
    grade: {
      type: Number,
      min: 0,
      default: null,
    },
    feedback: {
      type: String,
    },
    annotations: {
      type: [String],
    },
    gradedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const AssignmentSchema: Schema = new Schema(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    rubric: {
      type: String,
    },
    attachments: [{
      type: String,
    }],
    submissions: [SubmissionSchema],
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Assignment: Model<IAssignment> = 
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
