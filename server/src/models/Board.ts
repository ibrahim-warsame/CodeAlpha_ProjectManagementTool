import mongoose, { Document, Schema } from 'mongoose';

export interface IBoard extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
  columns: mongoose.Types.ObjectId[];
  order: number;
}

const boardSchema = new Schema<IBoard>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  columns: [{
    type: Schema.Types.ObjectId,
    ref: 'Column'
  }],
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<IBoard>('Board', boardSchema);
