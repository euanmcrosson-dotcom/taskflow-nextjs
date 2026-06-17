'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signOut } from 'next-auth/react';
import { 
  createProject, createTask, toggleTaskStatus, deleteTask, deleteProject, getProjects 
} from './actions';
import { format } from 'date-fns';

// Types
interface Task { id: number; title: string; priority: string; status: string; dueDate?: any; }
interface Project { id: number; name: string; description?: string; tasks: Task[]; }

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-70">{pending ? "Saving..." : children}</button>;
}

export default function TaskFlow() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data as any);
  };

  useEffect(() => { loadProjects(); }, []);

  const filteredProjects = projects.map(p => ({
    ...p,
    tasks: p.tasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || t.status === statusFilter) &&
      (priorityFilter === 'all' || t.priority === priorityFilter)
    )
  })).filter(p => p.tasks.length > 0 || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const [createProjectState, createProjectAction] = useActionState(async (prev, formData) => {
    const res = await createProject(formData);
    if (res.success) { await loadProjects(); setShowCreateProject(false); }
    return res;
  }, { success: false });

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">TaskFlow</h1>
          <p className="text-zinc-400">Secure • Personal • Powerful</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => signOut()} className="text-sm text-zinc-400 hover:text-white">Sign Out</button>
          <button onClick={() => setShowCreateProject(!showCreateProject)} className="btn btn-primary px-6">
            {showCreateProject ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

      {/* Search + Filters (same as before) */}
      <div className="flex gap-4 mb-8">
        <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="input w-44">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} className="input w-44">
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {showCreateProject && (
        <div className="card mb-8 max-w-md">
          <form action={createProjectAction} className="space-y-4">
            <input type="text" name="name" placeholder="Project name" className="input" required />
            <textarea name="description" placeholder="Description" className="input h-20" />
            <SubmitButton>Create Project</SubmitButton>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full card text-center py-12">No projects found.</div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="card">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-semibold">{project.name}</h3>
                  {project.description && <p className="text-zinc-400 text-sm">{project.description}</p>}
                </div>
                <button onClick={async () => { await deleteProject(project.id); loadProjects(); }} className="text-red-400 text-sm">Delete</button>
              </div>

              <form action={async (fd) => { fd.append('projectId', project.id.toString()); await createTask(fd); loadProjects(); }} className="flex gap-2 mb-5">
                <input type="text" name="title" placeholder="New task" className="input flex-1" required />
                <select name="priority" className="input w-28"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
                <input type="date" name="dueDate" className="input w-36" />
                <SubmitButton>Add</SubmitButton>
              </form>

              <div className="space-y-2">
                {project.tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 group">
                    <div className="flex items-center gap-3">
                      <button onClick={async () => { await toggleTaskStatus(task.id); loadProjects(); }} className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>{task.status === 'done' && '✓'}</button>
                      <div>
                        <div className={task.status === 'done' ? 'line-through text-zinc-500' : ''}>{task.title}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{task.priority}</span>
                      </div>
                    </div>
                    <button onClick={async () => { await deleteTask(task.id); loadProjects(); }} className="text-red-400 text-xs opacity-0 group-hover:opacity-100">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
