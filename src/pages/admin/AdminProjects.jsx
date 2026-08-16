import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectService.getProjects().then(data => {
      if (Array.isArray(data)) setProjects(data);
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', type: 'Green Field', status: 'Active' });

  const handleSaveProject = async () => {
    if (!newProject.name) return;
    if (editingProjectId) {
      const updated = await projectService.updateProject(editingProjectId, newProject);
      setProjects(projects.map(p => p.id === editingProjectId ? updated : p));
    } else {
      const created = await projectService.createProject(newProject);
      setProjects([...projects, created]);
    }
    setNewProject({ name: '', description: '', type: 'Green Field', status: 'Active' });
    setEditingProjectId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="text-white fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[28px] font-bold tracking-tight text-white flex items-center space-x-3">
          <i className="fas fa-briefcase text-indigo-400"></i>
          <span>Project Management</span>
        </h1>

        <button 
          onClick={() => {
            setEditingProjectId(null);
            setNewProject({ name: '', description: '', type: 'Green Field', status: 'Active' });
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all flex items-center space-x-2 text-[14px] cursor-pointer"
        >
          <i className="fas fa-plus text-xs"></i>
          <span>Create Project</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/20">
          <h3 className="text-lg font-bold text-white mb-1">Project Directory</h3>
          <p className="text-[13px] text-slate-400">View and manage all active and past projects in the organization.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-4 px-6 font-semibold">Project Name</th>
                <th className="py-4 px-6 font-semibold">Description</th>
                <th className="py-4 px-6 font-semibold">Type</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="py-4 px-6">
                    <span className="font-bold text-[14px] text-slate-200">{project.name}</span>
                  </td>
                  <td className="py-4 px-6 text-[13px] text-slate-400">
                    {project.description}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                      project.type === 'Green Field' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <i className={`fas ${project.type === 'Green Field' ? 'fa-seedling' : 'fa-cubes'} mr-1.5`}></i>
                      {project.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                      project.status === 'Active' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : project.status === 'In Progress' 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        project.status === 'Active' ? 'bg-emerald-500' : project.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></span>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setNewProject(project);
                        setIsModalOpen(true);
                      }}
                      className="bg-slate-800/60 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      Modify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <h2 className="text-xl font-bold text-white mb-4">
              {editingProjectId ? "Modify Project" : "Create New Project"}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[13px] font-medium text-slate-400 mb-2">Project Name</label>
                <input 
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-[#060913]/70 border border-slate-800 rounded-lg py-2.5 px-4 text-[14px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. sdd-ecommerce-app"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-400 mb-2">Description</label>
                <textarea 
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-[#060913]/70 border border-slate-800 rounded-lg py-2.5 px-4 text-[14px] text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[80px]"
                  placeholder="Brief description of the project"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-400 mb-2">Project Type</label>
                <div className="flex bg-[#060913]/70 border border-slate-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setNewProject({...newProject, type: 'Green Field'})}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                      newProject.type === 'Green Field' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <i className="fas fa-seedling"></i>
                    <span>Green Field</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProject({...newProject, type: 'Brown Field'})}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                      newProject.type === 'Brown Field' 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <i className="fas fa-cubes"></i>
                    <span>Brown Field</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-400 mb-2">Initial Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  className="w-full bg-[#060913]/70 border border-slate-800 rounded-lg py-2.5 px-4 text-[14px] text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planning">Planning</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setEditingProjectId(null);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProject}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
              >
                {editingProjectId ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
