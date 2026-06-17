'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { 
  createProject, 
  createTask, 
  toggleTaskStatus, 
  deleteTask, 
  deleteProject,
  getProjects 
} from './actions';
import { format } from 'date-fns';

// Types for client state
type Project = {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  tasks: any[];
};

// Server action wrapper for forms
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="btn btn-primary disabled:opacity-70"
    >
      {pending ? 'Processing...' : children}
    </button>
  );
}

export default function TaskFlow() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Load projects on mount
  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data as any);
  };

  // Initial load
  useState(() => {
    loadProjects();
  });

  // Create Project action
  const [createProjectState, createProjectAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createProject(formData);
      if (result.success) {
        await loadProjects();
        setShowCreateProject(false);
      }
      return result;
    },
    { success: false }
  );

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">TaskFlow</h1>
          <p className="text-zinc-400 mt-2 text-lg">Powerful task management with secure Server Actions</p>
        </div>
        <button 
          onClick={() => setShowCreateProject(!showCreateProject)}
          className="btn btn-primary px-6"
        >
          {showCreateProject ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateProject && (
        <div className="card mb-8 max-w-md">
          <h3 className="font-semibold mb-4">Create New Project</h3>
          <form action={createProjectAction} className="space-y-4">
            <input 
              type="text" 
              name="name" 
              placeholder="Project name" 
              className="input" 
              required 
            />
            <textarea 
              name="description" 
              placeholder="Description (optional)" 
              className="input h-20 resize-y" 
            />
            <SubmitButton>Create Project</SubmitButton>
            
            {createProjectState?.errors && (
              <div className="text-red-400 text-sm">
                {Object.values(createProjectState.errors).flat().join(', ')}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full card text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-zinc-400">Create your first project to get started</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{project.name}</h3>
                  {project.description && (
                    <p className="text-zinc-400 mt-1 text-sm">{project.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full">
                    {project.tasks.length} tasks
                  </div>
                  <button 
                    onClick={() => deleteProject(project.id)}
                    className="text-red-400 hover:text-red-500 text-sm px-3 py-1 hover:bg-zinc-800 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Create Task Form */}
              <form 
                action={async (formData) => {
                  formData.append('projectId', project.id.toString());
                  await createTask(formData);
                  await loadProjects();
                }} 
                className="flex gap-2 mb-6"
              >
                <input 
                  type="text" 
                  name="title" 
                  placeholder="New task title" 
                  className="input flex-1" 
                  required 
                />
                <select name="priority" className="input w-28">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                </select>
                <input 
                  type="date" 
                  name="dueDate" 
                  className="input w-40" 
                />
                <SubmitButton>Add</SubmitButton>
              </form>

              {/* Tasks List */}
              <div className="space-y-2">
                {project.tasks.length === 0 ? (
                  <div className="text-zinc-500 text-sm py-4 text-center border border-dashed border-zinc-800 rounded-lg">
                    No tasks yet
                  </div>
                ) : (
                  project.tasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button 
                          onClick={async () => {
                            await toggleTaskStatus(task.id);
                            await loadProjects();
                          }}
                          className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-all
                            ${task.status === 'done' 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-zinc-600 hover:border-zinc-400'}
                          `}
                        >
                          {task.status === 'done' && '✓'}
                        </button>

                        <div className="flex-1">
                          <div className={`${task.status === 'done' ? 'line-through text-zinc-500' : ''}`}>
                            {task.title}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            {/* Priority Badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium
                              ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-blue-500/20 text-blue-400'}
                            `}>
                              {task.priority}
                            </span>

                            {task.dueDate && (
                              <span className="text-[10px] text-zinc-500">
                                Due {format(new Date(task.dueDate), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={async () => {
                          await deleteTask(task.id);
                          await loadProjects();
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 text-xs px-2 py-1 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 text-center text-xs text-zinc-500">
        Built with Next.js Server Actions • All mutations are secure & validated
      </div>
    </div>
  );
}