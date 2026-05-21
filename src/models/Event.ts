import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  organizer: mongoose.Types.ObjectId;
  department?: string;
  eventType: 'seminar' | 'workshop' | 'conference' | 'cultural' | 'sports' | 'exam' | 'other';
  startDate: Date;
  endDate: Date;
  venue: string;
  capacity?: number;
  registeredParticipants: mongoose.Types.ObjectId[];
  targetAudience: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  conflictsWith?: mongoose.Types.ObjectId[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    department: {
      type: String,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['seminar', 'workshop', 'conference', 'cultural', 'sports', 'exam', 'other'],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
    },
    registeredParticipants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    targetAudience: [String],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    conflictsWith: [{
      type: Schema.Types.ObjectId,
      ref: 'Event',
    }],
    attachments: [String],
  },
  {
    timestamps: true,
  }
);

// Index for conflict detection
EventSchema.index({ venue: 1, startDate: 1, endDate: 1 });

const Event: mongoose.Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
