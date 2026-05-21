import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMark extends Document {
  userId: mongoose.Types.ObjectId;
  assessment: string;
  subject: string;
  score: number;
  total: number;
  date: Date;
  semester?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarkSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessment: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    semester: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
MarkSchema.index({ userId: 1, date: -1 });

const Mark: Model<IMark> = 
  mongoose.models.Mark || mongoose.model<IMark>('Mark', MarkSchema);

export default Mark;
