import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBatch extends Document {
  batchCode: string;
  subjectId: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  year: 'FE' | 'SE' | 'TE' | 'BE';
  semester: number;
  academicYear: string;
  maxStudents: number;
  studentIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema: Schema = new Schema(
  {
    batchCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    year: { type: String, required: true, enum: ['FE', 'SE', 'TE', 'BE'], index: true },
    semester: { type: Number, required: true, min: 1, max: 8, index: true },
    academicYear: { type: String, required: true, index: true },
    maxStudents: { type: Number, default: 60, min: 1 },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BatchSchema.index({ teacherId: 1, isActive: 1 });
BatchSchema.index({ departmentId: 1, semester: 1, isActive: 1 });

const Batch: Model<IBatch> = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);

export default Batch;
