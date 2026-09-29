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
    <div className="relative p-6 h-full flex flex-col space-y-5 custom-scroll overflow-y-auto text-[#17181C]">
      
      {/* Target State Layer 1 Info & Telemetry Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-[#17181C]/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scroll text-left text-[#17181C]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-[#7157F5] to-purple-500 rounded-t-[20px]"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#ECEEF1] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-[#F4F1FF] text-[#5F46D8] border border-[#E4DCFF] text-[10px] font-bold uppercase tracking-wider rounded-[6px]">
                    Target State Layer 1 of 6
                  </span>
                  <span className="text-[10px] text-[#667085] font-mono">Document ID: SDD-REQ-L1-EM</span>
                </div>
                <h2 className="text-xl font-bold text-[#17181C] mt-1.5 flex items-center space-x-2.5">
                  <i className="fas fa-shield-alt text-emerald-600"></i>
                  <span>Evidence & Measurement Layer Control Center</span>
                </h2>
                <p className="text-xs text-[#667085] mt-1">
                  Authoritative, append-only immutable evidence ledger, decision & dissent log, prompt provenance, and value attribution for <span className="font-mono text-[#5F46D8] font-semibold">{activeProject}</span>.
                </p>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)} 
                className="text-[#98A2B3] hover:text-[#17181C] p-1 rounded-lg hover:bg-[#F8F8F7] transition cursor-pointer text-lg"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* KPI Telemetry Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-[14px] border border-[#ECEEF1] flex items-center space-x-3 shadow-2xs bg-[#FAFAF9]">
                <div className="w-10 h-10 rounded-[10px] bg-[#F4F1FF] border border-[#E4DCFF] text-[#7157F5] flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-link"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Immutable Evidence</p>
                  <p className="text-lg font-bold text-[#17181C] font-mono">{ledger.length} <span className="text-xs font-normal text-[#667085]">Records</span></p>
                </div>
              </div>

              <div className="p-4 rounded-[14px] border border-[#ECEEF1] flex items-center space-x-3 shadow-2xs bg-[#FAFAF9]">
                <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-fingerprint"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Cryptographic Integrity</p>
                  <p className="text-lg font-bold text-emerald-700 font-mono">100% SHA-256</p>
                </div>
              </div>

              <div className="p-4 rounded-[14px] border border-[#ECEEF1] flex items-center space-x-3 shadow-2xs bg-[#FAFAF9]">
                <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-gavel"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Recorded Decisions</p>
                  <p className="text-lg font-bold text-[#17181C] font-mono">{decisions.length} <span className="text-xs font-normal text-amber-700">(1 Dissent)</span></p>
                </div>
              </div>

              <div className="p-4 rounded-[14px] border border-[#ECEEF1] flex items-center space-x-3 shadow-2xs bg-[#FAFAF9]">
                <div className="w-10 h-10 rounded-[10px] bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center text-lg shrink-0">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Audit Readiness</p>
                  <p className="text-lg font-bold text-purple-700 font-mono">GRADE A+</p>
                </div>
              </div>
            </div>

            {/* Architecture Overview */}
            <div className="bg-[#FAFAF9] p-4 rounded-[12px] border border-[#ECEEF1] space-y-2 text-xs text-[#344054]">
              <h4 className="font-bold text-[#7157F5] uppercase text-[11px]">Layer 1 Foundational Objectives</h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#667085]">
                <li>Append-only tamper-evident evidence events linking inputs, AI model decisions, human reviews, and release deployment telemetry.</li>
                <li>Preservation of dissenting reviewer opinions alongside final gate approval outcomes.</li>
                <li>Versioned prompt, system instruction, and model parameter provenance tracking.</li>
                <li>1-Click Auditor-Ready Manifest Export package generation with cryptographic SHA-256 verification.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ECEEF1]">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-[#17181C] hover:bg-[#292B30] text-white text-xs font-semibold rounded-[10px] transition cursor-pointer shadow-sm"
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
          <h1 className="text-xl font-bold text-[#17181C] flex items-center space-x-2">
            <i className="fas fa-shield-alt text-emerald-600"></i>
            <span>Evidence Ledger</span>
          </h1>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="px-3 py-1.5 bg-[#F4F1FF] hover:bg-[#E4DCFF] border border-[#E4DCFF] text-[#5F46D8] rounded-[10px] text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="View Evidence & Measurement Layer Architecture & Telemetry Info"
          >
            <i className="fas fa-info-circle text-[#7157F5]"></i>
            <span>Layer Info & Telemetry</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#ECEEF1] space-x-1">
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
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              t.disabled
                ? 'opacity-40 cursor-not-allowed border-transparent text-[#98A2B3] bg-transparent'
                : activeTab === t.id
                ? 'border-[#7157F5] text-[#5F46D8] bg-[#F4F1FF] font-bold cursor-pointer rounded-t-[8px]'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-[#F8F8F7] cursor-pointer'
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
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Evidence ID, Correlation Key, Agent, or Model..."
                className="w-full bg-white border border-[#ECEEF1] rounded-[10px] pl-9 pr-4 py-2 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] shadow-2xs"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-[#667085] font-mono">Showing {filteredLedger.length} append-only events</span>
              <button
                onClick={() => {
                  evidenceService.clearLedger();
                  loadData();
                }}
                className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <i className="fas fa-trash-alt text-rose-600 text-xs"></i>
                <span>Clear</span>
              </button>
              <button
                onClick={loadData}
                className="bg-white border border-[#ECEEF1] text-[#344054] hover:bg-[#F8F8F7] px-3 py-1.5 rounded-[8px] text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <i className="fas fa-sync-alt text-[#7157F5] text-xs"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white border border-[#ECEEF1] rounded-[16px] overflow-hidden shadow-2xs flex flex-col">
            <div className="overflow-auto flex-1 custom-scroll">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#FAFAF9] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-semibold text-[10px] sticky top-0">
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
                <tbody className="divide-y divide-[#ECEEF1] text-[#344054] font-mono">
                  {filteredLedger.map((row) => (
                    <tr key={row.evidenceId} className="hover:bg-[#FAFAF9] transition">
                      <td className="p-3 font-bold text-[#5F46D8]">{row.evidenceId}</td>
                      <td className="p-3">
                        <span 
                          onClick={() => setSelectedCorrelation(row.correlationId)}
                          className="px-2 py-0.5 bg-[#F4F1FF] border border-[#E4DCFF] text-[#5F46D8] rounded-[6px] text-[10px] cursor-pointer hover:bg-[#E4DCFF]"
                        >
                          {row.correlationId}
                        </span>
                      </td>
                      <td className="p-3 text-[#17181C]">
                        <div className="font-sans font-semibold">{row.agentId}</div>
                        <div className="text-[10px] text-[#667085]">{row.persona}</div>
                      </td>
                      <td className="p-3 text-amber-700 font-sans font-semibold">{row.actionType}</td>
                      <td className="p-3 text-[#5F46D8] truncate max-w-[140px]">{row.model}</td>
                      <td className="p-3 text-emerald-700 text-[10px]">{row.payloadHash}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
                          row.policyResult === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {row.policyResult}
                        </span>
                      </td>
                      <td className="p-3 text-[#667085] text-[10px]">{new Date(row.timestamp).toLocaleTimeString()}</td>
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
              <div key={dec.decisionId} className="bg-white p-5 rounded-[16px] border border-[#ECEEF1] space-y-3 shadow-2xs">
                <div className="flex justify-between items-center border-b border-[#ECEEF1] pb-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-[6px] font-mono">
                      {dec.decisionId}
                    </span>
                    <h3 className="text-sm font-bold text-[#17181C] uppercase">{dec.type}</h3>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    dec.status === 'APPROVED_WITH_DISSENT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {dec.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Chosen Option & Rationale</p>
                    <p className="text-[#17181C] font-semibold mt-1">{dec.selectedOption}</p>
                    <p className="text-[#667085] mt-1 leading-relaxed">{dec.rationale}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Approver Signatures</p>
                    <div className="flex space-x-2 mt-1">
                      {dec.approvers?.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F4F1FF] text-[#5F46D8] border border-[#E4DCFF] rounded-[6px] font-semibold text-[11px]">
                          <i className="fas fa-user-check mr-1 text-[#7157F5]"></i> {a}
                        </span>
                      ))}
                    </div>
                    {dec.conditions && (
                      <p className="text-[11px] text-amber-800 mt-2">
                        <strong>Gate Conditions:</strong> {dec.conditions}
                      </p>
                    )}
                  </div>
                </div>

                {dec.dissent && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-[10px] space-y-1">
                    <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center">
                      <i className="fas fa-exclamation-circle mr-1.5"></i> Preserved Dissent Record
                    </p>
                    <p className="text-xs text-rose-900 font-semibold">Actor: {dec.dissent.actor}</p>
                    <p className="text-xs text-rose-800 italic">"{dec.dissent.note}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Prompt/Output Registry */}
      {activeTab === 'registry' && (
        <div className="bg-white p-6 rounded-[16px] border border-[#ECEEF1] space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-[#17181C] uppercase flex items-center">
            <i className="fas fa-robot text-[#7157F5] mr-2"></i> Prompt & Output Provenance Registry
          </h3>
          <p className="text-xs text-[#667085]">
            Registered prompt templates, system instructions, temperature parameters, and payload citation hashes used across production agents.
          </p>

          <div className="bg-[#FAFAF9] p-4 rounded-[12px] border border-[#ECEEF1] space-y-3 text-xs font-mono text-[#17181C]">
            <div className="flex justify-between items-center border-b border-[#ECEEF1] pb-2">
              <span className="text-[#5F46D8] font-bold">Template ID: SDD-PROMPT-FSD-v2.1</span>
              <span className="text-[#667085]">Model: gemini-2.5-pro</span>
            </div>
            <p className="text-[#344054] font-sans">
              <strong>System Instruction:</strong> You are an expert Enterprise Software Architect compiling an IEEE-830 functional spec. Structure input into Functional Features, Endpoints, Database Schema, and Security Guardrails.
            </p>
            <div className="flex space-x-4 text-[10px] text-[#667085] pt-2 border-t border-[#ECEEF1]">
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
        <div className="fixed inset-0 bg-[#17181C]/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] max-w-xl w-full p-6 shadow-2xl space-y-4 text-[#17181C]">
            <div className="flex justify-between items-center border-b border-[#ECEEF1] pb-3">
              <h3 className="text-sm font-bold text-[#17181C] flex items-center space-x-2">
                <i className="fas fa-link text-[#7157F5]"></i>
                <span>Correlation Chain Inspector: {selectedCorrelation}</span>
              </h3>
              <button onClick={() => setSelectedCorrelation(null)} className="text-[#98A2B3] hover:text-[#17181C] p-1 rounded-lg hover:bg-[#F8F8F7]">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono text-[#344054]">
              {ledger.filter(l => l.correlationId === selectedCorrelation).map((r, i) => (
                <div key={i} className="p-3 bg-[#FAFAF9] rounded-[10px] border border-[#ECEEF1] flex justify-between items-center shadow-2xs">
                  <div>
                    <p className="text-[#5F46D8] font-bold font-sans">{r.agentId}</p>
                    <p className="text-[10px] text-[#667085]">{r.actionType}</p>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-mono">{r.payloadHash}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TraceabilityLogView;
