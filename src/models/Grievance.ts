import mongoose, { Schema, Document } from 'mongoose';

export interface IGrievance extends Document {
  submittedBy?: mongoose.Types.ObjectId;
  isAnonymous: boolean;
  category: 'academic' | 'infrastructure' | 'harassment' | 'administrative' | 'financial' | 'other';
  subject: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'under-review' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  assignedCommittee?: string;
  resolution?: string;
  resolutionDate?: Date;
  timeline: {
    action: string;
    performedBy?: mongoose.Types.ObjectId;
    timestamp: Date;
    notes?: string;
  }[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GrievanceSchema: Schema = new Schema(
  {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['academic', 'infrastructure', 'harassment', 'administrative', 'financial', 'other'],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'assigned', 'in-progress', 'resolved', 'closed'],
      default: 'submitted',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedCommittee: {
      type: String,
    },
    resolution: {
      type: String,
    },
    resolutionDate: {
      type: Date,
    },
    timeline: [{
      action: {
        type: String,
        required: true,
      },
      performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    }],
    attachments: [String],
  },
  {
    timestamps: true,
  }
);

const Grievance: mongoose.Model<IGrievance> =
  mongoose.models.Grievance || mongoose.model<IGrievance>('Grievance', GrievanceSchema);

export default Grievance;
