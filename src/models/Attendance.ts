import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  date: Date;
  timestamp?: Date;
  status: 'present' | 'absent' | 'late';
  markedVia?: 'QR' | 'Manual';
  qrTokenUsed?: string;
  subject?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    markedVia: {
      type: String,
      enum: ['QR', 'Manual'],
      default: 'Manual',
    },
    qrTokenUsed: {
      type: String,
      default: '',
    },
    subject: {
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

// Compound index for user and date
AttendanceSchema.index({ userId: 1, date: 1 });
AttendanceSchema.index(
  { studentId: 1, batchId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: {
      studentId: { $exists: true },
      batchId: { $exists: true },
    },
  }
);
AttendanceSchema.index({ batchId: 1, subjectId: 1, date: 1 });

const Attendance: Model<IAttendance> = 
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
