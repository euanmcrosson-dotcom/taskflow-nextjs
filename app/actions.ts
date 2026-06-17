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

// In-memory storage
let projects: Project[] = [];
let nextProjectId = 1;
let nextTaskId = 1;

// Schemas
const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

const createTaskSchema = z.object({
  projectId: z.coerce.number(),
  title: z.string().min(3),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
});

// Get Projects
export async function getProjects() {
  return projects;
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

  const project = projects.find(p => p.id === result.data.projectId);
  if (!project) return { success: false, message: 'Project not found' };

  const newTask: Task = {
    id: nextTaskId++,
    projectId: result.data.projectId,
    title: result.data.title,
    priority: result.data.priority,
    status: 'todo',
    dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
    createdAt: new Date(),
  };

  project.tasks.unshift(newTask);
  revalidatePath('/');
  return { success: true };
}

// Toggle Task Status
export async function toggleTaskStatus(taskId: number) {
  for (const project of projects) {
    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = task.status === 'done' ? 'todo' : 'done';
      revalidatePath('/');
      return { success: true };
    }
  }
  return { success: false };
}

// Delete Task
export async function deleteTask(taskId: number) {
  for (const project of projects) {
    const index = project.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      project.tasks.splice(index, 1);
      revalidatePath('/');
      return { success: true };
    }
  }
  return { success: false };
}

// Delete Project
export async function deleteProject(projectId: number) {
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects.splice(index, 1);
    revalidatePath('/');
    return { success: true };
  }
  return { success: false };
}
