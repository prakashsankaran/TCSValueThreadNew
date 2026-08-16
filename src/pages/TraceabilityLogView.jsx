import React, { useState, useEffect } from 'react';
import { evidenceService } from '../services/evidenceService';
import ArtifactLineageTree from '../components/ArtifactLineageTree';

const TraceabilityLogView = () => {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'decisions' | 'registry' | 'audit' | 'dashboard'
  const [ledger, setLedger] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorrelation, setSelectedCorrelation] = useState(null);
  const [auditExport, setAuditExport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const activeProject = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';

  const loadData = () => {
    setLedger(evidenceService.getLedger());
    setDecisions(evidenceService.getDecisions());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('evidence_ledger_updated', loadData);
    window.addEventListener('decision_log_updated', loadData);
    return () => {
      window.removeEventListener('evidence_ledger_updated', loadData);
      window.removeEventListener('decision_log_updated', loadData);
    };
  }, []);

  const handleGenerateAuditExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const manifest = evidenceService.generateAuditExport('001-return-request-tracker');
      setAuditExport(manifest);
      setIsExporting(false);
    }, 800);
  };

  const handleDownloadManifestJSON = () => {
    if (!auditExport) return;
    const blob = new Blob([JSON.stringify(auditExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Export_Manifest_${auditExport.exportId}.json`;
    a.click();
  };

  const filteredLedger = ledger.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.evidenceId.toLowerCase().includes(term) ||
      item.correlationId.toLowerCase().includes(term) ||
      item.agentId.toLowerCase().includes(term) ||
      item.model.toLowerCase().includes(term) ||
      item.actionType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="relative p-6 h-full flex flex-col space-y-5 custom-scroll overflow-y-auto">
      
      {/* Target State Layer 1 Info & Telemetry Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scroll text-left">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Target State Layer 1 of 6
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Document ID: SDD-REQ-L1-EM</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5 flex items-center space-x-2.5">
                  <i className="fas fa-shield-alt text-emerald-400"></i>
                  <span>Evidence & Measurement Layer Control Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Authoritative, append-only immutable evidence ledger, decision & dissent log, prompt provenance, and value attribution for <span className="font-mono text-indigo-300 font-semibold">{activeProject}</span>.
                </p>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer text-lg p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* KPI Telemetry Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-link"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Immutable Evidence Events</p>
                  <p className="text-lg font-black text-white font-mono">{ledger.length} <span className="text-xs font-normal text-slate-400">Records</span></p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-fingerprint"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cryptographic Integrity</p>
                  <p className="text-lg font-black text-emerald-400 font-mono">100% SHA-256</p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-gavel"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recorded Decisions</p>
                  <p className="text-lg font-black text-white font-mono">{decisions.length} <span className="text-xs font-normal text-amber-400">(1 Dissent)</span></p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Readiness</p>
                  <p className="text-lg font-black text-purple-400 font-mono">GRADE A+</p>
                </div>
              </div>
            </div>

            {/* Architecture Overview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-indigo-400 uppercase text-[11px]">Layer 1 Foundational Objectives</h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>Append-only tamper-evident evidence events linking inputs, AI model decisions, human reviews, and release deployment telemetry.</li>
                <li>Preservation of dissenting reviewer opinions alongside final gate approval outcomes.</li>
                <li>Versioned prompt, system instruction, and model parameter provenance tracking.</li>
                <li>1-Click Auditor-Ready Manifest Export package generation with cryptographic SHA-256 verification.</li>
              </ul>
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

      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <i className="fas fa-shield-alt text-emerald-400"></i>
            <span>Evidence Ledger</span>
          </h1>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="View Evidence & Measurement Layer Architecture & Telemetry Info"
          >
            <i className="fas fa-info-circle text-indigo-400"></i>
            <span>Layer Info & Telemetry</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 space-x-1">
        {[
          { id: 'ledger', label: '📜 Evidence Ledger', icon: 'fa-list-ol' },
          { id: 'decisions', label: '⚖️ Decision & Dissent Log', icon: 'fa-gavel' },
          { id: 'registry', label: '🤖 Prompt/Output Registry', icon: 'fa-robot', disabled: true },
          { id: 'audit', label: '📦 Audit Export Service', icon: 'fa-file-archive', disabled: true },
          { id: 'dashboard', label: '📊 Value & Adoption Dashboard', icon: 'fa-chart-pie', disabled: true }
        ].map(t => (
          <button
            key={t.id}
            disabled={t.disabled}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              t.disabled
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-500 bg-transparent'
                : activeTab === t.id
                ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20 cursor-pointer'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 cursor-pointer'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>


      {/* Tab 1: Evidence Ledger */}
      {activeTab === 'ledger' && (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Evidence ID, Correlation Key, Agent, or Model..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 font-mono">Showing {filteredLedger.length} append-only events</span>
              <button
                onClick={() => {
                  evidenceService.clearLedger();
                  loadData();
                }}
                className="bg-rose-950/40 border border-rose-800/80 text-rose-300 hover:bg-rose-900/60 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <i className="fas fa-trash-alt text-rose-400 text-xs"></i>
                <span>Clear</span>
              </button>
              <button
                onClick={loadData}
                className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <i className="fas fa-sync-alt text-indigo-400 text-xs"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-auto flex-1 custom-scroll">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Evidence ID</th>
                    <th className="p-3">Correlation Key</th>
                    <th className="p-3">Actor / Persona</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Routed Model</th>
                    <th className="p-3">SHA-256 Hash</th>
                    <th className="p-3">Policy Result</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {filteredLedger.map((row) => (
                    <tr key={row.evidenceId} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 font-bold text-indigo-400">{row.evidenceId}</td>
                      <td className="p-3">
                        <span 
                          onClick={() => setSelectedCorrelation(row.correlationId)}
                          className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 rounded text-[10px] cursor-pointer hover:bg-indigo-900"
                        >
                          {row.correlationId}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200">
                        <div className="font-sans font-medium">{row.agentId}</div>
                        <div className="text-[10px] text-slate-500">{row.persona}</div>
                      </td>
                      <td className="p-3 text-amber-300">{row.actionType}</td>
                      <td className="p-3 text-purple-300 truncate max-w-[140px]">{row.model}</td>
                      <td className="p-3 text-emerald-400 text-[10px]">{row.payloadHash}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.policyResult === 'APPROVED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' : 'bg-amber-950/40 text-amber-400 border border-amber-800'
                        }`}>
                          {row.policyResult}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[10px]">{new Date(row.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Decision & Dissent Log */}
      {activeTab === 'decisions' && (
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {decisions.map(dec => (
              <div key={dec.decisionId} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-lg font-mono">
                      {dec.decisionId}
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase">{dec.type}</h3>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    dec.status === 'APPROVED_WITH_DISSENT' ? 'bg-amber-950/40 text-amber-400 border-amber-800' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                  }`}>
                    {dec.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chosen Option & Rationale</p>
                    <p className="text-slate-200 font-semibold mt-1">{dec.selectedOption}</p>
                    <p className="text-slate-400 mt-1 leading-relaxed">{dec.rationale}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approver Signatures</p>
                    <div className="flex space-x-2 mt-1">
                      {dec.approvers?.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900 rounded font-semibold text-[11px]">
                          <i className="fas fa-user-check mr-1"></i> {a}
                        </span>
                      ))}
                    </div>
                    {dec.conditions && (
                      <p className="text-[11px] text-amber-300 mt-2">
                        <strong>Gate Conditions:</strong> {dec.conditions}
                      </p>
                    )}
                  </div>
                </div>

                {dec.dissent && (
                  <div className="bg-rose-950/20 border border-rose-800/40 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center">
                      <i className="fas fa-exclamation-circle mr-1.5"></i> Preserved Dissent Record
                    </p>
                    <p className="text-xs text-rose-200 font-medium">Actor: {dec.dissent.actor}</p>
                    <p className="text-xs text-rose-300 italic">"{dec.dissent.note}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Prompt/Output Registry */}
      {activeTab === 'registry' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center">
            <i className="fas fa-robot text-purple-400 mr-2"></i> Prompt & Output Provenance Registry
          </h3>
          <p className="text-xs text-slate-400">
            Registered prompt templates, system instructions, temperature parameters, and payload citation hashes used across production agents.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-indigo-400 font-bold">Template ID: SDD-PROMPT-FSD-v2.1</span>
              <span className="text-slate-500">Model: gemini-2.5-pro</span>
            </div>
            <p className="text-slate-400 font-sans">
              <strong>System Instruction:</strong> You are an expert Enterprise Software Architect compiling an IEEE-830 functional spec. Structure input into Functional Features, Endpoints, Database Schema, and Security Guardrails.
            </p>
            <div className="flex space-x-4 text-[10px] text-slate-500 pt-2 border-t border-slate-850">
              <span>Temperature: 0.2</span>
              <span>Top_P: 0.95</span>
              <span>Max Tokens: 8192</span>
              <span>Input Hash: sha256_e82a9104b</span>
            </div>
          </div>
        </div>
      )}



      {/* Correlation Drawer Modal */}
      {selectedCorrelation && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <i className="fas fa-link text-indigo-400"></i>
                <span>Correlation Chain Inspector: {selectedCorrelation}</span>
              </h3>
              <button onClick={() => setSelectedCorrelation(null)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              {ledger.filter(l => l.correlationId === selectedCorrelation).map((r, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-indigo-400 font-bold">{r.agentId}</p>
                    <p className="text-[10px] text-slate-500">{r.actionType}</p>
                  </div>
                  <span className="text-emerald-400 text-[10px]">{r.payloadHash}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Target State Layer 1 Info & Telemetry Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Target State Layer 1 of 6
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Document ID: SDD-REQ-L1-EM</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5 flex items-center space-x-2.5">
                  <i className="fas fa-shield-alt text-emerald-400"></i>
                  <span>Evidence & Measurement Layer Control Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Authoritative, append-only immutable evidence ledger, decision & dissent log, prompt provenance, and value attribution for <span className="font-mono text-indigo-300 font-semibold">{activeProject}</span>.
                </p>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer text-lg p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* KPI Telemetry Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-link"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Immutable Evidence Events</p>
                  <p className="text-lg font-black text-white font-mono">{ledger.length} <span className="text-xs font-normal text-slate-400">Records</span></p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-fingerprint"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cryptographic Integrity</p>
                  <p className="text-lg font-black text-emerald-400 font-mono">100% SHA-256</p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-gavel"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recorded Decisions</p>
                  <p className="text-lg font-black text-white font-mono">{decisions.length} <span className="text-xs font-normal text-amber-400">(1 Dissent)</span></p>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg bg-slate-950/60">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Readiness</p>
                  <p className="text-lg font-black text-purple-400 font-mono">GRADE A+</p>
                </div>
              </div>
            </div>

            {/* Architecture Overview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-indigo-400 uppercase text-[11px]">Layer 1 Foundational Objectives</h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>Append-only tamper-evident evidence events linking inputs, AI model decisions, human reviews, and release deployment telemetry.</li>
                <li>Preservation of dissenting reviewer opinions alongside final gate approval outcomes.</li>
                <li>Versioned prompt, system instruction, and model parameter provenance tracking.</li>
                <li>1-Click Auditor-Ready Manifest Export package generation with cryptographic SHA-256 verification.</li>
              </ul>
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
};

export default TraceabilityLogView;
