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
    <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800 shadow-xl h-full">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center gap-2 shrink-0">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button 
              type="button"
              onClick={() => setActiveTab('spec')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'spec' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Review Spec
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Thoughts Log</span>
              {pageState?.logs && pageState.logs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-950 text-indigo-300 font-mono border border-indigo-700">
                  {pageState.logs.length}
                </span>
              )}
            </button>
          </div>

          <ComplexityBadge complexity={pageState?.complexity || defaultComplexity} />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button 
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center cursor-pointer shrink-0"
            title={`Upload Supporting Document${attachedDocs.length > 0 ? ` (${attachedDocs.length} attached)` : ''}`}
          >
            <i className="fas fa-paperclip text-xs"></i>
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
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 cursor-pointer shrink-0"
            title="Download Specification MD File"
          >
            <i className="fas fa-download text-xs"></i>
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
              <div className="flex-1 rounded-2xl bg-slate-950/95 border-2 border-amber-500/50 p-4 flex flex-col space-y-3 shadow-2xl animate-fade-in overflow-hidden">
                <div className="flex justify-between items-center text-slate-200 font-bold border-b border-slate-800/80 pb-3 shrink-0">
                  <span className="flex items-center space-x-2 text-amber-300 text-sm font-extrabold">
                    <i className="fas fa-edit text-amber-400 text-base"></i>
                    <span>Propose Parent Specification Modification ({baselineSpec.specId})</span>
                  </span>
                  <button onClick={() => setIsParentEditOpen(false)} className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed shrink-0">
                  If you need to change anything in the parent specification file, input your modification request below. Submitting this will mark <strong className="text-indigo-300 font-bold">{baselineSpec.specId}</strong> as <span className="text-amber-400 font-extrabold uppercase">DRIFTED</span> in the Spec Registry view.
                </p>

                {/* Full-Height Textarea Taking Up Entire Available Space */}
                <textarea
                  value={parentChangeText}
                  onChange={(e) => setParentChangeText(e.target.value)}
                  placeholder="Type or paste your specification modification request here... (e.g. Update BR-001 Validation to require 2FA for all vendor approvals above $10,000, and change SLA latency threshold to 500ms)"
                  className="w-full flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 resize-none leading-relaxed custom-scroll min-h-[180px]"
                />

                <div className="flex justify-end items-center space-x-3 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsParentEditOpen(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitParentDrift}
                    disabled={!parentChangeText.trim()}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-lg shrink-0"
                  >
                    <i className="fas fa-flag text-sm"></i>
                    <span>Submit & Flag Drifted</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Non-Editable Cascaded Spec Viewer */
              <div className="relative flex-1 rounded-xl bg-slate-950/70 border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                    <i className="fas fa-lock text-[9px] text-emerald-400"></i>
                    {baselineSpec.specId} ({baselineSpec.version || 'v1.0.0'}) — Cascaded Baseline Specification (Read-Only)
                  </span>
                  <div className="flex items-center space-x-2">
                    {driftInfo.isDrifted ? (
                      <span 
                        title={driftInfo.changeDetails ? `Proposed Edit: ${driftInfo.changeDetails}` : 'Parent spec has proposed edits'} 
                        className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 cursor-help"
                      >
                        <i className="fas fa-exclamation-triangle text-amber-400 text-[9px]"></i>
                        <span>DRIFTED</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span>Active Baseline</span>
                        <span className="font-mono text-emerald-300 font-extrabold text-[10px] bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                          {baselineSpec.version || 'v1.0.0'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <textarea 
                  value={baselineSpec.content} 
                  readOnly
                  className="w-full flex-1 bg-transparent text-slate-300 p-3.5 font-mono text-xs focus:outline-none custom-scroll resize-none leading-relaxed select-text cursor-default"
                  placeholder="Cascaded baseline specification content..."
                />
              </div>
            )}

            {/* Attached Supporting Documents Tray */}
            {attachedDocs.length > 0 && !isParentEditOpen && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Attached Supporting Documents ({attachedDocs.length})
                </span>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scroll">
                  {attachedDocs.map(doc => (
                    <div key={doc.id} className="flex items-center space-x-2 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
                      <i className="fas fa-file-alt text-indigo-400 text-xs"></i>
                      <span className="truncate max-w-[140px]" title={doc.name}>{doc.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({doc.size})</span>
                      <button 
                        onClick={() => handleRemoveDoc(doc.id)} 
                        className="text-slate-500 hover:text-rose-400 transition"
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
          <div className="bg-slate-950 font-mono text-xs text-slate-300 p-4 rounded-xl border border-slate-800 h-full overflow-auto custom-scroll flex flex-col space-y-1 animate-fade-in">
            {(!pageState?.logs || pageState.logs.length === 0) ? (
              <div className="text-slate-500 italic p-4 text-center">No execution log history. Trigger generation to start.</div>
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
      <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 space-y-3 shrink-0">
        {driftSuccessMsg && (
          <div className="px-3 py-1.5 bg-amber-950/90 border border-amber-800 rounded-xl text-amber-300 text-[11px] font-bold flex items-center justify-between animate-fade-in">
            <span className="flex items-center space-x-1.5">
              <i className="fas fa-check-circle text-amber-400"></i>
              <span>{driftSuccessMsg}</span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-normal">(Marked as Drifted on Spec Registry)</span>
          </div>
        )}

        <div className="flex justify-end items-center space-x-3">
          {!hideEditParentButton && (
            <button
              type="button"
              onClick={() => setIsParentEditOpen(!isParentEditOpen)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 shadow-md shrink-0 ${
                isParentEditOpen 
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 hover:text-white border-amber-700/60'
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg border border-indigo-500/30 cursor-pointer shrink-0 whitespace-nowrap"
          >
            {pageState?.isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={`fas ${actionIcon}`}></i>}
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
