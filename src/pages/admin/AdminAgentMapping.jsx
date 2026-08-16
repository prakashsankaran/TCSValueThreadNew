import React, { useState, useEffect } from 'react';
import { INITIAL_17_PERSONAS } from './AdminPersonas';
import { PRIMARY_AGENTS_55 } from './AdminAgents';
import { projectService } from '../../services/projectService';
import { agentMappingService } from '../../services/agentMappingService';

export default function AdminAgentMapping() {
  const [viewMode, setViewMode] = useState('by_persona'); // 'by_persona' | 'by_agent'
  const [availableProjects, setAvailableProjects] = useState(['sdd-enterprise-dev', 'mobile-app-v2', 'legacy-migration']);
  const [dbMappings, setDbMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load baseline projects and SQLite mappings
  useEffect(() => {
    projectService.getProjects().then(projs => {
      if (Array.isArray(projs) && projs.length > 0) {
        setAvailableProjects(projs.map(p => p.name));
      }
    });
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    const data = await agentMappingService.getAgentMappings();
    setDbMappings(data);
    setLoading(false);
  };

  const handleResetBaseline = async () => {
    if (window.confirm('Reset agent mappings in SQLite to the 15-Agent baseline?')) {
      const reset = await agentMappingService.resetAgentMappings();
      setDbMappings(reset);
    }
  };

  const availablePersonas = INITIAL_17_PERSONAS.map(p => p.name);
  const enabledPrimaryAgents = PRIMARY_AGENTS_55.filter(a => a.status === 'Enabled');
  const allPrimaryAgents = PRIMARY_AGENTS_55;

  // Group mappings BY AGENT
  const agentMappingMap = {};
  allPrimaryAgents.forEach(a => {
    agentMappingMap[a.name] = {
      id: a.id,
      name: a.name,
      status: a.status,
      responsibility: a.responsibility,
      personas: [],
      notes: ''
    };
  });

  dbMappings.forEach(m => {
    if (!agentMappingMap[m.agentName]) {
      agentMappingMap[m.agentName] = {
        id: m.agentName,
        name: m.agentName,
        status: 'Enabled',
        responsibility: '',
        personas: [],
        notes: m.notes || ''
      };
    }
    if (m.personaName && !agentMappingMap[m.agentName].personas.includes(m.personaName)) {
      agentMappingMap[m.agentName].personas.push(m.personaName);
    }
    if (m.notes) agentMappingMap[m.agentName].notes = m.notes;
  });

  // Group mappings BY PERSONA
  const personaMappingMap = {};
  availablePersonas.forEach(p => {
    personaMappingMap[p] = [];
  });
  dbMappings.forEach(m => {
    if (!personaMappingMap[m.personaName]) {
      personaMappingMap[m.personaName] = [];
    }
    if (!personaMappingMap[m.personaName].includes(m.agentName)) {
      personaMappingMap[m.personaName].push(m.agentName);
    }
  });

  // Modal State (Supports 'edit_agent', 'edit_persona', and 'create_new')
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit_persona'); // 'edit_persona' | 'edit_agent' | 'create_new'
  const [modalTargetAgent, setModalTargetAgent] = useState('');
  const [modalTargetPersona, setModalTargetPersona] = useState(availablePersonas[0] || 'Product Owner');
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedProject, setSelectedProject] = useState('sdd-enterprise-dev');
  const [mappingNotes, setMappingNotes] = useState('');

  const handleOpenEditAgent = (agentName) => {
    setModalMode('edit_agent');
    setModalTargetAgent(agentName);
    const existing = agentMappingMap[agentName];
    setSelectedPersonas(existing ? [...existing.personas] : []);
    setMappingNotes(existing ? existing.notes || '' : '');
    setIsModalOpen(true);
  };

  const handleOpenEditPersona = (personaName) => {
    setModalMode('edit_persona');
    setModalTargetPersona(personaName);
    const assigned = personaMappingMap[personaName] || [];
    setSelectedAgents([...assigned]);
    setSelectedProject(availableProjects[0] || 'sdd-enterprise-dev');
    setMappingNotes('');
    setIsModalOpen(true);
  };

  const handleOpenCreateNew = () => {
    setModalMode('create_new');
    setModalTargetPersona(availablePersonas[0] || 'Product Owner');
    setSelectedAgents([enabledPrimaryAgents[0]?.name || 'Requirement to Spec']);
    setSelectedProject(availableProjects[0] || 'sdd-enterprise-dev');
    setMappingNotes('');
    setIsModalOpen(true);
  };

  const togglePersonaSelection = (personaName) => {
    if (selectedPersonas.includes(personaName)) {
      setSelectedPersonas(selectedPersonas.filter(p => p !== personaName));
    } else {
      setSelectedPersonas([...selectedPersonas, personaName]);
    }
  };

  const toggleAgentSelection = (agentName) => {
    if (selectedAgents.includes(agentName)) {
      setSelectedAgents(selectedAgents.filter(a => a !== agentName));
    } else {
      setSelectedAgents([...selectedAgents, agentName]);
    }
  };

  const handleSaveModal = async () => {
    if (modalMode === 'edit_agent') {
      if (!modalTargetAgent) return;
      const existingRows = dbMappings.filter(m => m.agentName === modalTargetAgent);
      for (const r of existingRows) {
        await agentMappingService.deleteAgentMapping(r.id);
      }
      for (const persona of selectedPersonas) {
        await agentMappingService.createAgentMapping({
          projectId: selectedProject,
          personaName: persona,
          agentName: modalTargetAgent,
          notes: mappingNotes
        });
      }
    } else if (modalMode === 'edit_persona') {
      if (!modalTargetPersona) return;
      const existingRows = dbMappings.filter(m => m.personaName === modalTargetPersona);
      for (const r of existingRows) {
        await agentMappingService.deleteAgentMapping(r.id);
      }
      for (const agentName of selectedAgents) {
        await agentMappingService.createAgentMapping({
          projectId: selectedProject,
          personaName: modalTargetPersona,
          agentName: agentName,
          notes: mappingNotes
        });
      }
    } else {
      for (const agentName of selectedAgents) {
        await agentMappingService.createAgentMapping({
          projectId: selectedProject,
          personaName: modalTargetPersona,
          agentName: agentName,
          notes: mappingNotes
        });
      }
    }

    await loadMappings();
    setIsModalOpen(false);
  };

  return (
    <div className="text-white fade-in p-2 space-y-5 font-sans">
      
      {/* Header Controls */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between items-center shadow-lg gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
            <i className="fas fa-sitemap"></i>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">Agent Mapping Matrix</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex space-x-1 bg-[#060913] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('by_persona')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'by_persona' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fas fa-user-gear"></i>
              <span>Personas → Agents</span>
            </button>
            <button
              onClick={() => setViewMode('by_agent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'by_agent' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fas fa-robot"></i>
              <span>Agents → Personas</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateNew}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer flex items-center space-x-1.5"
          >
            <i className="fas fa-plus text-xs"></i>
            <span>Create New Mapping</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: PERSONAS MAPPED AGAINST AGENTS */}
      {viewMode === 'by_persona' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Target Persona Name</th>
                  <th className="p-3.5">Assigned Primary & Bounded Agents</th>
                  <th className="p-3.5 text-center">Agent Count</th>
                  <th className="p-3.5 text-right sticky right-0 bg-slate-900 z-30 shadow-md">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-sans">
                {availablePersonas.map((persona) => {
                  const assignedAgents = personaMappingMap[persona] || [];
                  const isSuperAdminPersona = persona === 'Platform Admin';

                  return (
                    <tr key={persona} className="hover:bg-slate-900/50 transition">
                      <td className="p-3.5 font-bold text-white min-w-[200px]">
                        <span className="text-indigo-300 flex items-center space-x-2">
                          <i className={`fas ${isSuperAdminPersona ? 'fa-user-shield text-amber-400' : 'fa-user-tag text-indigo-400'} text-xs`}></i>
                          <span>{persona}</span>
                        </span>
                      </td>
                      <td className="p-3.5 min-w-[360px]">
                        {assignedAgents.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedAgents.map((agentName, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800 text-[10px] font-bold">
                                {agentName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No specific agents assigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[10px]">
                          {assignedAgents.length}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono sticky right-0 bg-[#0b0f19] z-10 border-l border-slate-800/80">
                        <button
                          onClick={() => handleOpenEditPersona(persona)}
                          title="Edit Agent Mappings for Persona"
                          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-purple-600 text-purple-400 hover:text-white border border-slate-700 hover:border-purple-500 transition cursor-pointer flex items-center justify-center ml-auto shadow-sm"
                        >
                          <i className="fas fa-pen-to-square text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: AGENTS MAPPED AGAINST PERSONAS */}
      {viewMode === 'by_agent' && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Primary Agent & ID</th>
                  <th className="p-3.5">Assigned Execution Personas</th>
                  <th className="p-3.5">Operational Boundary & Notes</th>
                  <th className="p-3.5 text-right sticky right-0 bg-slate-900 z-30 shadow-md">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-sans">
                {enabledPrimaryAgents.map((agent) => {
                  const item = agentMappingMap[agent.name] || { personas: [], notes: '' };
                  const isAllNonAdmin = item.personas.length >= 15;
                  const isSuperAdmin = item.personas.includes('Platform Admin');

                  return (
                    <tr key={agent.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3.5 font-bold text-white min-w-[200px]">
                        <span className="text-purple-300 block">{agent.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{agent.id}</span>
                      </td>
                      <td className="p-3.5 min-w-[320px]">
                        {isAllNonAdmin ? (
                          <span className="px-3 py-1 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800 font-bold text-[11px] inline-flex items-center space-x-1.5">
                            <i className="fas fa-users text-purple-400"></i>
                            <span>All Personas (16 Non-Super-Admin Roles)</span>
                          </span>
                        ) : isSuperAdmin ? (
                          <span className="px-3 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800 font-bold text-[11px] inline-flex items-center space-x-1.5">
                            <i className="fas fa-user-shield text-amber-400"></i>
                            <span>Super Admin Only (Platform Admin)</span>
                          </span>
                        ) : item.personas.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.personas.map((persona, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800 font-bold text-[11px] inline-flex items-center space-x-1">
                                <i className="fas fa-user-tag text-[9px] text-indigo-400"></i>
                                <span>{persona}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unmapped</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-[280px] leading-relaxed">
                        {item.notes || agent.responsibility}
                      </td>
                      <td className="p-3.5 text-right font-mono sticky right-0 bg-[#0b0f19] z-10 border-l border-slate-800/80">
                        <button
                          onClick={() => handleOpenEditAgent(agent.name)}
                          title="Edit Persona Mappings"
                          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-purple-600 text-purple-400 hover:text-white border border-slate-700 hover:border-purple-500 transition cursor-pointer flex items-center justify-center ml-auto shadow-sm"
                        >
                          <i className="fas fa-pen-to-square text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MAPPING MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-5 space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <i className="fas fa-link text-purple-400"></i>
                  <span>
                    {modalMode === 'create_new' 
                      ? 'Create New Agent Persona Mapping' 
                      : modalMode === 'edit_persona' 
                      ? 'Edit Agents Mapped to Persona' 
                      : 'Edit Personas Mapped to Agent'}
                  </span>
                </h3>
                {modalMode === 'edit_agent' && (
                  <p className="text-[11px] text-purple-300 font-bold mt-0.5">{modalTargetAgent}</p>
                )}
                {modalMode === 'edit_persona' && (
                  <p className="text-[11px] text-indigo-300 font-bold mt-0.5">{modalTargetPersona}</p>
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-[#060913] border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {availableProjects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {modalMode === 'create_new' && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Target Persona</label>
                    <select
                      value={modalTargetPersona}
                      onChange={(e) => setModalTargetPersona(e.target.value)}
                      className="w-full bg-[#060913] border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {availablePersonas.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Operational Notes / Special Condition</label>
                <input 
                  type="text"
                  value={mappingNotes}
                  onChange={(e) => setMappingNotes(e.target.value)}
                  placeholder="e.g. Brownfield projects focus"
                  className="w-full bg-[#060913] border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* In Edit Agent Mode: Select multiple Personas */}
              {modalMode === 'edit_agent' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-slate-400 font-semibold">Select Executing Personas ({selectedPersonas.length})</label>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedPersonas([...availablePersonas.filter(p => p !== 'Platform Admin')])}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300"
                      >
                        Select All (Non-Admin)
                      </button>
                      <button
                        onClick={() => setSelectedPersonas([])}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-400"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#060913] p-3 rounded-xl border border-slate-800 max-h-56 overflow-y-auto custom-scroll">
                    {availablePersonas.map((persona) => {
                      const isSelected = selectedPersonas.includes(persona);
                      return (
                        <button
                          key={persona}
                          type="button"
                          onClick={() => togglePersonaSelection(persona)}
                          className={`p-2 rounded-lg font-bold border text-left flex items-center justify-between cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{persona}</span>
                          {isSelected && <i className="fas fa-check text-purple-400 text-xs"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* In Create New Mode or Edit Persona Mode: Select multiple Primary Agents */}
              {(modalMode === 'create_new' || modalMode === 'edit_persona') && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-slate-400 font-semibold">Select Primary Agents to Assign ({selectedAgents.length})</label>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedAgents(enabledPrimaryAgents.map(a => a.name))}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300"
                      >
                        Select All 15 Enabled
                      </button>
                      <button
                        onClick={() => setSelectedAgents([])}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-400"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#060913] p-3 rounded-xl border border-slate-800 max-h-56 overflow-y-auto custom-scroll">
                    {enabledPrimaryAgents.map((agent) => {
                      const isSelected = selectedAgents.includes(agent.name);
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => toggleAgentSelection(agent.name)}
                          className={`p-2 rounded-lg font-bold border text-left flex items-center justify-between cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{agent.name}</span>
                          {isSelected && <i className="fas fa-check text-purple-400 text-xs"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer flex items-center space-x-1.5"
              >
                <i className="fas fa-save"></i>
                <span>Save Mapping</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

