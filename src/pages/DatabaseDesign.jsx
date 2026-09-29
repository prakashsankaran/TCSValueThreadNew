import React, { useState, useEffect, useRef } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { GeneratedOutput } from '../components/GeneratedOutput';
import { pdfGenerator } from '../utils/pdfGenerator';
import { markdownGenerator } from '../utils/markdownGenerator';
import { ConfluencePublishModal } from '../components/ConfluencePublishModal';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function DatabaseDesign() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['database-design'];

  const [activeTab, setActiveTab] = useState('erd');
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
  } = useArtefactVersioning('database-design', 'Database Schema & ERD DDL', updatePageState);

  const handleTriggerGenerate = async () => {
    await backendAdapter.runGeneration('database-design', updatePageState, customPrompt);
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
      artefactId: `DB-${reqSuffix}`,
      title: 'Database Schema & ERD DDL',
      content: pageState.output
    });
  };

  const sanitizeErd = (text) => {
    if (!text) return '';
    let clean = text.replace(/(?<!https?)::([a-zA-Z0-9_-]+)/gi, ':::$1');
    clean = clean.replace(/\b(UQ|UNIQUE)\b/gi, 'UK');
    clean = clean.replace(/(\w+)\s*\{\s*([\r\n\s]*)\}/g, '$1 {\n    uuid id\n  }');
    
    return clean.replace(/subgraph\s+([a-zA-Z0-9_\-&\s]+)(?:\r?\n)/g, (match, name) => {
      const trimmed = name.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) return match;
      if (/\s|&/.test(trimmed)) {
        return `subgraph "${trimmed}"\n`;
      }
      return match;
    });
  };

  useEffect(() => {
    if (activeTab === 'erd' && pageState.output?.erd && window.mermaid) {
      const cleanDiagramCode = sanitizeErd(pageState.output.erd);
      try {
        if (diagramRef.current) {
          diagramRef.current.removeAttribute('data-processed');
          
          if (typeof window.mermaid.render === 'function') {
            window.mermaid.render('mermaid-svg-db', cleanDiagramCode)
              .then(({ svg }) => {
                if (diagramRef.current) {
                  diagramRef.current.innerHTML = svg;
                }
              })
              .catch((err) => {
                console.error('Mermaid render promise error (DB):', err);
                if (diagramRef.current) {
                  diagramRef.current.innerHTML = `<div className="text-red-400 p-4 border border-red-900 rounded bg-red-950/20">Mermaid Rendering Error: ${err.message}</div>`;
                }
              });
          } else if (typeof window.mermaid.draw === 'function') {
            window.mermaid.draw('mermaid-svg-db', cleanDiagramCode, (svgCode) => {
              if (diagramRef.current) {
                diagramRef.current.innerHTML = svgCode;
              }
            });
          } else {
            window.mermaid.init(undefined, diagramRef.current);
          }
        }
      } catch (err) {
        console.error('Mermaid render try-catch error (DB):', err);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `<div className="text-red-400 p-4 border border-red-900 rounded bg-red-950/20">Mermaid Rendering Error: ${err.message}</div>`;
        }
      }
    }
  }, [activeTab, pageState.output, pageState.isLoading]);

  const handleExportSQL = () => {
    if (!pageState.output?.sql) return;
    markdownGenerator.download('schema_ddl.sql', pageState.output.sql);
  };

  const handleExportPDF = () => {
    if (!pageState.output) return;
    const docHtml = pageState.output.fsd || `
      <h1>Database Architecture &amp; Schema Documentation</h1>
      <h2>Entity-Relationship Layout</h2>
      <p>(See generated design vector models)</p>
      <h2>SQL DDL Scripts</h2>
      <pre>${pageState.output.sql}</pre>
    `;
    pdfGenerator.download('Database_Design_Document.pdf', docHtml);
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
          actionLabel="Generate DDL"
          actionIcon="fa-database"
        />
      </div>

      <div className="h-full flex flex-col overflow-hidden">
        <GeneratedOutput
          title="Database Schema Design Reviewboard"
          subtitle="ERD layout maps, SQL schemas, and tables validations"
          versions={savedVersions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(id) => {
            setSelectedVersionId(id);
            const ver = savedVersions.find(v => v.id === id);
            if (ver && ver.content) {
              updatePageState('database-design', { output: ver.content });
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
                  onClick={handleExportSQL}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-purple-50 text-purple-700 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] hover:border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="fas fa-file-code"></i>
                  <span>SQL</span>
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
                <i className="fas fa-database"></i>
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-bold text-[#17181C]">Schema Reviewboard Offline</p>
                <p className="text-xs text-[#667085]">Provide specs on the left and compile to explore SQL DDL codes and table layouts.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              
              <div className="flex bg-[#F8F8F7] p-1 border border-[#ECEEF1] rounded-[10px] self-start shadow-2xs">
                <button 
                  onClick={() => setActiveTab('erd')}
                  className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'erd' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                  }`}
                >
                  ERD Diagram
                </button>
                <button 
                  onClick={() => setActiveTab('sql')}
                  className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'sql' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                  }`}
                >
                  SQL DDL Script
                </button>
                <button 
                  onClick={() => setActiveTab('fsd')}
                  className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'fsd' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                  }`}
                >
                  Database Design Document
                </button>
              </div>

              <div className="flex-1 bg-white rounded-[14px] border border-[#ECEEF1] p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-2xs">
                
                {activeTab === 'erd' ? (
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
                        className="text-center"
                      />
                    </div>
                  </div>
                ) : activeTab === 'sql' ? (
                  <div className="flex-1 overflow-auto custom-scroll fsd-document p-2">
                    <pre className="bg-[#17181C] p-4 rounded-[12px] border border-slate-800 font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                      {pageState.output.sql}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <iframe
                      srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #FFFFFF;
      color: #344054;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      width: 100%;
      overflow-x: hidden;
    }
    body { padding: 20px; }
    table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: auto; word-break: break-word; margin-top: 12px; }
    td, th { word-break: break-word; overflow-wrap: break-word; max-width: 300px; padding: 8px 10px; border-bottom: 1px solid #ECEEF1; }
    th { background: #F8F8F7; text-align: left; font-size: 11px; text-transform: uppercase; color: #667085; }
    img { max-width: 100%; height: auto; }
    pre, code { white-space: pre-wrap; word-break: break-word; background: #F8F8F7; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    h1, h2, h3, h4 { color: #17181C; }
    * { max-width: 100%; }
    div, section, article, p { overflow-wrap: break-word; }
  </style>
</head>
<body>${pageState.output.fsd || ''}</body>
</html>`}
                      title="Database Design Document"
                      className="w-full flex-1 border-0 rounded-[10px]"
                      style={{ minHeight: '500px', background: '#FFFFFF' }}
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
        stageType="database-design"
      />

    </div>
  );
}
