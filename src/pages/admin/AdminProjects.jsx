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
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17181C] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-sm shrink-0">
              <i className="fas fa-briefcase"></i>
            </div>
            <span>Project Management</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Configure system projects, greenfield/brownfield delivery scopes, and workspace assignments.
          </p>
        </div>

        <button 
          onClick={() => {
            setEditingProjectId(null);
            setNewProject({ name: '', description: '', type: 'Green Field', status: 'Active' });
            setIsModalOpen(true);
          }}
          className="bg-[#7157F5] hover:bg-[#5F46D8] text-white font-semibold py-2 px-4 rounded-[10px] shadow-2xs transition-all flex items-center gap-2 text-xs cursor-pointer"
        >
          <i className="fas fa-plus text-[10px]"></i>
          <span>Create Project</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#ECEEF1] bg-[#FAFAF9] flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17181C]">Project Directory</h3>
            <p className="text-[11px] text-[#667085]">View and manage all active and past projects in the enterprise portfolio.</p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-[8px]">
            {projects.length} Total Projects
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[10px] uppercase tracking-wider text-[#667085] font-bold">
                <th className="py-3 px-4 font-bold">Project Name</th>
                <th className="py-3 px-4 font-bold">Description</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF1] text-[#344054]">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-[#F8F8F7]/80 transition group">
                  <td className="py-3.5 px-4 font-semibold text-[#17181C]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[8px] bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xs font-bold shrink-0">
                        <i className="fas fa-folder text-[11px]"></i>
                      </div>
                      <span>{project.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#475467] max-w-sm">
                    {project.description}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-bold border ${
                      project.type === 'Green Field' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      <i className={`fas ${project.type === 'Green Field' ? 'fa-seedling' : 'fa-cubes'} mr-1 text-[10px]`}></i>
                      {project.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      project.status === 'Active' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : project.status === 'In Progress' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        project.status === 'Active' ? 'bg-emerald-500' : project.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></span>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setNewProject(project);
                        setIsModalOpen(true);
                      }}
                      className="bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] text-[#344054] px-3 py-1 rounded-[8px] text-[11px] font-semibold transition shadow-2xs cursor-pointer"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b border-[#F2F4F7] mb-4">
              <h2 className="text-base font-bold text-[#17181C]">
                {editingProjectId ? "Modify Project" : "Create New Project"}
              </h2>
              <button 
                onClick={() => {
                  setEditingProjectId(null);
                  setIsModalOpen(false);
                }}
                className="text-[#98A2B3] hover:text-[#17181C] text-sm cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-3.5 mb-6 text-xs">
              <div>
                <label className="block font-semibold text-[#344054] mb-1">Project Name</label>
                <input 
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 px-3 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-colors"
                  placeholder="e.g. sdd-ecommerce-app"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#344054] mb-1">Description</label>
                <textarea 
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 px-3 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-colors min-h-[70px]"
                  placeholder="Brief description of the project"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#344054] mb-1">Project Type</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-1">
                  <button
                    type="button"
                    onClick={() => setNewProject({...newProject, type: 'Green Field'})}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                      newProject.type === 'Green Field' 
                        ? 'bg-white text-emerald-700 border border-[#ECEEF1] shadow-2xs' 
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    <i className="fas fa-seedling text-emerald-600 text-[10px]"></i>
                    <span>Green Field</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProject({...newProject, type: 'Brown Field'})}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                      newProject.type === 'Brown Field' 
                        ? 'bg-white text-blue-700 border border-[#ECEEF1] shadow-2xs' 
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    <i className="fas fa-cubes text-blue-600 text-[10px]"></i>
                    <span>Brown Field</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#344054] mb-1">Initial Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 px-3 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planning">Planning</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECEEF1]">
              <button 
                onClick={() => {
                  setEditingProjectId(null);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProject}
                className="bg-[#7157F5] hover:bg-[#5F46D8] text-white px-4 py-2 rounded-[10px] text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
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
