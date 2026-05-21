import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialRecord extends Document {
  department: string;
  budgetAllocated: number;
  budgetSpent: number;
  category: 'infrastructure' | 'equipment' | 'maintenance' | 'supplies' | 'events' | 'other';
  description: string;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  requestDate: Date;
  approvalDate?: Date;
  completionDate?: Date;
  attachments?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialRecordSchema: Schema = new Schema(
  {
    department: {
      type: String,
      required: true,
      index: true,
    },
    budgetAllocated: {
      type: Number,
      required: true,
    },
    budgetSpent: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['infrastructure', 'equipment', 'maintenance', 'supplies', 'events', 'other'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    attachments: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

const FinancialRecord: mongoose.Model<IFinancialRecord> =
  mongoose.models.FinancialRecord || mongoose.model<IFinancialRecord>('FinancialRecord', FinancialRecordSchema);

export default FinancialRecord;
