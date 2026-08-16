import React, { useState, useEffect } from 'react';
import { governanceService } from '../services/governanceService';

export default function AgentRegistryView() {
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('ALL');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const loadRegistry = () => {
    setAgents(governanceService.getAgents());
  };

  useEffect(() => {
    loadRegistry();
    window.addEventListener('agent_registry_updated', loadRegistry);
    return () => {
      window.removeEventListener('agent_registry_updated', loadRegistry);
    };
  }, []);

  const handleToggleKillSwitch = (agentId, currentStatus) => {
    const newStatus = currentStatus === 'KILLED' ? 'ACTIVE' : 'KILLED';
    governanceService.updateAgent(agentId, { status: newStatus });
  };

  const handleAutonomyChange = (agentId, newLevel) => {
    governanceService.updateAgent(agentId, { autonomyLevel: newLevel });
  };

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.agentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.persona.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPersona = selectedPersona === 'ALL' || a.persona === selectedPersona;
    return matchesSearch && matchesPersona;
  });

  return (
    <div className="relative p-6 h-full flex flex-col space-y-6 custom-scroll overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <i className="fas fa-[#6366f1] fa-robot text-indigo-400"></i>
            <span>AI Agent Registry & Governance Control Center</span>
          </h1>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <i className="fas fa-info-circle text-indigo-400"></i>
            <span>Layer Info & Telemetry</span>
          </button>
        </div>

        <span className="px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800 rounded-full text-xs font-mono font-bold flex items-center">
          <i className="fas fa-shield-alt mr-1.5"></i> 100% Zero-Trust Enforced
        </span>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered SDLC Agents</p>
            <p className="text-lg font-black text-white font-mono">{agents.length} <span className="text-xs font-normal text-slate-400">Active</span></p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-sliders-h"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enforced SoD Rules</p>
            <p className="text-lg font-black text-emerald-400 font-mono">100% Active</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PII Redaction Interceptor</p>
            <p className="text-lg font-black text-white font-mono">ENABLED</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-power-off"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Kill Switches</p>
            <p className="text-lg font-black text-rose-400 font-mono">
              {agents.filter(a => a.status === 'KILLED').length} <span className="text-xs font-normal text-slate-400">Triggered</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agents by name or persona..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Personas</option>
          <option value="Requirement Architect">Requirement Architect</option>
          <option value="Scrum Product Owner">Scrum Product Owner</option>
          <option value="Database Architect">Database Architect</option>
          <option value="Chief Security Officer">Chief Security Officer</option>
        </select>
      </div>

      {/* Agents Governance Table */}
      <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-auto flex-1 custom-scroll">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0">
              <tr>
                <th className="p-3.5">Agent Name & ID</th>
                <th className="p-3.5">Assigned Persona</th>
                <th className="p-3.5">Autonomy Level</th>
                <th className="p-3.5">Allowed Models</th>
                <th className="p-3.5">Lifecycle Status</th>
                <th className="p-3.5 text-right">Emergency Kill Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredAgents.map((agent) => (
                <tr key={agent.agentId} className={`hover:bg-slate-900/50 transition ${agent.status === 'KILLED' ? 'bg-rose-950/20' : ''}`}>
                  <td className="p-3.5">
                    <div className="font-bold text-indigo-400 font-sans">{agent.agentName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{agent.agentId}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-200">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px]">
                      {agent.persona}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={agent.autonomyLevel}
                      onChange={(e) => handleAutonomyChange(agent.agentId, e.target.value)}
                      disabled={agent.status === 'KILLED'}
                      className="bg-slate-900 border border-slate-700 text-amber-300 rounded px-2 py-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Advisory">Advisory</option>
                      <option value="Generate">Generate</option>
                      <option value="Validate">Validate</option>
                      <option value="Bounded Execution">Bounded Execution</option>
                    </select>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-purple-300">
                    {agent.allowedModels?.join(', ')}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      agent.status === 'ACTIVE' 
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' 
                        : 'bg-rose-950/50 text-rose-400 border border-rose-800'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleKillSwitch(agent.agentId, agent.status)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center space-x-1.5 ml-auto cursor-pointer shadow-md ${
                        agent.status === 'KILLED'
                          ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400 hover:bg-emerald-900'
                          : 'bg-rose-950/60 border-rose-700 text-rose-400 hover:bg-rose-900'
                      }`}
                    >
                      <i className="fas fa-power-off"></i>
                      <span>{agent.status === 'KILLED' ? 'Re-enable Agent' : 'KILL SWITCH'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target State Layer 2 Info & Telemetry Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scroll text-left">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Target State Layer 2 of 6
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Document ID: SDD-REQ-L2-GS</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5 flex items-center space-x-2.5">
                  <i className="fas fa-shield-alt text-indigo-400"></i>
                  <span>Governance & Security Layer Control Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces zero-trust agent authorization, segregation of duties, secret isolation, data classification, and emergency kill switches.
                </p>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer text-lg p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Architecture Highlights */}
            <div className="space-y-3 text-xs text-slate-300 font-sans">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-indigo-400 uppercase text-[11px]">Layer 2 Governance Objectives</h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li><strong>Agent Registry & Kill Switch (`GS-FR-001`):</strong> Maintains explicit permissions and autonomy limits for all 102 SDLC persona agents with central kill-switch control.</li>
                  <li><strong>Segregation of Duties (`GS-FR-004`):</strong> Prevents self-approval conflicts (e.g. author cannot self-approve their own spec baseline).</li>
                  <li><strong>PII & Secret Redaction (`GS-FR-012`):</strong> Automatically masks sensitive API keys, passwords, and PII before prompts reach LLMs.</li>
                  <li><strong>Model Allow-listing (`GS-FR-013`):</strong> Binds sensitive tasks strictly to verified enterprise model endpoints.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg"
              >
                Close Info Modal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
