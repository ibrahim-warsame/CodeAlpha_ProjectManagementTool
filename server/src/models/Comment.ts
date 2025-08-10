import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  task: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  mentions: mongoose.Types.ObjectId[];
  attachments: string[];
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    trim: true
  },
  task: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model<IComment>('Comment', commentSchema);
