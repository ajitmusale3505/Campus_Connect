import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollege extends Document {
  universityId: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  location: string;
  aicteApproved: boolean;
  accreditation: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema: Schema = new Schema(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    name: { type: String, required: true, index: true },
    shortName: { type: String, required: true, index: true },
    location: { type: String, default: '' },
    aicteApproved: { type: Boolean, default: true },
    accreditation: { type: String, default: '' },
  },
  { timestamps: true }
);

CollegeSchema.index({ universityId: 1, shortName: 1 }, { unique: true });

const College: Model<ICollege> =
  mongoose.models.College || mongoose.model<ICollege>('College', CollegeSchema);

export default College;
