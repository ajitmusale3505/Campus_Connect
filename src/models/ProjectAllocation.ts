import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone {
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedAt?: Date;
  feedback?: string;
}

export interface IProjectAllocation extends Document {
  projectTitle: string;
  department: string;
  batch: string;
  students: mongoose.Types.ObjectId[];
  guideId: mongoose.Types.ObjectId;
  coGuideId?: mongoose.Types.ObjectId;
  description: string;
  techStack?: string[];
  status: 'proposed' | 'ongoing' | 'completed' | 'cancelled';
  milestones: IMilestone[];
  submissionDate?: Date;
  grade?: number;
  finalFeedback?: string;
  presentationDate?: Date;
  attendees?: string[];
  presentationFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed'],
    default: 'pending',
  },
  completedAt: {
    type: Date,
  },
  feedback: {
    type: String,
  },
});

const ProjectAllocationSchema: Schema = new Schema(
  {
    projectTitle: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    batch: {
      type: String,
      required: true,
    },
    students: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    guideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coGuideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
      required: true,
    },
    techStack: {
      type: [String],
    },
    status: {
      type: String,
      enum: ['proposed', 'ongoing', 'completed', 'cancelled'],
      default: 'proposed',
      index: true,
    },
    milestones: [MilestoneSchema],
    submissionDate: {
      type: Date,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    finalFeedback: {
      type: String,
    },
    presentationDate: {
      type: Date,
    },
    attendees: {
      type: [String],
    },
    presentationFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectAllocation: mongoose.Model<IProjectAllocation> =
  mongoose.models.ProjectAllocation || mongoose.model<IProjectAllocation>('ProjectAllocation', ProjectAllocationSchema);

export default ProjectAllocation;
