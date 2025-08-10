import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  boards: mongoose.Types.ObjectId[];
  isPublic: boolean;
  color: string;
}

const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  boards: [{
    type: Schema.Types.ObjectId,
    ref: 'Board'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#3B82F6'
  }
}, {
  timestamps: true
});

export default mongoose.model<IProject>('Project', projectSchema);
