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
      <div className="bg-white rounded-[18px] flex flex-col overflow-hidden border border-[#ECEEF1] shadow-2xs">
        <div className="px-4 py-3 border-b border-[#ECEEF1] flex flex-wrap items-center justify-between gap-2 bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0 shrink">
            <span className="w-1.5 h-3.5 bg-[#7157F5] rounded-full shrink-0"></span>
            <h2 className="text-xs font-bold tracking-wider text-[#17181C] uppercase whitespace-nowrap shrink-0">
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
              className="bg-[#F8F8F7] hover:bg-white border border-[#ECEEF1] rounded-[8px] px-2 py-1 text-xs text-[#17181C] font-mono font-semibold focus:outline-none focus:border-[#7157F5] cursor-pointer max-w-[130px] sm:max-w-[170px] truncate shrink min-w-[90px]"
            >
              {savedVersions && savedVersions.length > 0 ? (
                savedVersions.map((v) => (
                  <option key={v.id} value={v.id} className="text-[#17181C]">
                    {v.version}{v.status === 'LATEST' ? ' (LATEST)' : ''} - {v.artefactId || v.id}
                  </option>
                ))
              ) : (
                <option value="" className="text-[#17181C]">v1.0.0 (LATEST)</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showSyncSuccess && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-[6px] animate-fade-in whitespace-nowrap">
                {syncMessage || 'Saved & Synchronized!'}
              </span>
            )}
            <button 
              type="button"
              onClick={() => handleSaveAndSync()}
              disabled={isSyncing || !pageState.output}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-[8px] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition"
            >
              {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              <span>Save Changes & Sync</span>
            </button>

            <button 
              type="button"
              onClick={() => setIsConfluenceOpen(true)}
              className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#7157F5] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs transition"
              title="Publish to Confluence"
            >
              <i className="fab fa-confluence"></i>
              <span>Confluence</span>
            </button>

            <button 
              type="button"
              onClick={handleDownloadPDF}
              className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-rose-600 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs transition"
              title="Download PDF"
            >
              <i className="far fa-file-pdf"></i>
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 overflow-hidden flex flex-col bg-[#FAFAF9]">
          {!pageState.output ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7157F5] flex items-center justify-center text-xl border border-purple-100 shadow-2xs">
                <i className="fas fa-file-invoice"></i>
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-bold text-[#17181C]">No FSD Compiled Yet</p>
                <p className="text-xs text-[#667085]">Click "Compile FSD" on the left to compile the functional specification document.</p>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={formatFSDDocument(pageState.output)}
              title="FSD Document Preview"
              className="w-full h-full border border-[#ECEEF1] rounded-[10px] bg-white shadow-2xs"
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
