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
        <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden shadow-xl border border-slate-800">
          
          <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-3 bg-orange-500 rounded-full shrink-0"></span>
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
                  className="bg-slate-950 border border-orange-500/50 rounded-xl px-3 py-1 text-xs text-orange-300 font-bold focus:outline-none focus:border-orange-400 cursor-pointer shadow-inner"
                >
                  {savedVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      📄 {v.artefactId} ({v.version}{v.status === 'LATEST' ? ' - LATEST' : ''}) — {v.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <h2 className="text-sm font-bold text-slate-200 uppercase flex items-center">
                    Tailwind UX Prototype Viewport
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">Click around the generated app panels to simulate user interactions</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1.5">
              {showSyncSuccess && (
                <span className="px-2.5 py-1 bg-green-900/30 text-green-400 border border-green-800 text-[10px] font-bold rounded-lg animate-fade-in">
                  {syncMessage || 'Saved & Synchronized!'}
                </span>
              )}
              {pageState.output && (
                <>
                  <button 
                    onClick={handleSaveAndSync}
                    disabled={isSyncing}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg border border-green-500/30 shadow-lg flex items-center space-x-1 cursor-pointer"
                  >
                    {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                    <span>Save & Sync</span>
                  </button>
                  <button 
                    onClick={handleReload}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                    title="Reload sandbox environment"
                  >
                    <i className="fas fa-redo-alt"></i>
                    <span>Reload</span>
                  </button>
                  <button 
                    onClick={handleDownloadHTML}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <i className="fab fa-html5"></i>
                    <span>Download HTML</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 bg-slate-950/60">
            {!pageState.output ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-full">
                  <i className="fas fa-desktop text-3xl"></i>
                </div>
                <div className="max-w-xs space-y-1.5">
                  <p className="text-xs font-bold text-slate-300">UX Sandbox Offline</p>
                  <p className="text-[11px] text-slate-500">Select specifications and trigger prototype creation to view a live interactive mockup of the application UI.</p>
                </div>
              </div>
            ) : (
              <iframe
                key={iframeKey}
                srcDoc={pageState.output}
                title="UX Wireframe sandbox frame"
                className="w-full h-full border border-slate-800 rounded-xl bg-[#0b0f19]"
                sandbox="allow-scripts allow-popups allow-modals allow-downloads"
              />
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
