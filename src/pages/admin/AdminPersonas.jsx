import React, { useState, useEffect } from 'react';
import { personaService } from '../../services/personaService';

export const INITIAL_17_PERSONAS = [
  { name: 'Business Sponsor', role: 'Own business outcome, funding, scope boundary and priority trade-offs.', status: 'Active', decisions: 'Go/no-go, funding, scope acceptance', approvals: 'Business case and release business readiness', agentCount: 6 },
  { name: 'Product Owner', role: 'Own product vision, backlog priority, value and acceptance intent.', status: 'Active', decisions: 'Backlog ordering, MVP scope, business-side release readiness', approvals: 'User stories, acceptance criteria and UAT outcome', agentCount: 6 },
  { name: 'Business SME', role: 'Provide domain rules, operational scenarios, exceptions and data meaning.', status: 'Active', decisions: 'Domain correctness and business-rule interpretation', approvals: 'Requirements, specs and UAT scenarios', agentCount: 6 },
  { name: 'Business Analyst', role: 'Elicit, model, document, decompose and baseline requirements.', status: 'Active', decisions: 'Requirement completeness, story decomposition and acceptance-criteria readiness', approvals: 'Seeks PO/SME approval and reviews downstream traceability', agentCount: 6 },
  { name: 'Delivery Manager', role: 'Orchestrate ceremonies, remove blockers, manage flow and coordinate gates.', status: 'Active', decisions: 'Sprint readiness, workflow governance and impediment escalation', approvals: 'Sprint plan and delivery cadence review', agentCount: 6 },
  { name: 'UX Designer', role: 'Create journeys, wireframes, prototypes, usability flows and accessibility considerations.', status: 'Active', decisions: 'Interaction model and screen behavior proposal', approvals: 'Reviewed by PO, SMEs, Architect and QA', agentCount: 6 },
  { name: 'Solution Architect', role: 'Define solution structure, NFR fit, integration model, APIs and architecture decisions.', status: 'Active', decisions: 'HLD/LLD direction, ADRs, integration contracts and major technical trade-offs', approvals: 'Architecture baseline; reviewed with Security, Data and Tech Lead', agentCount: 6 },
  { name: 'Data Architect', role: 'Own conceptual/logical/physical data model, dictionary, quality and migration approach.', status: 'Active', decisions: 'Data model, schema design, retention and data dependencies', approvals: 'Specs, DB scripts and migration plan', agentCount: 6 },
  { name: 'Security Reviewer', role: 'Embed secure SDLC, privacy, regulatory, threat model and policy checks.', status: 'Active', decisions: 'Security acceptance, exception handling and risk rating', approvals: 'Security gate, threat model and risk exceptions', agentCount: 6 },
  { name: 'Technical Lead', role: 'Translate specs into implementation plan, standards, task breakdown and code-review ownership.', status: 'Active', decisions: 'Implementation approach, code-quality standards and technical acceptance', approvals: 'PR readiness and technical Definition of Done', agentCount: 6 },
  { name: 'Developer', role: 'Build code/configuration from approved specs, write unit tests and raise clarifications.', status: 'Active', decisions: 'Component-level implementation choices within approved architecture', approvals: 'Peer/Tech Lead reviews and Security/QA checks', agentCount: 6 },
  { name: 'QA Engineer', role: 'Create test strategy, cases, automation, defect evidence, summary and UAT support.', status: 'Active', decisions: 'Test coverage adequacy and defect severity recommendation', approvals: 'Test completion; UAT by PO/SME', agentCount: 6 },
  { name: 'DevOps Engineer', role: 'Manage pipelines, build automation, variables, deployment scripts, IaC and validation.', status: 'Active', decisions: 'Pipeline design and build/deploy automation controls', approvals: 'Reviewed by Release/Change, Security and Deployment Manager', agentCount: 6 },
  { name: 'Release Manager', role: 'Package release, coordinate approvals, schedule, risk/impact, rollback and release notes.', status: 'Active', decisions: 'Release readiness, change-approval workflow and calendar', approvals: 'CAB/change gate where required', agentCount: 6 },
  { name: 'Deployment Manager', role: 'Execute controlled deployment, environment readiness, smoke test, records and rollback coordination.', status: 'Active', decisions: 'Environment readiness and execution within approved window', approvals: 'Requires release/change approval before production', agentCount: 6 },
  { name: 'Platform Admin', role: 'Manage tenants/projects, RBAC, templates, workflows, integrations and audit retention.', status: 'Active', decisions: 'Platform configuration and access model', approvals: 'Reviewed by governance/security', agentCount: 6 },
  { name: 'Auditor', role: 'Independently inspect traceability, approvals, exceptions, test and deployment evidence.', status: 'Active', decisions: 'Audit finding classification', approvals: 'Does not approve delivery artifacts; audits evidence', agentCount: 6 }
];

