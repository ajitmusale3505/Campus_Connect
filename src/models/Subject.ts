import mongoose, { Schema, Document, Model } from 'mongoose';

export type AcademicYear = 'FE' | 'SE' | 'TE' | 'BE';
export type SubjectType = 'Theory' | 'Lab' | 'Practical' | 'Elective' | 'Project' | 'Seminar' | 'Viva';

export interface ISubject extends Document {
  departmentId: mongoose.Types.ObjectId;
  collegeId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  type: SubjectType;
  credits: number;
  hoursPerWeek: number;
  year: AcademicYear;
  semester: number;
  isCommon: boolean;
  branchCode: 'CE' | 'AIML' | 'AIDS' | 'ENTC';
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema: Schema = new Schema(
  {
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    code: { type: String, required: true, uppercase: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['Theory', 'Lab', 'Practical', 'Elective', 'Project', 'Seminar', 'Viva'],
    },
    credits: { type: Number, required: true, min: 0 },
    hoursPerWeek: { type: Number, required: true, min: 0 },
    year: { type: String, required: true, enum: ['FE', 'SE', 'TE', 'BE'], index: true },
    semester: { type: Number, required: true, min: 1, max: 8, index: true },
    isCommon: { type: Boolean, default: false, index: true },
    branchCode: { type: String, required: true, enum: ['CE', 'AIML', 'AIDS', 'ENTC'], index: true },
  },
  { timestamps: true }
);

SubjectSchema.index({ departmentId: 1, code: 1 }, { unique: true });
SubjectSchema.index({ collegeId: 1, branchCode: 1, year: 1, semester: 1 });

const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);

export default Subject;
