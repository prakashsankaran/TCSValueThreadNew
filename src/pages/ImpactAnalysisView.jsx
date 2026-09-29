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
              <p className="text-xs text-[#667085] mt-1">
                Evaluate new feature requirements against your Current-State Baseline Spec & vectorized codebase to detect breaking risks and generate Delta Specs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#F8F8F7] p-2 rounded-[10px] border border-[#ECEEF1] text-[11px] shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white rounded-[6px] text-[#344054] border border-[#ECEEF1] shadow-2xs font-medium">
              <i className="fas fa-code text-[#7157F5]"></i>
              <span>{contextInfo.codeSnippetsCount} Files</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white rounded-[6px] text-[#344054] border border-[#ECEEF1] shadow-2xs font-medium">
              <i className={`fas ${contextInfo.hasDbSchema ? 'fa-database text-emerald-600' : 'fa-database text-[#98A2B3]'}`}></i>
              <span>{contextInfo.hasDbSchema ? 'DB DDL' : 'No DDL'}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white rounded-[6px] text-[#344054] border border-[#ECEEF1] shadow-2xs font-medium">
              <i className={`fas ${contextInfo.hasGuardrails ? 'fa-shield-alt text-amber-600' : 'fa-shield-alt text-[#98A2B3]'}`}></i>
              <span>{contextInfo.hasGuardrails ? 'Guardrails Active' : 'Default Rules'}</span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-[10px] border text-xs flex items-center justify-between transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`fas ${statusMessage.type === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-triangle text-rose-600'}`}></i>
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-[#667085] hover:text-[#17181C] cursor-pointer">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#17181C] uppercase tracking-wider flex items-center space-x-2">
                <i className="fas fa-plus-circle text-[#7157F5]"></i>
                <span>New Feature / Change Request:</span>
              </h3>
              <span className="text-[10px] text-[#667085] font-mono">Input Prompt</span>
            </div>

            <textarea
              rows={8}
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Describe the new feature or change request in detail... (e.g. 'Add PDF export functionality for health vitals with custom date range filter and email sharing option')"
              className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[12px] p-3.5 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll leading-relaxed shadow-2xs"
            />

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Sample Change Presets:</span>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handlePresetClick("Add PDF & CSV export for biometric vitals trend data with custom date range selection and local file caching.")}
                  className="px-3 py-2 rounded-[8px] bg-[#FAFAF9] border border-[#ECEEF1] hover:border-[#7157F5] hover:bg-white text-[11px] text-[#344054] hover:text-[#7157F5] transition text-left cursor-pointer shadow-2xs"
                >
                  <i className="fas fa-file-pdf text-[#7157F5] mr-1.5"></i> Add PDF/CSV Vitals Export
                </button>
                <button
                  onClick={() => handlePresetClick("Integrate Google OAuth2 SSO authentication fallback for multi-device profile syncing while preserving local SQLite offline mode.")}
                  className="px-3 py-2 rounded-[8px] bg-[#FAFAF9] border border-[#ECEEF1] hover:border-[#7157F5] hover:bg-white text-[11px] text-[#344054] hover:text-[#7157F5] transition text-left cursor-pointer shadow-2xs"
                >
                  <i className="fab fa-google text-[#7157F5] mr-1.5"></i> Google OAuth2 Sync
                </button>
                <button
                  onClick={() => handlePresetClick("Add audit logging table to record all document AI extractions and PIN unlock attempts with local timestamp and SHA-256 integrity hash.")}
                  className="px-3 py-2 rounded-[8px] bg-[#FAFAF9] border border-[#ECEEF1] hover:border-[#7157F5] hover:bg-white text-[11px] text-[#344054] hover:text-[#7157F5] transition text-left cursor-pointer shadow-2xs"
                >
                  <i className="fas fa-user-shield text-emerald-600 mr-1.5"></i> Audit Log Table
                </button>
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 bg-[#7157F5] hover:bg-[#5E43E2] text-white font-semibold text-xs rounded-[8px] shadow-2xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
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
          <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 space-y-4 shadow-2xs min-h-[520px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#ECEEF1] pb-3">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-clipboard-check text-emerald-600"></i>
                  <h3 className="text-xs font-bold text-[#17181C] uppercase tracking-wider">System Impact & Gap Specification Report</h3>
                </div>
                {analysisResult && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Analysis Ready
                  </span>
                )}
              </div>

              {!analysisResult ? (
                <div className="bg-[#FAFAF9] border-2 border-dashed border-[#D0D5DD] rounded-[14px] p-12 text-center space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 text-[#7157F5] flex items-center justify-center mx-auto text-xl shadow-2xs">
                    <i className={`fas ${isAnalyzing ? 'fa-circle-notch fa-spin' : 'fa-search-plus'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#17181C]">No Impact Analysis Generated Yet</h4>
                    <p className="text-[11px] text-[#667085] max-w-sm mx-auto mt-1">
                      Enter a new requirement or click a preset on the left, then click <strong>Run Impact & Gap Analysis</strong> to evaluate legacy code impact.
                    </p>
                  </div>
                </div>
              ) : (
                <textarea
                  rows={20}
                  value={analysisResult}
                  onChange={(e) => setAnalysisResult(e.target.value)}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[12px] p-4 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll leading-relaxed shadow-2xs"
                />
              )}
            </div>

            {analysisResult && (
              <div className="pt-4 border-t border-[#ECEEF1] flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysisResult);
                    setStatusMessage({ type: 'success', text: 'Impact & Gap Specification copied to clipboard!' });
                  }}
                  className="px-4 py-2 bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#7157F5] text-[#7157F5] font-semibold text-xs rounded-[8px] transition cursor-pointer flex items-center space-x-2 shadow-2xs"
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
