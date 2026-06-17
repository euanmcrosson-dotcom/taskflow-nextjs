'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signOut } from 'next-auth/react';
import { createProject, createTask, toggleTaskStatus, deleteTask, deleteProject, getProjects } from './actions';
import { format, isPast } from 'date-fns';

interface Task { id: number; title: string; priority: string; status: string; dueDate?: any; }
interface Project { id: number; name: string; description?: string; tasks: Task[]; }

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-primary w-full mt-2">{pending ? 'Saving...' : children}</button>;
}

export default function TaskFlow() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState<number | null>(null); // projectId

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data as any);
  };

  useEffect(() => { loadProjects(); }, []);

  // Filtered projects
  const filteredProjects = projects
    .map(p => ({
      ...p,
      tasks: p.tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === 'all' || t.status === statusFilter) &&
        (priorityFilter === 'all' || t.priority === priorityFilter)
      )
    }))
    .filter(p => p.tasks.length > 0 || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Create Project
  const [createProjectState, createProjectAction] = useActionState(async (prev, formData) => {
    const res = await createProject(formData);
    if (res.success) {
      await loadProjects();
      setShowProjectModal(false);
    }
    return res;
  }, { success: false });

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-6xl font-bold tracking-[-2px]">TaskFlow</h1>
          <p className="text-zinc-400 mt-1 text-lg">Your personal command center</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => signOut()} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Sign out</button>
          <button onClick={() => setShowProjectModal(true)} className="btn btn-primary px-6">+ New Project</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input flex-1"
        />
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full card text-center py-16">
            <div className="text-7xl mb-4">📭</div>
            <h3 className="text-2xl font-semibold mb-2">No projects found</h3>
            <p className="text-zinc-400">Create a new project to get started</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="card">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{project.name}</h3>
                  {project.description && <p className="text-zinc-400 mt-1.5 text-sm leading-snug">{project.description}</p>}
                </div>
                <button 
                  onClick={async () => { await deleteProject(project.id); loadProjects(); }}
                  className="text-xs text-red-400 hover:text-red-500 px-3 py-1 rounded-lg hover:bg-red-950/50 transition-colors"
                >
                  Delete
                </button>
              </div>

              {/* Add Task Button */}
              <button 
                onClick={() => setShowTaskModal(project.id)}
                className="w-full mb-5 py-2.5 text-sm border border-zinc-700 hover:bg-zinc-800 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                + Add Task
              </button>

              {/* Tasks */}
              <div className="space-y-2">
                {project.tasks.length === 0 ? (
                  <div className="text-center py-6 text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">No tasks yet</div>
                ) : (
                  project.tasks.map(task => {
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                    return (
                      <div key={task.id} className="task-row">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={async () => { await toggleTaskStatus(task.id); loadProjects(); }}
                            className={`w-5 h-5 rounded-lg border flex-shrink-0 flex items-center justify-center text-[10px] transition-all
                              ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-600 hover:border-zinc-400'}
                            `}
                          >
                            {task.status === 'done' && '✓'}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className={task.status === 'done' ? 'status-done' : ''}>{task.title}</div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2.5 py-px rounded-full border font-medium
                                ${task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low'}
                              `}>
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                                  {format(new Date(task.dueDate), 'MMM dd')}{isOverdue && ' • Overdue'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={async () => { await deleteTask(task.id); loadProjects(); }}
                          className="text-red-400 hover:text-red-500 text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-all"
                        >Delete</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="modal" onClick={() => setShowProjectModal(false)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-6">Create New Project</h2>
            <form action={createProjectAction} className="space-y-4">
              <input type="text" name="name" placeholder="Project name" className="input" required />
              <textarea name="description" placeholder="Description (optional)" className="input h-24" />
              <SubmitButton>Create Project</SubmitButton>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="modal" onClick={() => setShowTaskModal(null)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-6">Add New Task</h2>
            <form 
              action={async (formData) => {
                formData.append('projectId', showTaskModal.toString());
                await createTask(formData);
                await loadProjects();
                setShowTaskModal(null);
              }} 
              className="space-y-4"
            >
              <input type="text" name="title" placeholder="Task title" className="input" required />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Priority</label>
                  <select name="priority" className="input">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Due Date</label>
                  <input type="date" name="dueDate" className="input" />
                </div>
              </div>

              <SubmitButton>Add Task</SubmitButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
