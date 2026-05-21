import mongoose, { Schema, Document } from 'mongoose';

export interface IChangeLog {
  version: string;
  changes: string;
  updatedBy: mongoose.Types.ObjectId;
  effectiveDate: Date;
  createdAt: Date;
}

export interface ISyllabusUpdate extends Document {
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  submittedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'revision-requested';
  documentType: 'syllabus' | 'lab-manual' | 'reference-material' | 'other';
  currentVersion: string;
  content: string;
  attachments?: string[];
  changeLogs: IChangeLog[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComments?: string;
  effectiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChangeLogSchema: Schema = new Schema({
  version: {
    type: String,
    required: true,
  },
  changes: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  effectiveDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SyllabusUpdateSchema: Schema = new Schema(
  {
    courseCode: {
      type: String,
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision-requested'],
      default: 'pending',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['syllabus', 'lab-manual', 'reference-material', 'other'],
      required: true,
    },
    currentVersion: {
      type: String,
      default: '1.0',
    },
    content: {
      type: String,
      required: true,
    },
    attachments: {
      type: [String],
    },
    changeLogs: [ChangeLogSchema],
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewComments: {
      type: String,
    },
    effectiveDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const SyllabusUpdate: mongoose.Model<ISyllabusUpdate> =
  mongoose.models.SyllabusUpdate || mongoose.model<ISyllabusUpdate>('SyllabusUpdate', SyllabusUpdateSchema);

export default SyllabusUpdate;
