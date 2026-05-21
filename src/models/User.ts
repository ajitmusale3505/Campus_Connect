import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'hod' | 'principal';
  avatarUrl: string;
  qrCode?: string;
  phone?: string;
  rollNumber?: string;
  enrollmentNumber?: string;
  universityId?: mongoose.Types.ObjectId;
  collegeId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  year?: 'FE' | 'SE' | 'TE' | 'BE';
  semester?: number;
  teachingSemesters?: number[];
  address?: string;
  department?: string;
  batchIds?: mongoose.Types.ObjectId[];
  subjectIds?: mongoose.Types.ObjectId[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'hod', 'principal'],
      default: 'student',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    qrCode: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    rollNumber: {
      type: String,
      default: '',
      index: true,
    },
    enrollmentNumber: {
      type: String,
      default: '',
      index: true,
    },
    universityId: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      index: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    year: {
      type: String,
      enum: ['FE', 'SE', 'TE', 'BE'],
      index: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      index: true,
    },
    teachingSemesters: [{
      type: Number,
      min: 1,
      max: 8,
    }],
    address: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    batchIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Batch',
    }],
    subjectIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    }],
    isVerified: {
      type: Boolean,
      default: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1, collegeId: 1, departmentId: 1 });

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
