import mongoose, { Document, Schema } from 'mongoose';

export interface IColumn extends Document {
  name: string;
  board: mongoose.Types.ObjectId;
  tasks: mongoose.Types.ObjectId[];
  order: number;
  color: string;
}

const columnSchema = new Schema<IColumn>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  order: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#E5E7EB'
  }
}, {
  timestamps: true
});

export default mongoose.model<IColumn>('Column', columnSchema);
