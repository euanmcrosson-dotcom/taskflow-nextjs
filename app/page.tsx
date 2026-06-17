import { createProject, createTask, getProjects } from './actions';

export default async function TaskFlow() {
  const projects = await getProjects();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">TaskFlow</h1>
          <p className="text-zinc-400 mt-1">Secure task management powered by Next.js Server Actions</p>
        </div>
        <div className="text-sm text-zinc-500">Built with ❤️ using Server Actions</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Project */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold mb-4 text-lg">Create New Project</h2>
          <form action={createProject} className="space-y-4">
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
              className="input h-24 resize-y" 
            />
            <button type="submit" className="btn btn-primary w-full">
              Create Project
            </button>
          </form>
        </div>

        {/* Projects List */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-4 text-lg">Your Projects ({projects.length})</h2>
          
          {projects.length === 0 ? (
            <div className="card text-center py-12 text-zinc-400">
              No projects yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-xl">{project.name}</h3>
                      {project.description && (
                        <p className="text-zinc-400 mt-1">{project.description}</p>
                      )}
                    </div>
                    <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full">
                      {project.tasks.length} tasks
                    </div>
                  </div>

                  {/* Tasks will go here in next steps */}
                  <div className="mt-4 text-sm text-zinc-500">
                    Tasks coming in next update...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}