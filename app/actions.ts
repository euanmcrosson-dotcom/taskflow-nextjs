'use server';

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Validation Schemas
const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const createTaskSchema = z.object({
  projectId: z.coerce.number(),
  title: z.string().min(3),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
});

// Get all projects with tasks
export async function getProjects() {
  return prisma.project.findMany({
    include: { tasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Create Project
export async function createProject(formData: FormData) {
  const result = createProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  await prisma.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
    },
  });

  revalidatePath('/');
  return { success: true };
}

// Create Task
export async function createTask(formData: FormData) {
  const result = createTaskSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
  });

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  await prisma.task.create({
    data: {
      projectId: result.data.projectId,
      title: result.data.title,
      priority: result.data.priority,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
    },
  });

  revalidatePath('/');
  return { success: true };
}

// Toggle Task Status
export async function toggleTaskStatus(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { success: false };

  const newStatus = task.status === 'done' ? 'todo' : 'done';

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  revalidatePath('/');
  return { success: true };
}

// Delete Task
export async function deleteTask(taskId: number) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath('/');
  return { success: true };
}

// Delete Project
export async function deleteProject(projectId: number) {
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath('/');
  return { success: true };
}
