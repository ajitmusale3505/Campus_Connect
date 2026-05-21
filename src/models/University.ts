import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  shortName: string;
  website: string;
  location: string;
  type?: string;
  established?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    shortName: { type: String, required: true, unique: true, uppercase: true, index: true },
    website: { type: String, default: '' },
    location: { type: String, default: '' },
    type: { type: String, default: '' },
    established: { type: Number },
  },
  { timestamps: true }
);

const University: Model<IUniversity> =
  mongoose.models.University || mongoose.model<IUniversity>('University', UniversitySchema);

export default University;
