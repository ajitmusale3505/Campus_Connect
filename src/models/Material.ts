import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
  teacherId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  description: string;
  fileUrl: string;
  fileType: 'pdf' | 'ppt' | 'doc' | 'video' | 'other';
  class: string;
  semester?: string;
  uploadDate: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema(
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
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'ppt', 'doc', 'video', 'other'],
      default: 'pdf',
    },
    class: {
      type: String,
      required: true,
      index: true,
    },
    semester: {
      type: String,
      default: '',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
MaterialSchema.index({ subject: 1, class: 1, uploadDate: -1 });
MaterialSchema.index({ title: 'text', description: 'text' });

const Material: Model<IMaterial> = 
  mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;
