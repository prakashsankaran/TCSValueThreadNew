import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { personaService } from '../../services/personaService';

export default function AdminUsers() {
  const [availableProjects, setAvailableProjects] = useState(['sdd-enterprise-dev', 'mobile-app-v2', 'legacy-migration']);
  const [availablePersonas, setAvailablePersonas] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getUsers().then(data => {
      if (Array.isArray(data)) setUsers(data);
    });
    projectService.getProjects().then(projs => {
      if (Array.isArray(projs) && projs.length > 0) {
        setAvailableProjects(projs.map(p => p.name));
      }
    });
    personaService.getPersonas().then(pers => {
      if (Array.isArray(pers) && pers.length > 0) {
        setAvailablePersonas(pers.map(p => p.name).filter(n => n !== 'Super Admin'));
      }
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', isSuperAdmin: false, projectAccess: [] });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setNewUser({ name: '', email: '', isSuperAdmin: false, projectAccess: [] });
    setIsModalOpen(true);
  };

  const handleOpenModify = (user) => {
    setEditingUserId(user.id);
    setNewUser({
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
      projectAccess: JSON.parse(JSON.stringify(user.projectAccess))
    });
    setIsModalOpen(true);
  };

  const handleAddProjectAccess = () => {
    setNewUser({
      ...newUser,
      projectAccess: [...newUser.projectAccess, { projectId: availableProjects[0] || 'sdd-enterprise-dev', personas: [] }]
    });
  };

  const handleRemoveProjectAccess = (index) => {
    const updatedAccess = [...newUser.projectAccess];
    updatedAccess.splice(index, 1);
    setNewUser({ ...newUser, projectAccess: updatedAccess });
  };

  const handleProjectChange = (index, projectId) => {
    const updatedAccess = [...newUser.projectAccess];
    updatedAccess[index].projectId = projectId;
    setNewUser({ ...newUser, projectAccess: updatedAccess });
  };

  const togglePersona = (projectIndex, persona) => {
    const updatedAccess = [...newUser.projectAccess];
    const personasList = updatedAccess[projectIndex].personas;
    
    if (personasList.includes(persona)) {
      updatedAccess[projectIndex].personas = personasList.filter(p => p !== persona);
    } else {
      updatedAccess[projectIndex].personas = [...personasList, persona];
    }
    setNewUser({ ...newUser, projectAccess: updatedAccess });
  };

  const handleSave = async () => {
    if (newUser.name && newUser.email) {
      if (editingUserId) {
        const updated = await userService.updateUser(editingUserId, newUser);
        setUsers(users.map(u => u.id === editingUserId ? updated : u));
      } else {
        const created = await userService.createUser(newUser);
        setUsers([...users, created]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await userService.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleResetUsers = async () => {
    const data = await userService.resetUsers();
    setUsers(data);
  };

  return (
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17181C] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm shrink-0">
              <i className="fas fa-user-shield"></i>
            </div>
            <span>User Provisioning & Access</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Provision enterprise users, assign project boundaries, and grant SDLC persona capabilities.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={handleResetUsers}
            className="bg-white hover:bg-[#F8F8F7] text-[#344054] font-semibold py-2 px-3.5 rounded-[10px] border border-[#ECEEF1] hover:border-[#D0D5DD] transition-all flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
            title="Reset to 18 Baseline SDLC Persona Users"
          >
            <i className="fas fa-undo text-[10px] text-[#7157F5]"></i>
            <span>Reset Baseline (18)</span>
          </button>
          <button 
            onClick={handleOpenCreate}
            className="bg-[#7157F5] hover:bg-[#5F46D8] text-white font-semibold py-2 px-4 rounded-[10px] shadow-2xs transition-all flex items-center gap-2 text-xs cursor-pointer"
          >
            <i className="fas fa-user-plus text-[10px]"></i>
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#ECEEF1] bg-[#FAFAF9] flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17181C]">User Directory</h3>
            <p className="text-[11px] text-[#667085]">View and manage all registered users and their multi-project access levels.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-[8px]">
            {users.length} Active Users
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[10px] uppercase tracking-wider text-[#667085] font-bold">
                <th className="py-3 px-4 font-bold">User Details</th>
                <th className="py-3 px-4 font-bold">Project Access Overview</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF1] text-[#344054]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#F8F8F7]/80 transition group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7157F5] to-purple-700 flex items-center justify-center font-bold text-white text-[11px] shadow-2xs shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#17181C]">{user.name}</p>
                        <p className="text-[11px] text-[#667085]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {user.isSuperAdmin ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-bold">
                          <i className="fas fa-shield-alt mr-1 text-[10px]"></i>
                          Global Super Admin
                        </span>
                      </div>
                    ) : user.projectAccess.length === 0 ? (
                      <span className="text-[#98A2B3] text-[11px] italic">No active project assignments</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {user.projectAccess.map((access, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="inline-block px-2 py-0.5 rounded-[6px] border border-[#ECEEF1] bg-[#F8F8F7] text-[#344054] text-[11px] font-semibold whitespace-nowrap">
                              {access.projectId}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {access.personas.map(persona => (
                                <span key={persona} className="inline-block px-2 py-0.5 rounded-[6px] border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold">
                                  {persona}
                                </span>
                              ))}
                              {access.personas.length === 0 && (
                                <span className="text-[#98A2B3] text-[10px] italic">No personas assigned</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right align-top">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handleOpenModify(user)}
                        className="bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] text-[#344054] px-3 py-1 rounded-[8px] text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                      >
                        Modify
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-2 py-1 rounded-[8px] text-[11px] font-semibold transition cursor-pointer"
                        title="Delete User"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modify Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] w-full max-w-2xl shadow-2xl relative flex flex-col my-8 max-h-[90vh]">
            <div className="p-5 border-b border-[#F2F4F7] flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-[#17181C]">{editingUserId ? 'Modify User Access' : 'Provision New User'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#17181C] text-sm cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scroll space-y-5 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Full Name</label>
                  <input 
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 px-3 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-colors"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Email Address</label>
                  <input 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 px-3 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-colors"
                    placeholder="john@frugalforge.io"
                  />
                </div>
              </div>

              {/* Super Admin Toggle */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-[14px] p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-rose-700 font-bold text-xs flex items-center mb-0.5">
                    <i className="fas fa-shield-alt mr-1.5"></i>
                    Global Super Admin Access
                  </h4>
                  <p className="text-[#667085] text-[11px]">Grants full administrative control across all workspaces.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={newUser.isSuperAdmin}
                    onChange={(e) => setNewUser({...newUser, isSuperAdmin: e.target.checked})}
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Project Access Blocks */}
              {!newUser.isSuperAdmin && (
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="block font-bold text-[#17181C]">Project Access Control</label>
                    <button 
                      onClick={handleAddProjectAccess}
                      className="text-[#7157F5] hover:text-[#5F46D8] font-semibold flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <i className="fas fa-plus-circle text-[11px]"></i>
                      <span>Assign Project</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newUser.projectAccess.length === 0 ? (
                      <div className="bg-[#F8F8F7] border border-[#ECEEF1] border-dashed rounded-[14px] p-6 text-center">
                        <p className="text-[#667085] text-xs">User currently has no project assignments.</p>
                        <button onClick={handleAddProjectAccess} className="mt-1.5 text-[#7157F5] hover:underline font-semibold cursor-pointer">Assign their first project</button>
                      </div>
                    ) : (
                      newUser.projectAccess.map((access, index) => (
                        <div key={index} className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[14px] p-4 relative group">
                          <button 
                            onClick={() => handleRemoveProjectAccess(index)}
                            className="absolute top-3.5 right-3.5 text-[#98A2B3] hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Project Assignment"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                          
                          <div className="mb-3 pr-8">
                            <label className="block font-semibold text-[#667085] mb-1 uppercase tracking-wide text-[10px]">Target Project</label>
                            <select
                              value={access.projectId}
                              onChange={(e) => handleProjectChange(index, e.target.value)}
                              className="w-full bg-white border border-[#ECEEF1] rounded-[8px] py-1.5 px-3 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] cursor-pointer"
                            >
                              {availableProjects.map(proj => (
                                <option key={proj} value={proj}>{proj}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-[#667085] mb-1.5 uppercase tracking-wide text-[10px]">Assigned Personas</label>
                            <div className="flex flex-wrap gap-1.5">
                              {availablePersonas.map(persona => {
                                const isSelected = access.personas.includes(persona);
                                return (
                                  <button
                                    key={persona}
                                    onClick={() => togglePersona(index, persona)}
                                    className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-colors cursor-pointer ${
                                      isSelected 
                                        ? 'bg-purple-600 border-purple-600 text-white' 
                                        : 'bg-white border-[#ECEEF1] text-[#667085] hover:border-[#D0D5DD]'
                                    }`}
                                  >
                                    {isSelected && <i className="fas fa-check mr-1 text-[9px]"></i>}
                                    {persona}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#ECEEF1] flex justify-end gap-2 shrink-0 bg-[#FAFAF9]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!newUser.name || !newUser.email}
                className="bg-[#7157F5] hover:bg-[#5F46D8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-[10px] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <i className="fas fa-save text-[10px]"></i>
                <span>{editingUserId ? 'Save Modifications' : 'Provision User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] w-full max-w-sm shadow-2xl relative flex flex-col p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-exclamation-triangle text-lg"></i>
            </div>
            <h2 className="text-base font-bold text-[#17181C] mb-1">Delete User</h2>
            <p className="text-xs text-[#667085] mb-5">
              Are you sure you want to permanently remove <strong className="text-[#17181C]">{userToDelete?.name}</strong>?
            </p>
            
            <div className="flex justify-center gap-2 pt-2 border-t border-[#F2F4F7]">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-[#ECEEF1] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-[10px] text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
