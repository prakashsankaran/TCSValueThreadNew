import React, { useState, useEffect, useRef } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { GeneratedOutput } from '../components/GeneratedOutput';
import { pdfGenerator } from '../utils/pdfGenerator';
import { ConfluencePublishModal } from '../components/ConfluencePublishModal';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function TechArchitecture() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['tech-architecture'];

  const [activeTab, setActiveTab] = useState('blueprint');
  const [zoomScale, setZoomScale] = useState(1);
  const diagramRef = useRef(null);
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
  } = useArtefactVersioning('tech-architecture', 'Technical Architecture Blueprint', updatePageState);

  const handleTriggerGenerate = async () => {
    await backendAdapter.runGeneration('tech-architecture', updatePageState, customPrompt);
  };

  const handleSaveAndSync = async () => {
    if (!pageState.output) return;
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
      artefactId: `ARCH-${reqSuffix}`,
      title: 'Technical Architecture Blueprint',
      content: pageState.output
    });
  };

  const sanitizeMermaid = (text) => {
    if (!text) return '';
    let clean = text.replace(/(?<!https?)::([a-zA-Z0-9_-]+)/gi, ':::$1');
    
    return clean.replace(/subgraph\s+([a-zA-Z0-9_\-&\s]+)(?:\r?\n)/g, (match, name) => {
      const trimmed = name.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return match;
      }
      if (/\s|&/.test(trimmed)) {
        return `subgraph "${trimmed}"\n`;
      }
      return match;
    });
  };

  useEffect(() => {
    if (activeTab === 'blueprint' && pageState.output?.blueprint && window.mermaid) {
      const cleanDiagramCode = sanitizeMermaid(pageState.output.blueprint);
      try {
        if (diagramRef.current) {
          diagramRef.current.removeAttribute('data-processed');
          diagramRef.current.innerHTML = cleanDiagramCode;
          
          if (typeof window.mermaid.render === 'function') {
            window.mermaid.render('mermaid-svg-tech', cleanDiagramCode)
              .then(({ svg }) => {
                if (diagramRef.current) {
                  diagramRef.current.innerHTML = svg;
                }
              })
              .catch((err) => {
                console.error('Mermaid render promise error:', err);
                if (diagramRef.current) {
                  diagramRef.current.innerHTML = `<div className="text-red-400 p-4 border border-red-900 rounded bg-red-950/20">Mermaid Rendering Error: ${err.message}</div>`;
                }
              });
          } else if (typeof window.mermaid.draw === 'function') {
            window.mermaid.draw('mermaid-svg-tech', cleanDiagramCode, (svgCode) => {
              if (diagramRef.current) {
                diagramRef.current.innerHTML = svgCode;
              }
            });
          } else {
            window.mermaid.init(undefined, diagramRef.current);
          }
        }
      } catch (err) {
        console.error('Mermaid render try-catch error:', err);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `<div className="text-red-400 p-4 border border-red-900 rounded bg-red-950/20">Mermaid Rendering Error: ${err.message}</div>`;
        }
      }
    }
  }, [activeTab, pageState.output, pageState.isLoading]);

  const handleExportSVG = () => {
    if (!diagramRef.current) return;
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) {
      alert('Diagram SVG is not loaded yet.');
      return;
    }
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'system_architecture.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertMarkdownToHTML = (markdown) => {
    if (!markdown) return '';
    let html = markdown;
    
    html = html.replace(/^# (.*?)$/gm, '<h1 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 22px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="color: #8b5cf6; font-size: 18px; font-weight: bold; margin-top: 16px; margin-bottom: 8px;">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 style="color: #ec4899; font-size: 15px; font-weight: bold; margin-top: 12px; margin-bottom: 6px;">$1</h3>');
    html = html.replace(/^---$/gm, '<hr style="border-color: #334155; margin: 16px 0;"/>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`(.*?)`/g, '<code style="background-color: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #f43f5e;">$1</code>');
    html = html.replace(/^- (.*?)$/gm, '<li style="margin-left: 16px; list-style-type: disc; color: #cbd5e1; margin-bottom: 4px;">$1</li>');
    html = html.replace(/^\* (.*?)$/gm, '<li style="margin-left: 16px; list-style-type: disc; color: #cbd5e1; margin-bottom: 4px;">$1</li>');
    
    return `<div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #e2e8f0; line-height: 1.6; padding: 10px;">${html}</div>`;
  };

  const handleExportPDF = () => {
    if (!pageState.output) return;
    const documentHtml = pageState.output?.html || convertMarkdownToHTML(pageState.output?.document || '');
    pdfGenerator.download('Technical_Specification.pdf', documentHtml);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left panel */}
      <div className="flex flex-col h-full overflow-hidden">
        <CascadedSpecViewerPanel
          pageState={pageState}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          onAction={handleTriggerGenerate}
          actionLabel="Build Blueprints"
          actionIcon="fa-sitemap"
        />
      </div>

      <div className="h-full flex flex-col overflow-hidden">
        <GeneratedOutput
          title="Technical Architecture Blueprint Board"
          subtitle="System diagram & API document specifications"
          versions={savedVersions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(id) => {
            setSelectedVersionId(id);
            const ver = savedVersions.find(v => v.id === id);
            if (ver && ver.content) {
              updatePageState('tech-architecture', { output: ver.content });
            }
          }}
          actions={
            pageState.output && (
              <div className="flex items-center gap-1.5">
                {showSyncSuccess && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-[6px] animate-fade-in whitespace-nowrap">
                    {syncMessage || 'Saved & Synchronized!'}
                  </span>
                )}
                <button 
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-[8px] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition"
                >
                  {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                  <span>Save & Sync</span>
                </button>
                <button 
                  onClick={() => setIsConfluenceOpen(true)}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#7157F5] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="fab fa-confluence"></i>
                  <span>Confluence</span>
                </button>
                <button 
                  onClick={handleExportSVG}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#7157F5] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="far fa-file-image"></i>
                  <span>SVG</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] hover:border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="far fa-file-pdf"></i>
                  <span>PDF</span>
                </button>
              </div>
            )
          }
        >
          {!pageState.output ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7157F5] flex items-center justify-center text-xl border border-purple-100 shadow-2xs">
                <i className="fas fa-sitemap"></i>
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-bold text-[#17181C]">Architecture Board Offline</p>
                <p className="text-xs text-[#667085]">Provide specs on the left and compile to explore the system design graphs & database layouts.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              
              <div className="flex bg-[#F8F8F7] p-1 border border-[#ECEEF1] rounded-[10px] self-start shadow-2xs">
                <button 
                  onClick={() => setActiveTab('blueprint')}
                  className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'blueprint' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                  }`}
                >
                  System Blueprint Diagram
                </button>
                <button 
                  onClick={() => setActiveTab('document')}
                  className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'document' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                  }`}
                >
                  Full Specification Document
                </button>
              </div>

              <div className="flex-1 bg-white rounded-[14px] border border-[#ECEEF1] p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-2xs">
                
                {activeTab === 'blueprint' ? (
                  <div className="flex-1 relative flex flex-col overflow-hidden">
                    <div className="absolute top-2 right-2 bg-white border border-[#ECEEF1] p-1.5 rounded-[8px] flex items-center gap-1 z-10 shadow-2xs">
                      <button 
                        onClick={() => setZoomScale(prev => Math.min(prev + 0.1, 2))}
                        className="w-7 h-7 bg-[#F8F8F7] hover:bg-white text-[#344054] rounded-[6px] border border-[#ECEEF1] flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => setZoomScale(prev => Math.max(prev - 0.1, 0.5))}
                        className="w-7 h-7 bg-[#F8F8F7] hover:bg-white text-[#344054] rounded-[6px] border border-[#ECEEF1] flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => setZoomScale(1)}
                        className="px-2 h-7 bg-[#F8F8F7] hover:bg-white text-[#344054] rounded-[6px] border border-[#ECEEF1] flex items-center justify-center text-[10px] font-semibold cursor-pointer shadow-2xs"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center custom-scroll bg-[#FAFAF9] rounded-[10px] border border-[#ECEEF1] p-4">
                      <div 
                        ref={diagramRef} 
                        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
                        className="mermaid text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <iframe
                      srcDoc={pageState.output?.html || pageState.output?.document || ''}
                      title="Technical Architecture Document"
                      className="w-full flex-1 border-0 rounded-[10px] bg-white"
                      style={{ minHeight: '500px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </GeneratedOutput>
      </div>

      <ConfluencePublishModal 
        isOpen={isConfluenceOpen}
        onClose={() => setIsConfluenceOpen(false)}
        stageType="tech-architecture"
      />

    </div>
  );
}
