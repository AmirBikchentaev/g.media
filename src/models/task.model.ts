import mongoose, { Schema, InferSchemaType, model } from 'mongoose';

export const TaskStatus = ['pending', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TaskStatus)[number];

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: null },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: TaskStatus, default: 'pending', required: true },
}, { timestamps: true });

export type TaskDoc = InferSchemaType<typeof TaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TaskModel = model<TaskDoc>('Task', TaskSchema);