export default function AdminPersonas() {
  const [personas, setPersonas] = useState(INITIAL_17_PERSONAS);

  useEffect(() => {
    personaService.getPersonas().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setPersonas(data);
      }
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonaIndex, setEditingPersonaIndex] = useState(null);
  const [newPersona, setNewPersona] = useState({ name: '', role: '', status: 'Active', decisions: '', approvals: '' });

  const filteredPersonas = (personas || []).filter(p =>
    p &&
    ((p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.decisions || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setEditingPersonaIndex(null);
    setNewPersona({ name: '', role: '', status: 'Active', decisions: '', approvals: '' });
    setIsModalOpen(true);
  };

  const handleOpenModify = (index) => {
    setEditingPersonaIndex(index);
    setNewPersona({ ...personas[index] });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newPersona.name) return;
    if (editingPersonaIndex !== null) {
      const target = personas[editingPersonaIndex];
      const updated = await personaService.updatePersona(target.id || target.name, newPersona);
      const list = [...personas];
      list[editingPersonaIndex] = updated;
      setPersonas(list);
    } else {
      const created = await personaService.createPersona(newPersona);
      setPersonas([...personas, created]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (index) => {
    const target = personas[index];
    if (window.confirm(`Delete persona "${target.name}"?`)) {
      await personaService.deletePersona(target.id || target.name);
      setPersonas(personas.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="text-white fade-in p-2 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[28px] font-bold tracking-tight text-white flex items-center space-x-3">
          <i className="fas fa-users-cog text-indigo-400"></i>
          <span>Persona Management</span>
        </h1>

        <button 
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg transition flex items-center space-x-2 text-[13px] cursor-pointer"
        >
          <i className="fas fa-plus text-xs"></i>
          <span>Create Persona</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-lg">
        <div className="w-full relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          <input 
            type="text" 
            placeholder="Search personas by name, responsibility, or decision area..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060913]/70 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table Panel */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/20 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">Accountable SDLC Persona Catalog</h3>
            <p className="text-[12px] text-slate-400">Each persona owns specific governance decisions and is supported by bounded AI agents.</p>
          </div>
          <span className="px-3 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-800 text-xs font-mono font-bold rounded-lg">
            {personas.length} Active Personas
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3.5 px-5">Persona Name</th>
                <th className="py-3.5 px-5">Primary Responsibility</th>
                <th className="py-3.5 px-5">Decisions Owned</th>
                <th className="py-3.5 px-5">Reviews & Approvals</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-sans">
              {filteredPersonas.map((persona, index) => (
                <tr key={index} className="hover:bg-slate-800/20 transition group">
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-indigo-300 block">{persona.name}</span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-300 max-w-[280px]">
                    {persona.role}
                  </td>
                  <td className="py-3.5 px-5 text-amber-300 font-mono text-[11px] max-w-[220px]">
                    {persona.decisions || 'Governance & Scope'}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 text-[11px] max-w-[200px]">
                    {persona.approvals || 'Gate Sign-offs'}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleOpenModify(index)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        Modify
                      </button>
                      <button 
                        onClick={() => handleDelete(index)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Delete Persona"
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

      {/* Create / Modify Modal - Supports ALL 5 Data Points */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative space-y-4 my-8">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <i className="fas fa-user-edit text-indigo-400"></i>
              <span>{editingPersonaIndex !== null ? `Modify Persona: ${personas[editingPersonaIndex]?.name}` : 'Create Persona'}</span>
            </h2>
            
            <div className="space-y-4 text-xs">
              {/* Data Point 1: Persona Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wide">1. Persona Name</label>
                <input 
                  type="text"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona({...newPersona, name: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Enterprise Architect"
                />
              </div>

              {/* Data Point 2: Primary Responsibility */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wide">2. Primary Responsibility</label>
                <textarea 
                  rows="2"
                  value={newPersona.role}
                  onChange={(e) => setNewPersona({...newPersona, role: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 custom-scroll"
                  placeholder="Define primary responsibilities and role scope"
                />
              </div>

              {/* Data Point 3: Decisions Owned */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wide">3. Decisions Owned</label>
                <input 
                  type="text"
                  value={newPersona.decisions}
                  onChange={(e) => setNewPersona({...newPersona, decisions: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. HLD/LLD direction, ADRs, integration contracts"
                />
              </div>

              {/* Data Point 4: Reviews & Approvals */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wide">4. Reviews & Approvals</label>
                <input 
                  type="text"
                  value={newPersona.approvals}
                  onChange={(e) => setNewPersona({...newPersona, approvals: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. User stories, acceptance criteria and UAT outcome"
                />
              </div>

            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
              >
                <i className="fas fa-save"></i>
                <span>{editingPersonaIndex !== null ? 'Save Changes' : 'Create Persona'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
