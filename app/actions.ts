'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Types
export type Project = {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  tasks: Task[];
};

export type Task = {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: Date;
  createdAt: Date;
};

// In-memory storage (replace with DB later)
let projects: Project[] = [];
let nextProjectId = 1;
let nextTaskId = 1;

// Validation Schemas
const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
});

const createTaskSchema = z.object({
  projectId: z.coerce.number(),
  title: z.string().min(3, "Task title must be at least 3 characters"),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// Get all projects
export async function getProjects(): Promise<Project[]> {
  return projects;
}

// Create Project
export async function createProject(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
  };

  const result = createProjectSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const newProject: Project = {
    id: nextProjectId++,
    name: result.data.name,
    description: result.data.description,
    createdAt: new Date(),
    tasks: [],
  };

  projects.unshift(newProject);
  revalidatePath('/');

  return { success: true };
}

// Create Task (placeholder for now)
export async function createTask(formData: FormData) {
  const rawData = {
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    priority: formData.get('priority'),
  };

  const result = createTaskSchema.safeParse(rawData);

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Find project
  const project = projects.find(p => p.id === result.data.projectId);
  if (!project) {
    return { success: false, message: 'Project not found' };
  }

  const newTask: Task = {
    id: nextTaskId++,
    projectId: result.data.projectId,
    title: result.data.title,
    priority: result.data.priority,
    status: 'todo',
    createdAt: new Date(),
  };

  project.tasks.unshift(newTask);
  revalidatePath('/');

  return { success: true };
}
