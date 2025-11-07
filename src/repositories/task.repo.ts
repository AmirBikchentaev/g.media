import mongoose from 'mongoose';
import { TaskModel, TaskStatus } from '../models/task.model.js';

export function toClient(task: any) {
  // нормализуем под строки ISO и id как string
  return {
    id: String(task._id),
    title: task.title,
    description: task.description ?? null,
    dueDate: new Date(task.dueDate).toISOString(),
    status: task.status as TaskStatus,
    createdAt: new Date(task.createdAt).toISOString(),
    updatedAt: new Date(task.updatedAt).toISOString(),
  };
}

export async function getTaskById(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  const task = await TaskModel.findById(id).exec();
  return task ? toClient(task) : null;
}

export async function listTasks(status?: TaskStatus) {
  const where = status ? { status } : {};
  const tasks = await TaskModel.find(where).sort({ createdAt: -1 }).exec();
  return tasks.map(toClient);
}

export async function createTask(input: {
  title: string; description?: string | null; dueDate: string; status?: TaskStatus;
}) {
  const doc = await TaskModel.create({
    title: input.title,
    description: input.description ?? null,
    dueDate: new Date(input.dueDate),
    status: input.status ?? 'pending',
  });
  return toClient(doc);
}

export async function updateTask(id: string, input: {
  title?: string; description?: string | null; status?: TaskStatus;
}) {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await TaskModel.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true }
  ).exec();
  return doc ? toClient(doc) : null;
}
