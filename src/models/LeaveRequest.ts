import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveRequest extends Document {
  facultyId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: 'sick' | 'personal' | 'conference' | 'emergency' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  substituteTeacherId?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  comments?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema: Schema = new Schema(
  {
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['sick', 'personal', 'conference', 'emergency', 'other'],
      default: 'personal',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    substituteTeacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    comments: {
      type: String,
    },
    attachments: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

const LeaveRequest: mongoose.Model<ILeaveRequest> =
  mongoose.models.LeaveRequest || mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);

export default LeaveRequest;
