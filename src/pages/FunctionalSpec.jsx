import React, { useEffect, useState } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { GeneratedOutput } from '../components/GeneratedOutput';
import { pdfGenerator } from '../utils/pdfGenerator';
import { ConfluencePublishModal } from '../components/ConfluencePublishModal';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';
import { formatFSDDocument } from '../utils/fsdFormatter';

export default function FunctionalSpec() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['functional-spec'];
  const [isConfluenceOpen, setIsConfluenceOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact
  } = useArtefactVersioning('functional-spec', 'Functional Specification Document (FSD)', updatePageState);

  const handleTriggerGenerate = async () => {
    updatePageState('functional-spec', { isLoading: true });
    try {
      const generated = await backendAdapter.runGeneration('functional-spec', updatePageState, customPrompt);
      if (generated) {
        await handleSaveAndSync(generated);
      }
    } catch (e) {
      console.error('Generation error:', e);
      updatePageState('functional-spec', { isLoading: false });
    }
  };

  const handleSaveAndSync = async (contentToSave = null) => {
    const rawContent = (contentToSave && typeof contentToSave === 'object' && !contentToSave.nativeEvent)
      ? contentToSave
      : pageState.output;

    if (!rawContent) return;

    const formattedContent = formatFSDDocument(rawContent);

    const activeProject = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
    let reqSuffix = '9961';
    try {
      const res = await fetch(`http://localhost:7001/api/requirements?project=${encodeURIComponent(activeProject)}`);
      const data = await res.json();
      if (data.success && data.requirements.length > 0) {
        reqSuffix = (data.requirements[0].requirement_id || '').replace(/^(REQ|IDEA)-/, '') || '9961';
      }
    } catch (e) {}

    await saveAndSyncArtefact({
      artefactId: `FSD-${reqSuffix}`,
      title: 'Functional Specification Document (FSD)',
      content: formattedContent
    });
  };

  const handleDownloadPDF = () => {
    if (!pageState.output) return;
    const formattedHtml = formatFSDDocument(pageState.output);
    pdfGenerator.download('Functional_Specification_Document.pdf', formattedHtml);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT PANEL */}
      <CascadedSpecViewerPanel
        pageState={pageState}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        onAction={handleTriggerGenerate}
        actionLabel="Compile FSD"
        actionIcon="fa-file-code"
      />

      {/* RIGHT PANEL */}
      <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800 shadow-xl">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 shrink-0">
          <div className="flex items-center space-x-2 min-w-0 shrink">
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full shrink-0"></span>
            <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase whitespace-nowrap shrink-0">
              Functional Spec
            </h2>
            <select
              value={selectedVersionId}
              onChange={(e) => {
                setSelectedVersionId(e.target.value);
                const ver = savedVersions.find(v => v.id === e.target.value);
                if (ver && ver.content) {
                  updatePageState('functional-spec', { output: ver.content });
                }
              }}
              className="bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-500/40 rounded-lg px-2 py-1 text-[11px] text-indigo-300 font-mono font-bold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[170px] truncate shrink min-w-[90px]"
            >
              {savedVersions && savedVersions.length > 0 ? (
                savedVersions.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-950 text-slate-200">
                    {v.version}{v.status === 'LATEST' ? ' (LATEST)' : ''} - {v.artefactId || v.id}
                  </option>
                ))
              ) : (
                <option value="" className="bg-slate-950 text-slate-200">v1.0.0 (LATEST)</option>
              )}
            </select>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {showSyncSuccess && (
              <span className="px-2 py-0.5 bg-green-900/40 text-green-400 border border-green-800 text-[10px] font-bold rounded-md animate-fade-in whitespace-nowrap">
                {syncMessage || 'Saved & Synchronized!'}
              </span>
            )}
            <button 
              type="button"
              onClick={() => handleSaveAndSync()}
              disabled={isSyncing || !pageState.output}
              className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg border border-green-500/30 shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              <span>Save Changes & Sync</span>
            </button>

            <button 
              type="button"
              onClick={() => setIsConfluenceOpen(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 cursor-pointer shrink-0"
              title="Publish to Confluence"
            >
              <i className="fab fa-confluence"></i>
              <span>Confluence</span>
            </button>

            <button 
              type="button"
              onClick={handleDownloadPDF}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 cursor-pointer shrink-0"
              title="Download PDF"
            >
              <i className="far fa-file-pdf"></i>
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden flex flex-col bg-[#070a13]">
          {!pageState.output ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-full">
                <i className="fas fa-file-invoice text-3xl"></i>
              </div>
              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-bold text-slate-300">No FSD Compiled Yet</p>
                <p className="text-[11px] text-slate-500">Click "Compile FSD" on the left to compile the functional specification document.</p>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={formatFSDDocument(pageState.output)}
              title="FSD Document Preview"
              className="w-full h-full border border-slate-800 rounded-xl bg-[#070a13]"
            />
          )}
        </div>
      </div>

      <ConfluencePublishModal 
        isOpen={isConfluenceOpen}
        onClose={() => setIsConfluenceOpen(false)}
        stageType="functional-spec"
      />

    </div>
  );
}
