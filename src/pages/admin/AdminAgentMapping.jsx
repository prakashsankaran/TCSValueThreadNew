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
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      
      {/* Header Controls */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center text-sm shrink-0">
            <i className="fas fa-project-diagram"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#17181C]">Agent Mapping Matrix</h1>
            <p className="text-xs text-[#667085] mt-0.5">Control which SDLC roles have authorization to invoke specific intelligence agents.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-[#F8F8F7] p-1 rounded-[10px] border border-[#ECEEF1]">
            <button
              onClick={() => setViewMode('by_persona')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_persona' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              <i className="fas fa-user-gear text-[10px]"></i>
              <span>Personas → Agents</span>
            </button>
            <button
              onClick={() => setViewMode('by_agent')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_agent' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              <i className="fas fa-robot text-[10px]"></i>
              <span>Agents → Personas</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateNew}
            className="px-3.5 py-2 bg-[#7157F5] hover:bg-[#5F46D8] text-white font-semibold rounded-[10px] text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="fas fa-plus text-[10px]"></i>
            <span>Create Mapping</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: PERSONAS MAPPED AGAINST AGENTS */}
      {viewMode === 'by_persona' && (
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-bold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Target Persona Name</th>
                  <th className="p-3.5">Assigned Primary & Bounded Agents</th>
                  <th className="p-3.5 text-center">Agent Count</th>
                  <th className="p-3.5 text-right sticky right-0 bg-[#F8F8F7] z-30 shadow-2xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1] text-[#344054] font-sans">
                {availablePersonas.map((persona) => {
                  const assignedAgents = personaMappingMap[persona] || [];
                  const isSuperAdminPersona = persona === 'Platform Admin';

                  return (
                    <tr key={persona} className="hover:bg-[#F8F8F7]/80 transition">
                      <td className="p-3.5 font-bold text-[#17181C] min-w-[200px]">
                        <span className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSuperAdminPersona ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-700'
                          }`}>
                            <i className={`fas ${isSuperAdminPersona ? 'fa-shield-alt' : 'fa-user-tag'}`}></i>
                          </div>
                          <span>{persona}</span>
                        </span>
                      </td>
                      <td className="p-3.5 min-w-[360px]">
                        {assignedAgents.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedAgents.map((agentName, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                {agentName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#98A2B3] italic text-[11px]">No specific agents assigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F8F8F7] border border-[#ECEEF1] text-[#344054] font-mono font-bold text-[10px]">
                          {assignedAgents.length}
                        </span>
                      </td>
                      <td className="p-3.5 text-right sticky right-0 bg-white z-10 border-l border-[#ECEEF1]">
                        <button
                          onClick={() => handleOpenEditPersona(persona)}
                          title="Edit Agent Mappings for Persona"
                          className="w-7 h-7 rounded-[8px] bg-white hover:bg-purple-50 text-[#7157F5] border border-[#ECEEF1] hover:border-purple-300 transition cursor-pointer flex items-center justify-center ml-auto shadow-2xs"
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
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-bold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Primary Agent & ID</th>
                  <th className="p-3.5">Assigned Execution Personas</th>
                  <th className="p-3.5">Operational Boundary & Notes</th>
                  <th className="p-3.5 text-right sticky right-0 bg-[#F8F8F7] z-30 shadow-2xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1] text-[#344054] font-sans">
                {enabledPrimaryAgents.map((agent) => {
                  const item = agentMappingMap[agent.name] || { personas: [], notes: '' };
                  const isAllNonAdmin = item.personas.length >= 15;
                  const isSuperAdmin = item.personas.includes('Platform Admin');

                  return (
                    <tr key={agent.id} className="hover:bg-[#F8F8F7]/80 transition">
                      <td className="p-3.5 font-bold text-[#17181C] min-w-[200px]">
                        <span className="block text-[#17181C]">{agent.name}</span>
                        <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 inline-block mt-0.5">{agent.id}</span>
                      </td>
                      <td className="p-3.5 min-w-[320px]">
                        {isAllNonAdmin ? (
                          <span className="px-2.5 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px] inline-flex items-center gap-1.5">
                            <i className="fas fa-users text-purple-500"></i>
                            <span>All Personas (16 Non-Super-Admin Roles)</span>
                          </span>
                        ) : isSuperAdmin ? (
                          <span className="px-2.5 py-0.5 rounded-[6px] bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1.5">
                            <i className="fas fa-user-shield text-amber-600"></i>
                            <span>Super Admin Only (Platform Admin)</span>
                          </span>
                        ) : item.personas.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.personas.map((persona, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-[6px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px] inline-flex items-center gap-1">
                                <i className="fas fa-user-tag text-[9px] text-indigo-500"></i>
                                <span>{persona}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#98A2B3] italic text-[11px]">Unmapped</span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#667085] max-w-[280px] leading-relaxed">
                        {item.notes || agent.responsibility}
                      </td>
                      <td className="p-3.5 text-right sticky right-0 bg-white z-10 border-l border-[#ECEEF1]">
                        <button
                          onClick={() => handleOpenEditAgent(agent.name)}
                          title="Edit Persona Mappings"
                          className="w-7 h-7 rounded-[8px] bg-white hover:bg-purple-50 text-[#7157F5] border border-[#ECEEF1] hover:border-purple-300 transition cursor-pointer flex items-center justify-center ml-auto shadow-2xs"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] w-full max-w-xl overflow-hidden shadow-2xl p-5 space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-[#F2F4F7] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#17181C] flex items-center gap-2">
                  <i className="fas fa-link text-[#7157F5]"></i>
                  <span>
                    {modalMode === 'create_new' 
                      ? 'Create New Agent Persona Mapping' 
                      : modalMode === 'edit_persona' 
                      ? 'Edit Agents Mapped to Persona' 
                      : 'Edit Personas Mapped to Agent'}
                  </span>
                </h3>
                {modalMode === 'edit_agent' && (
                  <p className="text-[11px] text-[#7157F5] font-bold mt-0.5">{modalTargetAgent}</p>
                )}
                {modalMode === 'edit_persona' && (
                  <p className="text-[11px] text-purple-700 font-bold mt-0.5">{modalTargetPersona}</p>
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#17181C] transition cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Target Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] cursor-pointer"
                  >
                    {availableProjects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {modalMode === 'create_new' && (
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Target Persona</label>
                    <select
                      value={modalTargetPersona}
                      onChange={(e) => setModalTargetPersona(e.target.value)}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] cursor-pointer"
                    >
                      {availablePersonas.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">Operational Notes / Special Condition</label>
                <input 
                  type="text"
                  value={mappingNotes}
                  onChange={(e) => setMappingNotes(e.target.value)}
                  placeholder="e.g. Brownfield projects focus"
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                />
              </div>

              {/* In Edit Agent Mode: Select multiple Personas */}
              {modalMode === 'edit_agent' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-semibold text-[#344054]">Select Executing Personas ({selectedPersonas.length})</label>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedPersonas([...availablePersonas.filter(p => p !== 'Platform Admin')])}
                        className="text-[10px] font-bold text-[#7157F5] hover:underline"
                      >
                        Select All (Non-Admin)
                      </button>
                      <button
                        onClick={() => setSelectedPersonas([])}
                        className="text-[10px] font-bold text-[#98A2B3] hover:text-[#667085]"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#F8F8F7] p-3 rounded-[12px] border border-[#ECEEF1] max-h-56 overflow-y-auto custom-scroll">
                    {availablePersonas.map((persona) => {
                      const isSelected = selectedPersonas.includes(persona);
                      return (
                        <button
                          key={persona}
                          type="button"
                          onClick={() => togglePersonaSelection(persona)}
                          className={`p-2 rounded-[8px] font-semibold border text-left flex items-center justify-between cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs'
                              : 'bg-white border-[#ECEEF1] text-[#667085] hover:border-[#D0D5DD]'
                          }`}
                        >
                          <span className="truncate">{persona}</span>
                          {isSelected && <i className="fas fa-check text-purple-600 text-xs"></i>}
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
                    <label className="block font-semibold text-[#344054]">Select Primary Agents to Assign ({selectedAgents.length})</label>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedAgents(enabledPrimaryAgents.map(a => a.name))}
                        className="text-[10px] font-bold text-[#7157F5] hover:underline"
                      >
                        Select All 15 Enabled
                      </button>
                      <button
                        onClick={() => setSelectedAgents([])}
                        className="text-[10px] font-bold text-[#98A2B3] hover:text-[#667085]"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#F8F8F7] p-3 rounded-[12px] border border-[#ECEEF1] max-h-56 overflow-y-auto custom-scroll">
                    {enabledPrimaryAgents.map((agent) => {
                      const isSelected = selectedAgents.includes(agent.name);
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => toggleAgentSelection(agent.name)}
                          className={`p-2 rounded-[8px] font-semibold border text-left flex items-center justify-between cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs'
                              : 'bg-white border-[#ECEEF1] text-[#667085] hover:border-[#D0D5DD]'
                          }`}
                        >
                          <span className="truncate">{agent.name}</span>
                          {isSelected && <i className="fas fa-check text-purple-600 text-xs"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#ECEEF1] flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                className="bg-[#7157F5] hover:bg-[#5F46D8] text-white px-4 py-2 rounded-[10px] text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <i className="fas fa-save text-[10px]"></i>
                <span>Save Mapping</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

