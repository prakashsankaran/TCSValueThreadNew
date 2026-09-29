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
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17181C] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-sm shrink-0">
              <i className="fas fa-users-cog"></i>
            </div>
            <span>Persona & Role Governance</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Define accountable SDLC personas, decision boundaries, review permissions, and agent pairings.
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="bg-[#7157F5] hover:bg-[#5F46D8] text-white font-semibold py-2 px-4 rounded-[10px] shadow-2xs transition-all flex items-center gap-2 text-xs cursor-pointer"
        >
          <i className="fas fa-plus text-[10px]"></i>
          <span>Create Persona</span>
        </button>
      </div>

      {/* Search & Overview Bar */}
      <div className="bg-white border border-[#ECEEF1] rounded-[16px] p-3.5 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-2xs">
        <div className="w-full sm:flex-1 relative">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] text-xs"></i>
          <input 
            type="text" 
            placeholder="Search personas by name, responsibility, or decision area..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 pl-9 pr-4 text-xs text-[#17181C] placeholder-[#98A2B3] focus:outline-none focus:border-[#7157F5] focus:bg-white transition"
          />
        </div>
        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-[8px] shrink-0">
          {personas.length} Active Personas Cataloged
        </span>
      </div>

      {/* Table Panel */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#ECEEF1] bg-[#FAFAF9] flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17181C]">Accountable SDLC Persona Catalog</h3>
            <p className="text-[11px] text-[#667085]">Each persona owns specific governance decisions and is supported by bounded AI agents.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[10px] uppercase tracking-wider text-[#667085] font-bold">
                <th className="py-3 px-4">Persona Name</th>
                <th className="py-3 px-4">Primary Responsibility</th>
                <th className="py-3 px-4">Decisions Owned</th>
                <th className="py-3 px-4">Reviews & Approvals</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF1] text-[#344054]">
              {filteredPersonas.map((persona, index) => (
                <tr key={index} className="hover:bg-[#F8F8F7]/80 transition group">
                  <td className="py-3.5 px-4 font-semibold text-[#17181C]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {persona.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[#17181C]">{persona.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#475467] max-w-[280px]">
                    {persona.role}
                  </td>
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <span className="inline-block px-2 py-0.5 rounded-[6px] bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                      {persona.decisions || 'Governance & Scope'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#667085] text-[11px] max-w-[200px]">
                    {persona.approvals || 'Gate Sign-offs'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handleOpenModify(index)}
                        className="bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] text-[#344054] px-2.5 py-1 rounded-[8px] text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                      >
                        Modify
                      </button>
                      <button 
                        onClick={() => handleDelete(index)}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-2 py-1 rounded-[8px] text-[11px] font-semibold transition cursor-pointer"
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

      {/* Create / Modify Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] p-6 w-full max-w-lg shadow-2xl relative space-y-4 my-8">
            <div className="flex justify-between items-center pb-2 border-b border-[#F2F4F7]">
              <h2 className="text-base font-bold text-[#17181C] flex items-center gap-2">
                <i className="fas fa-user-edit text-[#7157F5]"></i>
                <span>{editingPersonaIndex !== null ? `Modify Persona: ${personas[editingPersonaIndex]?.name}` : 'Create Persona'}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#17181C] text-sm cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              {/* Data Point 1: Persona Name */}
              <div>
                <label className="block text-[#344054] font-bold mb-1 uppercase tracking-wide text-[10px]">1. Persona Name</label>
                <input 
                  type="text"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona({...newPersona, name: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                  placeholder="e.g. Enterprise Architect"
                />
              </div>

              {/* Data Point 2: Primary Responsibility */}
              <div>
                <label className="block text-[#344054] font-bold mb-1 uppercase tracking-wide text-[10px]">2. Primary Responsibility</label>
                <textarea 
                  rows="2"
                  value={newPersona.role}
                  onChange={(e) => setNewPersona({...newPersona, role: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white custom-scroll"
                  placeholder="Define primary responsibilities and role scope"
                />
              </div>

              {/* Data Point 3: Decisions Owned */}
              <div>
                <label className="block text-[#344054] font-bold mb-1 uppercase tracking-wide text-[10px]">3. Decisions Owned</label>
                <input 
                  type="text"
                  value={newPersona.decisions}
                  onChange={(e) => setNewPersona({...newPersona, decisions: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                  placeholder="e.g. HLD/LLD direction, ADRs, integration contracts"
                />
              </div>

              {/* Data Point 4: Reviews & Approvals */}
              <div>
                <label className="block text-[#344054] font-bold mb-1 uppercase tracking-wide text-[10px]">4. Reviews & Approvals</label>
                <input 
                  type="text"
                  value={newPersona.approvals}
                  onChange={(e) => setNewPersona({...newPersona, approvals: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                  placeholder="e.g. User stories, acceptance criteria and UAT outcome"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECEEF1]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-[#7157F5] hover:bg-[#5F46D8] text-white px-4 py-2 rounded-[10px] text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
