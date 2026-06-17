'use server';

import { auth } from "./api/auth/[...nextauth]/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Schemas
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

// Get projects for current user
export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.project.findMany({
    where: { userId: session.user.id },
    include: { tasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Create Project
export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Unauthorized" };

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
      userId: session.user.id,
    },
  });

  revalidatePath("/");
  return { success: true };
}

// Create Task
export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const result = createTaskSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
  });

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: result.data.projectId, userId: session.user.id },
  });
  if (!project) return { success: false, message: "Project not found" };

  await prisma.task.create({
    data: {
      projectId: result.data.projectId,
      title: result.data.title,
      priority: result.data.priority,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
    },
  });

  revalidatePath("/");
  return { success: true };
}

// Toggle / Delete with ownership checks (simplified for demo)
export async function toggleTaskStatus(taskId: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.task.updateMany({
    where: { id: taskId, project: { userId: session.user.id } },
    data: { status: { set: await getTaskNewStatus(taskId) } },
  });

  revalidatePath("/");
  return { success: true };
}

async function getTaskNewStatus(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  return task?.status === "done" ? "todo" : "done";
}

// Delete functions with ownership
export async function deleteTask(taskId: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.task.deleteMany({
    where: { id: taskId, project: { userId: session.user.id } },
  });
  revalidatePath("/");
  return { success: true };
}

export async function deleteProject(projectId: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.user.id },
  });
  revalidatePath("/");
  return { success: true };
}
