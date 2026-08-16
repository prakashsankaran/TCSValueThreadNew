import React, { useState, useEffect } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { GeneratedOutput } from '../components/GeneratedOutput';
import { pdfGenerator } from '../utils/pdfGenerator';
import { ConfluencePublishModal } from '../components/ConfluencePublishModal';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function TestCases() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['test-cases'];
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
  } = useArtefactVersioning('test-cases', 'Test Strategy & Test Suite Cases', updatePageState);

  const handleTriggerGenerate = async () => {
    await backendAdapter.runGeneration('test-cases', updatePageState, customPrompt);
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
      artefactId: `TC-${reqSuffix}`,
      title: 'Test Strategy & Test Suite Cases',
      content: pageState.output
    });
  };

  const handleDownloadPDF = () => {
    if (!pageState.output) return;
    const docHtml = pageState.output.html || '<p>No content generated.</p>';
    pdfGenerator.download('Test_Cases_Document.pdf', docHtml);
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
          actionLabel="Generate Test Cases"
          actionIcon="fa-vial"
        />
      </div>

      <div className="h-full flex flex-col overflow-hidden">
        <GeneratedOutput
          title="Test Strategy & Test Cases Document"
          subtitle="Comprehensive QA test strategy, scenarios, and detailed test cases"
          versions={savedVersions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(id) => {
            setSelectedVersionId(id);
            const ver = savedVersions.find(v => v.id === id);
            if (ver && ver.content) {
              updatePageState('test-cases', { output: ver.content });
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
                  onClick={handleDownloadPDF}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <i className="far fa-file-pdf"></i>
                  <span>Download PDF</span>
                </button>
              </div>
            )
          }
        >
          {!pageState.output ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-full">
                <i className="fas fa-tasks text-3xl"></i>
              </div>
              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-bold text-slate-300">Test Document Not Generated</p>
                <p className="text-[11px] text-slate-500">Provide specs on the left and compile to generate the comprehensive test strategy & test cases document.</p>
              </div>
            </div>
          ) : (
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
    table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      table-layout: auto;
      word-break: break-word;
    }
    td, th {
      word-break: break-word;
      overflow-wrap: break-word;
      max-width: 300px;
    }
    img { max-width: 100%; height: auto; }
    pre, code { white-space: pre-wrap; word-break: break-word; }
    * { max-width: 100%; }
    div, section, article, p { overflow-wrap: break-word; }
  </style>
</head>
<body>${pageState.output.html || ''}</body>
</html>`}
              title="Test Strategy & Test Cases Document"
              className="w-full h-full border border-slate-800 rounded-xl"
              style={{ background: '#0f172a' }}
            />
          )}
        </GeneratedOutput>
      </div>

      <ConfluencePublishModal 
        isOpen={isConfluenceOpen}
        onClose={() => setIsConfluenceOpen(false)}
        stageType="test-cases"
      />

    </div>
  );
}
