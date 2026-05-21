import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILibraryResource extends Document {
  title: string;
  author: string;
  type: 'pdf' | 'video' | 'paper' | 'book';
  tags: string[];
  url: string;
  description?: string;
  subject?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadDate: Date;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryResourceSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['pdf', 'video', 'paper', 'book'],
      default: 'pdf',
    },
    tags: [{
      type: String,
      index: true,
    }],
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '',
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
LibraryResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

const LibraryResource: Model<ILibraryResource> = 
  mongoose.models.LibraryResource || mongoose.model<ILibraryResource>('LibraryResource', LibraryResourceSchema);

export default LibraryResource;
