import React, { useState, useEffect, useRef } from 'react';
import { ComplexityBadge } from './ComplexityBadge';
import { specControlService } from '../services/specControlService';

export default function CascadedSpecViewerPanel({
  pageState = { isLoading: false, logs: [], complexity: null },
  customPrompt = '',
  setCustomPrompt = () => {},
  onAction = () => {},
  actionLabel = 'Generate',
  actionIcon = 'fa-magic',
  onDownloadMD = null,
  hideEditParentButton = false
}) {
  const [activeTab, setActiveTab] = useState('spec'); // 'spec' | 'logs'
  const [activeProject, setActiveProject] = useState(() => localStorage.getItem('activeProject') || 'sdd-enterprise-dev');
  const [baselineSpec, setBaselineSpec] = useState({
    specId: 'SPEC-001',
    title: 'Baseline Specification',
    content: `# Loading baseline specification from database...`
  });
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [isParentEditOpen, setIsParentEditOpen] = useState(false);
  const [parentChangeText, setParentChangeText] = useState('');
  const [driftSuccessMsg, setDriftSuccessMsg] = useState('');
  const [driftInfo, setDriftInfo] = useState({ isDrifted: false });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (baselineSpec.specId) {
      setDriftInfo(specControlService.getSpecDriftStatus(baselineSpec.specId));
    }
  }, [baselineSpec.specId]);

  const handleSubmitParentDrift = async () => {
    if (!parentChangeText.trim()) return;
    const specId = baselineSpec.specId || 'SPEC-001';
    const raisedBy = localStorage.getItem('userRole') || localStorage.getItem('userName') || 'Delivery Manager';
    await specControlService.markSpecAsDrifted(specId, parentChangeText.trim(), activeProject, raisedBy);
    setDriftInfo({ isDrifted: true, changeDetails: parentChangeText.trim(), raisedBy });
    setDriftSuccessMsg(`Parent spec ${specId} marked as DRIFTED in Spec Registry!`);
    setIsParentEditOpen(false);
    setParentChangeText('');
    setTimeout(() => setDriftSuccessMsg(''), 5000);
  };

  const extractVersion = (specObj, contentStr) => {
    if (specObj && specObj.version) return specObj.version;
    if (contentStr) {
      const match = contentStr.match(/\*\*(?:Baseline\s+)?Version:\*\*\s*v?([\d.]+)/i) ||
                    contentStr.match(/version:\s*["']?v?([\d.]+)/i);
      if (match) {
        const verStr = match[1];
        return verStr.startsWith('v') ? verStr : `v${verStr}`;
      }
    }
    return 'v1.0.0';
  };

  const fetchBaselineSpec = async (proj) => {
    try {
      const targetProj = proj || activeProject || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      const res = await fetch(`http://localhost:7001/api/specs?project=${encodeURIComponent(targetProj)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.specs) && data.specs.length > 0) {
        // Find a spec with non-empty contentMarkdown
        const withContent = data.specs.find(s => s.contentMarkdown && s.contentMarkdown.trim().length > 20);
        const baseline = withContent || data.specs.find(s => s.status === 'BASELINED_APPROVED' || s.status === 'APPROVED') || data.specs[0];
        
        if (baseline && baseline.contentMarkdown && baseline.contentMarkdown.trim().length > 20) {
          const rawId = baseline.specId || baseline.id || 'SPEC-001';
          const specDisplayId = rawId.startsWith('SPEC-') ? rawId : (rawId === 'REQ001' ? 'SPEC-001' : `SPEC-${rawId}`);
          setBaselineSpec({
            specId: specDisplayId,
            title: baseline.title || 'Specification Baseline',
            version: extractVersion(baseline, baseline.contentMarkdown),
            content: baseline.contentMarkdown
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load spec from API:', e);
    }

    // Fallback 1: Query requirements API directly from SQLite
    try {
      const targetProj = proj || activeProject || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      const reqRes = await fetch(`http://localhost:7001/api/requirements?project=${encodeURIComponent(targetProj)}`);
      const reqData = await reqRes.json();
      if (reqData.success && Array.isArray(reqData.requirements) && reqData.requirements.length > 0) {
        const req = reqData.requirements[0];
        if (req.requirement_markdown && req.requirement_markdown.trim().length > 20) {
          const rawReqId = req.requirement_id || req.idea_id || 'REQ001';
          const specDisplayId = rawReqId.startsWith('SPEC-') ? rawReqId : (rawReqId === 'REQ001' ? 'SPEC-001' : `SPEC-${rawReqId}`);
          setBaselineSpec({
            specId: specDisplayId,
            title: req.title || 'Requirement Specification Baseline',
            version: extractVersion(req, req.requirement_markdown),
            content: req.requirement_markdown
          });
          return;
        }
      }
    } catch (e) {}

    // Fallback 2: Local storage baselines
    try {
      const baselines = specControlService.getSpecBaselines();
      if (baselines && baselines.length > 0) {
        const b = baselines.find(x => x.contentMarkdown && x.contentMarkdown.trim().length > 20) || baselines[0];
        if (b && b.contentMarkdown && b.contentMarkdown.trim().length > 20) {
          setBaselineSpec({
            specId: b.specId,
            title: b.title,
            version: extractVersion(b, b.contentMarkdown),
            content: b.contentMarkdown
          });
          return;
        }
      }
    } catch (e) {}

    setBaselineSpec({
      specId: 'SPEC-2026-9961',
      title: 'Return Request Tracker System Specification',
      version: 'v1.0.0',
      content: `# Return Request Tracker System Specification\n\n1. Feature Overview\nThe Return Request Tracker system empowers customers to submit return requests, track RMA statuses, and receive refund vouchers.\n\n2. User Roles\n- Customer\n- Auditor\n- Operations Admin\n\n3. Core Endpoints\n- POST /api/v1/returns\n- GET /api/v1/returns/:id\n- PUT /api/v1/returns/:id/approve`
    });
  };

  useEffect(() => {
    fetchBaselineSpec(activeProject);

    const syncActiveProject = (e) => {
      const current = e?.detail?.projectId || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      setActiveProject(current);
      fetchBaselineSpec(current);
    };

    window.addEventListener('activeProjectChanged', syncActiveProject);
    window.addEventListener('storage', syncActiveProject);
    return () => {
      window.removeEventListener('activeProjectChanged', syncActiveProject);
      window.removeEventListener('storage', syncActiveProject);
    };
  }, [activeProject]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedDocs(prev => [
          ...prev,
          {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type || 'text/plain',
            content: event.target.result,
            uploadedAt: new Date().toLocaleTimeString()
          }
        ]);
      };
      reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDoc = (id) => {
    setAttachedDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleDefaultDownloadMD = () => {
    if (onDownloadMD) {
      onDownloadMD();
      return;
    }
    const blob = new Blob([baselineSpec.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${baselineSpec.specId || 'specification'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const defaultComplexity = { 
    score: 4, 
    level: 'MEDIUM', 
    tokenEst: 89, 
    modelChain: { 
      primaryModel: 'gemini-2.5-pro', 
      primaryProvider: 'Enterprise LiteLLM Gateway (Gemini 2.5 Pro OpenSource SLM)', 
      rationale: 'User forced Enterprise LiteLLM Gateway with Strict Open-Source Enforcement active.' 
    } 
  };

  return (
    <div className="bg-white rounded-[18px] flex flex-col overflow-hidden border border-[#ECEEF1] shadow-2xs h-full">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-[#ECEEF1] flex justify-between items-center gap-2 shrink-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex bg-[#F8F8F7] p-1 rounded-[10px] border border-[#ECEEF1]">
            <button 
              type="button"
              onClick={() => setActiveTab('spec')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                activeTab === 'spec' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              Review Spec
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              <span>Thoughts Log</span>
              {pageState?.logs && pageState.logs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-100 text-purple-800 font-mono font-bold">
                  {pageState.logs.length}
                </span>
              )}
            </button>
          </div>

          <ComplexityBadge complexity={pageState?.complexity || defaultComplexity} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="w-8 h-8 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#344054] text-xs rounded-[8px] border border-[#ECEEF1] flex items-center justify-center cursor-pointer shrink-0 transition shadow-2xs"
            title={`Upload Supporting Document${attachedDocs.length > 0 ? ` (${attachedDocs.length} attached)` : ''}`}
          >
            <i className="fas fa-paperclip text-xs text-[#7157F5]"></i>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            className="hidden" 
            accept=".md,.txt,.json,.csv,.pdf"
          />

          <button 
            type="button"
            onClick={handleDefaultDownloadMD}
            className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#344054] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shrink-0 transition shadow-2xs"
            title="Download Specification MD File"
          >
            <i className="fas fa-download text-xs text-[#667085]"></i>
            <span>MD</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content Body */}
      <div className="flex-1 p-4 overflow-auto custom-scroll flex flex-col min-h-0">
        {activeTab === 'spec' && (
          <div className="h-full flex flex-col space-y-3">
            {isParentEditOpen ? (
              /* Full-Space Parent Specification Modification Editor */
              <div className="flex-1 rounded-[14px] bg-amber-50/50 border border-amber-300 p-4 flex flex-col space-y-3 shadow-xs animate-fade-in overflow-hidden">
                <div className="flex justify-between items-center text-[#17181C] font-bold border-b border-amber-200 pb-3 shrink-0">
                  <span className="flex items-center gap-2 text-amber-800 text-sm font-bold">
                    <i className="fas fa-edit text-amber-600 text-base"></i>
                    <span>Propose Parent Specification Modification ({baselineSpec.specId})</span>
                  </span>
                  <button onClick={() => setIsParentEditOpen(false)} className="text-[#98A2B3] hover:text-[#17181C] text-sm p-1 cursor-pointer">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <p className="text-xs text-[#475467] leading-relaxed shrink-0">
                  If you need to change anything in the parent specification file, input your modification request below. Submitting this will mark <strong className="text-purple-700 font-bold">{baselineSpec.specId}</strong> as <span className="text-amber-700 font-bold uppercase">DRIFTED</span> in the Spec Registry view.
                </p>

                {/* Full-Height Textarea Taking Up Entire Available Space */}
                <textarea
                  value={parentChangeText}
                  onChange={(e) => setParentChangeText(e.target.value)}
                  placeholder="Type or paste your specification modification request here... (e.g. Update BR-001 Validation to require 2FA for all vendor approvals above $10,000, and change SLA latency threshold to 500ms)"
                  className="w-full flex-1 bg-white border border-amber-300 rounded-[10px] p-3 text-xs font-mono text-[#17181C] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 resize-none leading-relaxed custom-scroll min-h-[180px]"
                />

                <div className="flex justify-end items-center gap-2 pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsParentEditOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-[#475467] text-xs font-semibold rounded-[10px] border border-[#ECEEF1] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitParentDrift}
                    disabled={!parentChangeText.trim()}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs rounded-[10px] transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <i className="fas fa-flag text-xs"></i>
                    <span>Submit & Flag Drifted</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Non-Editable Cascaded Spec Viewer */
              <div className="relative flex-1 rounded-[14px] bg-[#F8F8F7] border border-[#ECEEF1] overflow-hidden flex flex-col">
                <div className="px-3.5 py-2 bg-[#FAFAF9] border-b border-[#ECEEF1] flex justify-between items-center text-[11px]">
                  <span className="font-mono font-bold text-purple-700 flex items-center gap-1.5">
                    <i className="fas fa-lock text-[9px] text-emerald-600"></i>
                    {baselineSpec.specId} ({baselineSpec.version || 'v1.0.0'}) — Cascaded Baseline Specification (Read-Only)
                  </span>
                  <div className="flex items-center gap-2">
                    {driftInfo.isDrifted ? (
                      <span 
                        title={driftInfo.changeDetails ? `Proposed Edit: ${driftInfo.changeDetails}` : 'Parent spec has proposed edits'} 
                        className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-[6px] font-bold uppercase tracking-wider flex items-center gap-1 text-[10px]"
                      >
                        <i className="fas fa-exclamation-triangle text-amber-500 text-[9px]"></i>
                        <span>DRIFTED</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-[6px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                        <span>Active Baseline</span>
                        <span className="font-mono text-emerald-800 font-bold text-[10px] bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          {baselineSpec.version || 'v1.0.0'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <textarea 
                  value={baselineSpec.content} 
                  readOnly
                  className="w-full flex-1 bg-transparent text-[#17181C] p-3.5 font-mono text-xs focus:outline-none custom-scroll resize-none leading-relaxed select-text cursor-default"
                  placeholder="Cascaded baseline specification content..."
                />
              </div>
            )}

            {/* Attached Supporting Documents Tray */}
            {attachedDocs.length > 0 && !isParentEditOpen && (
              <div className="p-3 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[12px] space-y-1.5 shrink-0">
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                  Attached Supporting Documents ({attachedDocs.length})
                </span>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scroll">
                  {attachedDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 px-2.5 py-1 bg-white border border-[#ECEEF1] rounded-[8px] text-xs text-[#344054] shadow-2xs">
                      <i className="fas fa-file-alt text-[#7157F5] text-xs"></i>
                      <span className="truncate max-w-[140px] font-medium" title={doc.name}>{doc.name}</span>
                      <span className="text-[10px] text-[#98A2B3] font-mono">({doc.size})</span>
                      <button 
                        onClick={() => handleRemoveDoc(doc.id)} 
                        className="text-[#98A2B3] hover:text-rose-600 transition p-0.5"
                        title="Remove Document"
                      >
                        <i className="fas fa-times text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#17181C] font-mono text-xs text-slate-200 p-4 rounded-[14px] border border-slate-800 h-full overflow-auto custom-scroll flex flex-col space-y-1 animate-fade-in">
            {(!pageState?.logs || pageState.logs.length === 0) ? (
              <div className="text-slate-400 italic p-4 text-center">No execution log history. Trigger generation to start.</div>
            ) : (
              pageState.logs.map((log, idx) => (
                <div key={idx} className={log.includes('[Error]') ? 'text-rose-400' : log.includes('[Queue]') || log.includes('[Router]') ? 'text-amber-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="p-4 bg-white border-t border-[#ECEEF1] space-y-3 shrink-0">
        {driftSuccessMsg && (
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-[10px] text-amber-800 text-[11px] font-bold flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-check-circle text-amber-600"></i>
              <span>{driftSuccessMsg}</span>
            </span>
            <span className="text-[10px] text-amber-700 font-mono">(Marked as Drifted on Spec Registry)</span>
          </div>
        )}

        <div className="flex justify-end items-center gap-2">
          {!hideEditParentButton && (
            <button
              type="button"
              onClick={() => setIsParentEditOpen(!isParentEditOpen)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-[10px] border transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 ${
                isParentEditOpen 
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
              title="Input or request changes to the parent specification file"
            >
              <i className="fas fa-pen-to-square text-xs"></i>
              <span>{isParentEditOpen ? 'Close Edit Mode' : 'Edit Parent Spec'}</span>
            </button>
          )}

          <button 
            type="button"
            onClick={onAction}
            disabled={pageState?.isLoading}
            className="px-5 py-2 bg-[#7157F5] hover:bg-[#5F46D8] text-white text-xs font-semibold rounded-[10px] flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 whitespace-nowrap transition"
          >
            {pageState?.isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={`fas ${actionIcon}`}></i>}
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
