import React, { useState, useEffect } from 'react';
import { usePageContext } from '../context/PageContext';

export default function CodeToSpecView() {
  const { brownfieldContext } = usePageContext();

  const [baselineSpec, setBaselineSpec] = useState('');
  const [manualSpec, setManualSpec] = useState('');
  const [unifiedSpec, setUnifiedSpec] = useState('');

  const [activeTab, setActiveTab] = useState('baseline');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetch('http://localhost:7001/api/workspace/spec')
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setManualSpec(data.content);
        }
      })
      .catch(err => console.error('Failed loading manual spec:', err));
  }, []);

  const handleGenerateBaseline = async () => {
    setIsGenerating(true);
    setStatusMessage({ type: 'info', text: 'Introspecting legacy code annotations, DDLs, and docs...' });

    try {
      const res = await fetch('http://localhost:7001/api/code-to-spec/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: brownfieldContext })
      });

      const data = await res.json();
      if (data.success && data.baselineSpec) {
        setBaselineSpec(data.baselineSpec);
        setActiveTab('baseline');
        setStatusMessage({ type: 'success', text: 'Baseline v1 Specification successfully generated via reverse engineering!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed generating baseline spec.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed connecting to server backend at http://localhost:7001' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMergeSpecs = async () => {
    if (!baselineSpec) {
      setStatusMessage({ type: 'error', text: 'Please generate a Baseline Spec first before merging.' });
      return;
    }

    setIsMerging(true);
    setStatusMessage({ type: 'info', text: 'Merging auto-discovered technical baseline with manual specifications...' });

    try {
      const res = await fetch('http://localhost:7001/api/code-to-spec/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baselineSpec, manualSpec })
      });

      const data = await res.json();
      if (data.success && data.mergedSpec) {
        setUnifiedSpec(data.mergedSpec);
        setActiveTab('unified');
        setStatusMessage({ type: 'success', text: 'Specs unified! Manual intent and reverse-engineered technical baseline merged cleanly.' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed merging specs.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed connecting to server backend at http://localhost:7001' });
    } finally {
      setIsMerging(false);
    }
  };

  const handleExportSourceOfTruth = async () => {
    const specToSave = unifiedSpec || baselineSpec;
    if (!specToSave) {
      setStatusMessage({ type: 'error', text: 'No specification available to export.' });
      return;
    }

    setIsExporting(true);
    setStatusMessage({ type: 'info', text: 'Promoting baseline specification to Project Source of Truth...' });

    try {
      const res = await fetch('http://localhost:7001/api/code-to-spec/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalSpec: specToSave })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed exporting source of truth.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed connecting to server backend at http://localhost:7001' });
    } finally {
      setIsExporting(false);
    }
  };

  const snippetCount = (brownfieldContext.codeSnippets || []).length;
  const hasSchema = !!(brownfieldContext.dbSchema && brownfieldContext.dbSchema.trim());
  const docCount = (brownfieldContext.documents || []).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shadow-lg">
                <i className="fas fa-microchip text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-wide">Code-to-Spec Baseline Generator</h1>
                <p className="text-xs text-amber-400/90 font-medium">Reverse-engineer legacy codebase into an official v1 Current State Source of Truth</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerateBaseline}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 transition flex items-center space-x-2 cursor-pointer disabled:opacity-40"
            >
              {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              <span>1. Generate Baseline Spec</span>
            </button>

            <button
              onClick={handleMergeSpecs}
              disabled={isMerging || !baselineSpec}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-300 transition flex items-center space-x-2 cursor-pointer disabled:opacity-40"
            >
              {isMerging ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-code-branch"></i>}
              <span>2. Merge Specs</span>
            </button>

            <button
              onClick={handleExportSourceOfTruth}
              disabled={isExporting || (!baselineSpec && !unifiedSpec)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-40"
            >
              {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-export"></i>}
              <span>3. Export Spec</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between transition ${
            statusMessage.type === 'success'
              ? 'bg-green-950/40 border-green-500/40 text-green-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`fas ${statusMessage.type === 'success' ? 'fa-check-circle' : statusMessage.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <i className="fas fa-code text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Source Code Snippets</p>
            <p className="text-[11px] text-slate-400">{snippetCount} file(s) attached for parsing</p>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <i className="fas fa-database text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Database DDL Schema</p>
            <p className="text-[11px] text-slate-400">{hasSchema ? 'SQL Schema attached' : 'No schema attached'}</p>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <i className="fas fa-file-alt text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Legacy Documents</p>
            <p className="text-[11px] text-slate-400">{docCount} document(s) attached</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex border-b border-slate-800 bg-slate-950/40 overflow-x-auto custom-scroll">
          <button
            onClick={() => setActiveTab('baseline')}
            className={`px-6 py-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'baseline'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-magic text-sm"></i>
            <span>Baseline Spec v1.0 {baselineSpec && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1"></span>}</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-edit text-sm"></i>
            <span>Existing Manual Spec</span>
          </button>

          <button
            onClick={() => setActiveTab('unified')}
            className={`px-6 py-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'unified'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-check-double text-sm"></i>
            <span>Unified Current State Spec {unifiedSpec && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1"></span>}</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'baseline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Baseline Spec (Auto-Generated):</span>
                <span className="text-[10px] text-slate-500 font-mono">AST & Schema Introspection</span>
              </div>

              {!baselineSpec ? (
                <div className="bg-slate-950 border border-dashed border-amber-500/30 rounded-xl p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg">
                    <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">No Baseline Spec Generated Yet</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Ready to parse your <strong>{snippetCount} attached code file(s)</strong> and database schema into an official v1 Current-State Specification.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateBaseline}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition hover:scale-105 cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Generating Baseline Spec...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i>
                        <span>Generate Baseline Spec</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <textarea
                  rows={18}
                  value={baselineSpec}
                  onChange={(e) => setBaselineSpec(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none custom-scroll leading-relaxed"
                />
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Existing Manual Specification (`spec.md`):</span>
                <span className="text-[10px] text-indigo-400 font-mono font-bold">Human Defined Requirements</span>
              </div>
              <textarea
                rows={18}
                value={manualSpec}
                onChange={(e) => setManualSpec(e.target.value)}
                placeholder="Paste or edit existing manual specifications here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none custom-scroll leading-relaxed"
              />
            </div>
          )}

          {activeTab === 'unified' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Unified Current State Specification (Phase 1 Source of Truth):</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Ready to Export</span>
              </div>

              {!unifiedSpec ? (
                <div className="bg-slate-950 border border-dashed border-emerald-500/30 rounded-xl p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-lg">
                    <i className={`fas ${isMerging ? 'fa-spinner fa-spin' : 'fa-code-branch'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">No Unified Spec Created Yet</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      {baselineSpec 
                        ? 'Merge your auto-generated Baseline Spec with your existing Manual Spec to form a single Unified Source of Truth.' 
                        : 'First click "Generate Baseline Spec" under Tab 1 before merging with manual specifications.'}
                    </p>
                  </div>

                  {baselineSpec ? (
                    <button
                      onClick={handleMergeSpecs}
                      disabled={isMerging}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition hover:scale-105 cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                    >
                      {isMerging ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Merging Baseline & Manual Specs...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-code-branch"></i>
                          <span>🔀 Merge Baseline Spec with Manual Spec</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('baseline')}
                      className="px-5 py-2.5 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl transition cursor-pointer inline-flex items-center space-x-2"
                    >
                      <i className="fas fa-arrow-left"></i>
                      <span>Go to Tab 1: Generate Baseline Spec</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    rows={18}
                    value={unifiedSpec}
                    onChange={(e) => setUnifiedSpec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-4 text-xs font-mono text-emerald-300/90 focus:outline-none custom-scroll leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleExportSourceOfTruth}
                      disabled={isExporting}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition hover:scale-105 cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                    >
                      {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-export"></i>}
                      <span>🚀 Export as Project Source of Truth (`spec.md`)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
