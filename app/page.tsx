'use client';

import { useState, useEffect } from 'react';
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

// Types
type Task = {
  id: number;
  title: string;
  priority: string;
  status: string;
  dueDate?: string | Date | null;
};

type Project = {
  id: number;
  name: string;
  description?: string;
  tasks: Task[];
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-70">
      {pending ? 'Saving...' : children}
    </button>
  );
}

export default function TaskFlow() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data as any);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Filtered projects
  const filteredProjects = projects
    .map(project => {
      const filteredTasks = project.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      });

      return {
        ...project,
        tasks: filteredTasks,
      };
    })
    .filter(project => 
      project.tasks.length > 0 || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Create Project
  const [createProjectState, createProjectAction] = useActionState(
    async (prev: any, formData: FormData) => {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">TaskFlow</h1>
          <p className="text-zinc-400">Secure task management with Next.js + Prisma</p>
        </div>
        <button 
          onClick={() => setShowCreateProject(!showCreateProject)}
          className="btn btn-primary px-6"
        >
          {showCreateProject ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input flex-1"
        />

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="input w-48"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="input w-48"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
            className="btn px-4 text-sm border border-zinc-700 hover:bg-zinc-800"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Create Project Form */}
      {showCreateProject && (
        <div className="card mb-8 max-w-md">
          <form action={createProjectAction} className="space-y-4">
            <input type="text" name="name" placeholder="Project name" className="input" required />
            <textarea name="description" placeholder="Description" className="input h-20" />
            <SubmitButton>Create Project</SubmitButton>
          </form>
        </div>
      )}

      {/* Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            No projects or tasks match your filters.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{project.name}</h3>
                  {project.description && <p className="text-zinc-400 text-sm mt-1">{project.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full">
                    {project.tasks.length} tasks
                  </div>
                  <button 
                    onClick={async () => {
                      await deleteProject(project.id);
                      await loadProjects();
                    }}
                    className="text-red-400 hover:text-red-500 text-sm"
                  >
                    Delete Project
                  </button>
                </div>
              </div>

              {/* Create Task */}
              <form 
                action={async (formData) => {
                  formData.append('projectId', project.id.toString());
                  const result = await createTask(formData);
                  if (result.success) await loadProjects();
                }} 
                className="flex gap-2 mb-5"
              >
                <input type="text" name="title" placeholder="New task..." className="input flex-1" required />
                <select name="priority" className="input w-28">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                </select>
                <input type="date" name="dueDate" className="input w-36" />
                <SubmitButton>Add</SubmitButton>
              </form>

              {/* Tasks */}
              <div className="space-y-2">
                {project.tasks.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded">No matching tasks</div>
                ) : (
                  project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={async () => {
                            await toggleTaskStatus(task.id);
                            await loadProjects();
                          }}
                          className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center text-xs transition-all
                            ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-zinc-400'}
                          `}
                        >
                          {task.status === 'done' && '✓'}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className={task.status === 'done' ? 'line-through text-zinc-500' : ''}>
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded font-medium
                              ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}
                            `}>
                              {task.priority}
                            </span>

                            {task.dueDate && (
                              <span className="text-zinc-500">
                                {format(new Date(task.dueDate), 'MMM dd')}
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
                        className="text-red-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-all px-2"
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
    </div>
  );
}