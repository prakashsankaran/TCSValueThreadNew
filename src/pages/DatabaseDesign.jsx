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
              <div className="flex items-center space-x-1.5">
                {showSyncSuccess && (
                  <span className="px-2.5 py-1 bg-green-900/30 text-green-400 border border-green-800 text-[10px] font-bold rounded-lg animate-fade-in">
                    {syncMessage || 'Saved & Synchronized!'}
                  </span>
                )}
                <button 
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg border border-green-500/30 shadow-lg flex items-center space-x-1 cursor-pointer"
                >
                  {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                  <span>Save & Sync</span>
                </button>
                <button 
                  onClick={() => setIsConfluenceOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fab fa-confluence"></i>
                  <span>Confluence</span>
                </button>
                <button 
                  onClick={handleExportSQL}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fas fa-file-code"></i>
                  <span>SQL</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
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
              <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-full">
                <i className="fas fa-database text-3xl"></i>
              </div>
              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-bold text-slate-300">Schema Reviewboard Offline</p>
                <p className="text-[11px] text-slate-500">Provide specs on the left and compile to explore SQL DDL codes and table layouts.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              
              <div className="flex space-x-1.5 bg-slate-900/60 p-1 border border-slate-800 rounded-xl self-start">
                <button 
                  onClick={() => setActiveTab('erd')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === 'erd' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ERD Diagram
                </button>
                <button 
                  onClick={() => setActiveTab('sql')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === 'sql' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SQL DDL Script
                </button>
                <button 
                  onClick={() => setActiveTab('fsd')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activeTab === 'fsd' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Database Design Document
                </button>
              </div>

              <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-900 p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                
                {activeTab === 'erd' ? (
                  <div className="flex-1 relative flex flex-col overflow-hidden">
                    <div className="absolute top-2 right-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-lg flex space-x-1 z-10">
                      <button 
                        onClick={() => setZoomScale(prev => Math.min(prev + 0.1, 2))}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => setZoomScale(prev => Math.max(prev - 0.1, 0.5))}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => setZoomScale(1)}
                        className="px-2 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center custom-scroll bg-slate-950/20 rounded-lg border border-slate-900/50 p-4">
                      <div 
                        ref={diagramRef} 
                        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
                        className="text-center"
                      />
                    </div>
                  </div>
                ) : activeTab === 'sql' ? (
                  <div className="flex-1 overflow-auto custom-scroll fsd-document p-2">
                    <pre className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed">
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
      background: #0f172a;
      color: #e2e8f0;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      width: 100%;
      overflow-x: hidden;
    }
    body { padding: 16px; }
    table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: auto; word-break: break-word; }
    td, th { word-break: break-word; overflow-wrap: break-word; max-width: 300px; }
    img { max-width: 100%; height: auto; }
    pre, code { white-space: pre-wrap; word-break: break-word; }
    * { max-width: 100%; }
    div, section, article, p { overflow-wrap: break-word; }
  </style>
</head>
<body>${pageState.output.fsd || ''}</body>
</html>`}
                      title="Database Design Document"
                      className="w-full flex-1 border-0 rounded-xl"
                      style={{ minHeight: '500px', background: '#0f172a' }}
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
