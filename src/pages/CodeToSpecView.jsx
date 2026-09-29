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
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      {/* Top Banner Card */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[12px] bg-purple-50 border border-purple-200 text-[#7157F5] flex items-center justify-center font-bold shadow-2xs shrink-0">
                <i className="fas fa-microchip text-lg"></i>
              </div>
              <div>
                <h1 className="text-base font-bold text-[#17181C] tracking-tight">Code-to-Spec Baseline Generator</h1>
                <p className="text-xs text-[#667085] font-medium">Reverse-engineer legacy codebase into an official v1 Current State Source of Truth</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleGenerateBaseline}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-[8px] font-semibold text-xs bg-[#7157F5] hover:bg-[#5E43E2] text-white transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 shadow-2xs"
            >
              {isGenerating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-magic"></i>}
              <span>1. Generate Baseline</span>
            </button>

            <button
              onClick={handleMergeSpecs}
              disabled={isMerging || !baselineSpec}
              className="px-3.5 py-2 rounded-[8px] font-semibold text-xs bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#7157F5] text-[#7157F5] transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 shadow-2xs"
            >
              {isMerging ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-code-branch"></i>}
              <span>2. Merge Specs</span>
            </button>

            <button
              onClick={handleExportSourceOfTruth}
              disabled={isExporting || (!baselineSpec && !unifiedSpec)}
              className="px-3.5 py-2 rounded-[8px] font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
            >
              {isExporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-export"></i>}
              <span>3. Export Spec</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-[10px] border text-xs flex items-center justify-between transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`fas ${statusMessage.type === 'success' ? 'fa-check-circle text-emerald-600' : statusMessage.type === 'error' ? 'fa-exclamation-triangle text-rose-600' : 'fa-info-circle text-amber-600'}`}></i>
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-[#667085] hover:text-[#17181C] cursor-pointer">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#ECEEF1] rounded-[14px] p-4 flex items-center space-x-3 shadow-2xs">
          <div className="w-10 h-10 rounded-[10px] bg-purple-50 text-[#7157F5] border border-purple-100 flex items-center justify-center font-bold">
            <i className="fas fa-code text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-[#17181C]">Source Code Snippets</p>
            <p className="text-[11px] text-[#667085]">{snippetCount} file(s) attached for parsing</p>
          </div>
        </div>

        <div className="bg-white border border-[#ECEEF1] rounded-[14px] p-4 flex items-center space-x-3 shadow-2xs">
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <i className="fas fa-database text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-[#17181C]">Database DDL Schema</p>
            <p className="text-[11px] text-[#667085]">{hasSchema ? 'SQL Schema attached' : 'No schema attached'}</p>
          </div>
        </div>

        <div className="bg-white border border-[#ECEEF1] rounded-[14px] p-4 flex items-center space-x-3 shadow-2xs">
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <i className="fas fa-file-alt text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-[#17181C]">Legacy Documents</p>
            <p className="text-[11px] text-[#667085]">{docCount} document(s) attached</p>
          </div>
        </div>
      </div>

      {/* Main Spec Workspace */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
        <div className="flex border-b border-[#ECEEF1] bg-[#FAFAF9] px-3 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('baseline')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'baseline'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-magic text-xs"></i>
            <span>Baseline Spec v1.0</span>
            {baselineSpec && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5"></span>}
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'manual'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-edit text-xs"></i>
            <span>Existing Manual Spec (`spec.md`)</span>
          </button>

          <button
            onClick={() => setActiveTab('unified')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'unified'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-check-double text-xs"></i>
            <span>Unified Current State Spec</span>
            {unifiedSpec && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5"></span>}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'baseline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Baseline Spec (Auto-Generated):</span>
                <span className="text-[10px] text-[#667085] font-mono">AST & Schema Introspection</span>
              </div>

              {!baselineSpec ? (
                <div className="bg-[#FAFAF9] border-2 border-dashed border-[#D0D5DD] hover:border-[#7157F5] rounded-[14px] p-10 text-center space-y-3 transition">
                  <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 text-[#7157F5] flex items-center justify-center mx-auto text-xl shadow-2xs">
                    <i className={`fas ${isGenerating ? 'fa-circle-notch fa-spin' : 'fa-magic'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#17181C]">No Baseline Spec Generated Yet</h4>
                    <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
                      Ready to parse your <strong>{snippetCount} attached code file(s)</strong> and database schema into an official v1 Current-State Specification.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateBaseline}
                    disabled={isGenerating}
                    className="px-5 py-2.5 bg-[#7157F5] hover:bg-[#5E43E2] text-white font-semibold text-xs rounded-[8px] shadow-2xs transition cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i>
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
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[12px] p-4 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll leading-relaxed shadow-2xs"
                />
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Existing Manual Specification (`spec.md`):</span>
                <span className="text-[10px] text-[#7157F5] font-mono font-semibold">Human Defined Requirements</span>
              </div>
              <textarea
                rows={18}
                value={manualSpec}
                onChange={(e) => setManualSpec(e.target.value)}
                placeholder="Paste or edit existing manual specifications here..."
                className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[12px] p-4 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll leading-relaxed shadow-2xs"
              />
            </div>
          )}

          {activeTab === 'unified' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Unified Current State Specification (Phase 1 Source of Truth):</span>
                <span className="text-[10px] text-emerald-600 font-mono font-semibold">Ready to Export</span>
              </div>

              {!unifiedSpec ? (
                <div className="bg-[#FAFAF9] border-2 border-dashed border-[#D0D5DD] hover:border-[#7157F5] rounded-[14px] p-10 text-center space-y-3 transition">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl shadow-2xs">
                    <i className={`fas ${isMerging ? 'fa-circle-notch fa-spin' : 'fa-code-branch'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#17181C]">No Unified Spec Created Yet</h4>
                    <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
                      {baselineSpec 
                        ? 'Merge your auto-generated Baseline Spec with your existing Manual Spec to form a single Unified Source of Truth.' 
                        : 'First click "Generate Baseline Spec" under Tab 1 before merging with manual specifications.'}
                    </p>
                  </div>

                  {baselineSpec ? (
                    <button
                      onClick={handleMergeSpecs}
                      disabled={isMerging}
                      className="px-5 py-2.5 bg-[#7157F5] hover:bg-[#5E43E2] text-white font-semibold text-xs rounded-[8px] shadow-2xs transition cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                    >
                      {isMerging ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin"></i>
                          <span>Merging Baseline & Manual Specs...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-code-branch"></i>
                          <span>Merge Baseline Spec with Manual Spec</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('baseline')}
                      className="px-4 py-2 bg-white border border-[#ECEEF1] hover:border-[#7157F5] text-[#7157F5] font-semibold text-xs rounded-[8px] transition cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs"
                    >
                      <i className="fas fa-arrow-left text-xs"></i>
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
                    className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-emerald-500 focus:bg-white rounded-[12px] p-4 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll leading-relaxed shadow-2xs"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleExportSourceOfTruth}
                      disabled={isExporting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-[8px] shadow-2xs transition cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                    >
                      {isExporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-export"></i>}
                      <span>Export as Project Source of Truth (`spec.md`)</span>
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
