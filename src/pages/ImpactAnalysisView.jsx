import React, { useState, useEffect } from 'react';

export default function ImpactAnalysisView() {
  const [newRequirement, setNewRequirement] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [contextInfo, setContextInfo] = useState({
    codeSnippetsCount: 0,
    hasDbSchema: false,
    hasGuardrails: false,
    activeSpec: '001-meeting-manager'
  });

  useEffect(() => {
    fetch('http://localhost:7001/api/brownfield/context')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.context) {
          setContextInfo({
            codeSnippetsCount: (data.context.codeSnippets || []).length,
            hasDbSchema: !!data.context.dbSchema,
            hasGuardrails: !!data.context.legacyGuardrails,
            activeSpec: '001-meeting-manager'
          });
        }
      })
      .catch(err => console.error('Failed fetching context info:', err));
  }, []);

  const handleRunAnalysis = async () => {
    if (!newRequirement.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a new requirement or feature change description.' });
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage(null);

    try {
      const res = await fetch('http://localhost:7001/api/impact-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRequirement: newRequirement.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysisReport);
        setStatusMessage({ type: 'success', text: 'Impact & Gap Analysis completed successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to complete Impact Analysis.' });
      }
    } catch (err) {
      console.error('Impact analysis error:', err);
      setStatusMessage({ type: 'error', text: 'Network or server error running Impact Analysis.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePresetClick = (presetText) => {
    setNewRequirement(presetText);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scroll overflow-y-auto">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl shadow-lg">
              <i className="fas fa-search-plus"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Phase 3: Brownfield AI
                </span>
                <h1 className="text-lg font-bold text-white">Impact & Gap Specification Engine</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Evaluate new feature requirements against your Current-State Baseline Spec & vectorized codebase to detect breaking risks and generate Delta Specs.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-[10px]">
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 rounded-lg text-slate-300">
              <i className="fas fa-code text-indigo-400"></i>
              <span>{contextInfo.codeSnippetsCount} Files</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 rounded-lg text-slate-300">
              <i className={`fas ${contextInfo.hasDbSchema ? 'fa-database text-green-400' : 'fa-database text-slate-500'}`}></i>
              <span>{contextInfo.hasDbSchema ? 'DB DDL' : 'No DDL'}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 rounded-lg text-slate-300">
              <i className={`fas ${contextInfo.hasGuardrails ? 'fa-shield-alt text-amber-400' : 'fa-shield-alt text-slate-500'}`}></i>
              <span>{contextInfo.hasGuardrails ? 'Guardrails Active' : 'Default Rules'}</span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between transition ${
            statusMessage.type === 'success'
              ? 'bg-green-950/40 border-green-500/40 text-green-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`fas ${statusMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <i className="fas fa-plus-circle text-amber-400"></i>
                <span>New Feature / Change Request:</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Input Prompt</span>
            </div>

            <textarea
              rows={8}
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Describe the new feature or change request in detail... (e.g. 'Add PDF export functionality for health vitals with custom date range filter and email sharing option')"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none custom-scroll leading-relaxed"
            />

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample Change Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePresetClick("Add PDF & CSV export for biometric vitals trend data with custom date range selection and local file caching.")}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-[10px] text-slate-300 hover:text-amber-300 transition text-left cursor-pointer"
                >
                  <i className="fas fa-file-pdf text-amber-400 mr-1"></i> Add PDF/CSV Vitals Export
                </button>
                <button
                  onClick={() => handlePresetClick("Integrate Google OAuth2 SSO authentication fallback for multi-device profile syncing while preserving local SQLite offline mode.")}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-[10px] text-slate-300 hover:text-indigo-300 transition text-left cursor-pointer"
                >
                  <i className="fab fa-google text-indigo-400 mr-1"></i> Google OAuth2 Sync
                </button>
                <button
                  onClick={() => handlePresetClick("Add audit logging table to record all document AI extractions and PIN unlock attempts with local timestamp and SHA-256 integrity hash.")}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[10px] text-slate-300 hover:text-emerald-300 transition text-left cursor-pointer"
                >
                  <i className="fas fa-user-shield text-emerald-400 mr-1"></i> Audit Log Table
                </button>
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition hover:scale-[1.01] cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Analyzing Impact & Legacy Guardrails...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-microscope"></i>
                  <span>Run Impact & Gap Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl min-h-[520px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-clipboard-check text-emerald-400"></i>
                  <h3 className="text-xs font-bold text-slate-200">System Impact & Gap Specification Report</h3>
                </div>
                {analysisResult && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Analysis Ready
                  </span>
                )}
              </div>

              {!analysisResult ? (
                <div className="bg-slate-950 border border-dashed border-slate-800 rounded-xl p-12 text-center space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
                    <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin text-amber-400' : 'fa-search-plus'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300">No Impact Analysis Generated Yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                      Enter a new requirement or click a preset on the left, then click <strong>Run Impact & Gap Analysis</strong> to evaluate legacy code impact.
                    </p>
                  </div>
                </div>
              ) : (
                <textarea
                  rows={20}
                  value={analysisResult}
                  onChange={(e) => setAnalysisResult(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none custom-scroll leading-relaxed"
                />
              )}
            </div>

            {analysisResult && (
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysisResult);
                    setStatusMessage({ type: 'success', text: 'Impact & Gap Specification copied to clipboard!' });
                  }}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-2"
                >
                  <i className="fas fa-copy"></i>
                  <span>Copy Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
