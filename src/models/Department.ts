import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
  collegeId: mongoose.Types.ObjectId;
  name: string;
  code: 'CE' | 'AIML' | 'AIDS' | 'ENTC';
  duration: string;
  hodId?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, enum: ['CE', 'AIML', 'AIDS', 'ENTC'], index: true },
    duration: { type: String, default: '4 Years / 8 Semesters' },
    hodId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

DepartmentSchema.index({ collegeId: 1, code: 1 }, { unique: true });

const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;
