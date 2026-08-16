import React, { useEffect, useState } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { GeneratedOutput } from '../components/GeneratedOutput';
import { pdfGenerator } from '../utils/pdfGenerator';
import { excelGenerator } from '../utils/excelGenerator';
import { ConfluencePublishModal } from '../components/ConfluencePublishModal';
import ArtifactLineageTree from '../components/ArtifactLineageTree';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function TraceabilityMatrix() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['traceability-matrix'];
  const [isConfluenceOpen, setIsConfluenceOpen] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'matrix'
  const [customPrompt, setCustomPrompt] = useState('');

  const {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact
  } = useArtefactVersioning('traceability-matrix', 'Requirements Traceability Matrix', updatePageState);

  const handleTriggerGenerate = async () => {
    await backendAdapter.runGeneration('traceability-matrix', updatePageState, customPrompt);
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
      artefactId: `TRC-${reqSuffix}`,
      title: 'Requirements Traceability Matrix',
      content: pageState.output
    });
  };

  const handleExportExcel = () => {
    if (!pageState.output?.matrix) return;
    excelGenerator.download('Requirements_Traceability_Matrix', pageState.output.matrix);
  };

  const handleExportPDF = () => {
    if (!pageState.output?.matrix) return;
    
    let htmlContent = `
      <h1>Requirements Traceability Matrix</h1>
      <p>Status: <strong>${pageState.output.coverage} Traceability Coverage Achieved</strong></p>
      <table>
        <thead>
          <tr>
            <th>Requirement ID (FSD)</th>
            <th>User Story ID (JIRA)</th>
            <th>Tech Spec Section</th>
            <th>Database Tables</th>
            <th>Test Case IDs</th>
          </tr>
        </thead>
        <tbody>
    `;
    pageState.output.matrix.forEach(row => {
      htmlContent += `
        <tr>
          <td><strong>${row.reqId}</strong></td>
          <td>${row.userStoryId}</td>
          <td>${row.techSpec}</td>
          <td>${row.dbTables}</td>
          <td>${row.testCases}</td>
        </tr>
      `;
    });
    htmlContent += '</tbody></table>';

    pdfGenerator.download('Traceability_Matrix.pdf', htmlContent);
  };

  return (
    <div className="flex flex-col space-y-4 h-[calc(100vh-100px)]">
      {/* Mode Switcher Header */}
      <div className="flex justify-between items-center bg-[#0b0f19] p-3 rounded-2xl border border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
            <i className="fas fa-sitemap text-indigo-400"></i>
            <span>Requirements & Artifact Traceability Lineage</span>
          </h2>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-[#0b0f19] fa-sitemap"></i>
            <span>Connected Lineage Tree</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-table"></i>
            <span>Matrix Table Workspace</span>
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <div className="flex-1 min-h-0">
          <ArtifactLineageTree />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
            <CascadedSpecViewerPanel
              pageState={pageState}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              onAction={handleTriggerGenerate}
              actionLabel="Compile Matrix"
              actionIcon="fa-table"
            />
          </div>

          <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
        <GeneratedOutput
          title="Engineering Traceability Matrix Workspace"
          subtitle="Cross-references from specification documents to code and test tasks"
          versions={savedVersions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(id) => {
            setSelectedVersionId(id);
            const ver = savedVersions.find(v => v.id === id);
            if (ver && ver.content) {
              updatePageState('traceability-matrix', { output: ver.content });
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
                  onClick={handleExportExcel}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-green-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <i className="far fa-file-excel"></i>
                  <span>Excel</span>
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
                <i className="fas fa-link text-3xl"></i>
              </div>
              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-bold text-slate-300">Traceability Reviewboard Offline</p>
                <p className="text-[11px] text-slate-500">Provide requirements specifications on the left to compile links linking specs, database records, and test plans.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              
              <div className="bg-indigo-950/40 border border-indigo-900/60 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Status Trackers Coverage</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Requirement-to-code traceability index</p>
                  </div>
                </div>
                
                <span className="px-3.5 py-1.5 bg-emerald-950/30 text-emerald-400 border border-emerald-900/60 text-xs font-bold rounded-full flex items-center">
                  <i className="fas fa-check-circle mr-1.5"></i>
                  <span>{pageState.output.coverage} Traceability Coverage achieved</span>
                </span>
              </div>

              <div className="flex-1 bg-slate-950/60 border border-slate-900 rounded-xl overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="p-3 border-r border-slate-800">Requirement ID (FSD)</th>
                      <th className="p-3 border-r border-slate-800">User Story ID (JIRA)</th>
                      <th className="p-3 border-r border-slate-800">Tech Spec Section</th>
                      <th className="p-3 border-r border-slate-800">Database Tables</th>
                      <th className="p-3 border-r border-slate-800">Test Case IDs</th>
                      <th className="p-3">Evidence Correlation Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/20 text-slate-300">
                    {pageState.output.matrix?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/20">
                        <td className="p-3 border-r border-slate-800 font-bold text-indigo-400">{row.reqId}</td>
                        <td className="p-3 border-r border-slate-800 font-medium text-slate-200">{row.userStoryId}</td>
                        <td className="p-3 border-r border-slate-800 text-slate-400">{row.techSpec}</td>
                        <td className="p-3 border-r border-slate-800 font-mono text-purple-400">{row.dbTables}</td>
                        <td className="p-3 border-r border-slate-800 text-emerald-400 font-medium">{row.testCases}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-800 text-indigo-300 font-mono text-[10px] rounded">
                            CORR-REQ-8821
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GeneratedOutput>
      </div>
    </div>
  )}

      <ConfluencePublishModal 
        isOpen={isConfluenceOpen}
        onClose={() => setIsConfluenceOpen(false)}
        stageType="traceability-matrix"
      />

    </div>
  );
}
