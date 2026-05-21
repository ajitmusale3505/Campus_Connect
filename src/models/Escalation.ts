import mongoose, { Schema, Document } from 'mongoose';

export interface IEscalation extends Document {
  title: string;
  description: string;
  category: 'chat-abuse' | 'academic' | 'harassment' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: mongoose.Types.ObjectId;
  relatedStudentId?: mongoose.Types.ObjectId;
  relatedChatId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  resolution?: string;
  resolutionDate?: Date;
  attachments?: string[];
  activityLog: {
    action: string;
    performedBy: mongoose.Types.ObjectId;
    timestamp: Date;
    notes?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const EscalationSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['chat-abuse', 'academic', 'harassment', 'technical', 'other'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedStudentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedChatId: {
      type: Schema.Types.ObjectId,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    resolution: {
      type: String,
    },
    resolutionDate: {
      type: Date,
    },
    attachments: {
      type: [String],
    },
    activityLog: [{
      action: {
        type: String,
        required: true,
      },
      performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
      },
    }],
  },
  {
    timestamps: true,
  }
);

const Escalation: mongoose.Model<IEscalation> =
  mongoose.models.Escalation || mongoose.model<IEscalation>('Escalation', EscalationSchema);

export default Escalation;
