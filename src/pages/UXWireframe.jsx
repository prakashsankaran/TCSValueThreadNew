import React, { useState, useEffect } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { markdownGenerator } from '../utils/markdownGenerator';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function UXWireframe() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['ux-wireframe'];

  const [feedback, setFeedback] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact
  } = useArtefactVersioning('ux-wireframe', 'Tailwind UX Wireframe Prototype', updatePageState);

  const handleTriggerGenerate = async () => {
    await backendAdapter.runGeneration('ux-wireframe', updatePageState, feedback);
  };

  const handleSaveAndSync = async (contentToSave = null) => {
    const payloadContent = contentToSave || pageState.output;
    if (!payloadContent) return;

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
      artefactId: `UX-${reqSuffix}`,
      title: 'Tailwind UX Wireframe Prototype',
      content: payloadContent,
      metadata: { type: 'HTML_PROTOTYPE' }
    });
  };

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleDownloadHTML = () => {
    if (!pageState.output) return;
    markdownGenerator.download('wireframe_prototype.html', pageState.output);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left panel */}
      <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
        <CascadedSpecViewerPanel
          pageState={pageState}
          customPrompt={feedback}
          setCustomPrompt={setFeedback}
          onAction={handleTriggerGenerate}
          actionLabel="Generate Wireframes"
          actionIcon="fa-magic"
        />
      </div>

      {/* Right panel */}
      <div className="lg:col-span-7 h-full flex flex-col overflow-hidden">
        <div className="bg-white rounded-[18px] flex flex-col h-full overflow-hidden shadow-2xs border border-[#ECEEF1]">
          
          <div className="px-5 py-3.5 border-b border-[#ECEEF1] flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-full shrink-0"></span>
              {savedVersions && savedVersions.length > 0 ? (
                <select
                  value={selectedVersionId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedVersionId(id);
                    const ver = savedVersions.find(v => v.id === id);
                    if (ver && ver.content) {
                      updatePageState('ux-wireframe', { output: ver.content });
                    }
                  }}
                  className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[8px] px-3 py-1 text-xs text-[#17181C] font-semibold focus:outline-none focus:border-[#7157F5] cursor-pointer"
                >
                  {savedVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      📄 {v.artefactId} ({v.version}{v.status === 'LATEST' ? ' - LATEST' : ''}) — {v.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <h2 className="text-xs font-bold text-[#17181C] uppercase flex items-center tracking-wider">
                    Tailwind UX Prototype Viewport
                  </h2>
                  <p className="text-[11px] text-[#667085]">Click around the generated app panels to simulate user interactions</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {showSyncSuccess && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-[6px] animate-fade-in whitespace-nowrap">
                  {syncMessage || 'Saved & Synchronized!'}
                </span>
              )}
              {pageState.output && (
                <>
                  <button 
                    onClick={handleSaveAndSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-[8px] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition"
                  >
                    {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                    <span>Save & Sync</span>
                  </button>
                  <button 
                    onClick={handleReload}
                    className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#344054] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                    title="Reload sandbox environment"
                  >
                    <i className="fas fa-redo-alt text-xs text-[#667085]"></i>
                    <span>Reload</span>
                  </button>
                  <button 
                    onClick={handleDownloadHTML}
                    className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-amber-50 text-amber-700 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] hover:border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                  >
                    <i className="fab fa-html5 text-xs text-amber-600"></i>
                    <span>Download HTML</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 bg-[#FAFAF9] overflow-hidden flex flex-col">
            {!pageState.output ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7157F5] flex items-center justify-center text-xl border border-purple-100 shadow-2xs">
                  <i className="fas fa-desktop"></i>
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="text-sm font-bold text-[#17181C]">UX Sandbox Offline</p>
                  <p className="text-xs text-[#667085]">Select specifications and trigger prototype creation to view a live interactive mockup of the application UI.</p>
                </div>
              </div>
            ) : (
              <iframe
                key={iframeKey}
                srcDoc={pageState.output}
                title="UX Wireframe sandbox frame"
                className="w-full h-full border border-[#ECEEF1] rounded-[14px] bg-white shadow-2xs"
                sandbox="allow-scripts allow-popups allow-modals allow-downloads"
              />
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
