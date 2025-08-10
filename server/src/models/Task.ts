import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  column: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  dueDate?: Date;
  tags: string[];
  order: number;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  column: {
    type: Schema.Types.ObjectId,
    ref: 'Column',
    required: true
  },
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo'
  },
  dueDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<ITask>('Task', taskSchema);
