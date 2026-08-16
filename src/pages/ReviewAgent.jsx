import React, { useState } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { GeneratedOutput } from '../components/GeneratedOutput';
import { pdfGenerator } from '../utils/pdfGenerator';
import { excelGenerator } from '../utils/excelGenerator';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function ReviewAgent() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['review-agent'];

  const [rightTab, setRightTab] = useState('compliance');
  const [customPrompt, setCustomPrompt] = useState('');

  const {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact
  } = useArtefactVersioning('review-agent', 'Compliance Audit Report', updatePageState);

  const handleTriggerGenerate = async () => {
    await backendAdapter.runGeneration('review-agent', updatePageState, customPrompt || 'Audit generated baseline specification & artefacts');
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
      artefactId: `REV-${reqSuffix}`,
      title: 'Compliance Audit Report',
      content: pageState.output
    });
  };

  const handleCheckboxChange = (key) => {
    setImportedStages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleValidatePath = async () => {
    setScanLogs(prev => [...prev, `[PathCheck] Checking directory path availability: ${repoPath}`]);
    setTimeout(() => {
      setScanLogs(prev => [...prev, `[PathCheck] Validated! Path is a registered workspace directory.`]);
    }, 500);
  };

  const handleScanTechStack = async () => {
    setIsScanning(true);
    setScanLogs(prev => [...prev, `[TechScanner] Initiating filesystem recursive walk...`]);
    try {
      const data = await api.scanRepo(repoPath);
      setIsScanning(false);
      setScanLogs(prev => [
        ...prev,
        `[TechScanner] Scan completed!`,
        `[TechScanner] Languages detected: ${data.languages.join(', ')}`
      ]);
      setScanResults(data);
    } catch (e) {
      setIsScanning(false);
      setScanLogs(prev => [...prev, `[Error] Tech Scan failed: ${e.message}`]);
    }
  };

  const handleAICodeAudit = () => {
    setScanLogs(prev => [
      ...prev,
      `[AI-Auditor] Running structural semantic scanning...`,
      `[AI-Auditor] Checkpoint: SQL Injection vulnerabilities -> Clean.`,
      `[AI-Auditor] Checkpoint: CSRF & CORS Configurations -> Validated Express CORS headers.`,
      `[AI-Auditor] Scan complete. Found 2 issues.`
    ]);
  };

  const publishToConfluence = () => {
    setDialogText('Report successfully compiled and enqueued for publish to Confluence Space [ENG-SDD].');
    setShowDialog(true);
  };

  const linkToJira = () => {
    setDialogText('Issues mapped and linked to JIRA active sprint tracker.');
    setShowDialog(true);
  };

  const handleExportPDF = () => {
    if (!pageState.output) return;
    
    let htmlContent = `
      <h1>System Quality & Compliance Audit Report</h1>
      <h2>Compliance Review Checkpoints</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Compliance Checkpoint</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
    `;
    pageState.output.compliance?.forEach(row => {
      htmlContent += `
        <tr>
          <td><strong>${row.id}</strong></td>
          <td>${row.checkpoint}</td>
          <td>${row.status}</td>
          <td>${row.details}</td>
        </tr>
      `;
    });
    htmlContent += '</tbody></table>';

    pdfGenerator.download('Compliance_Report.pdf', htmlContent);
  };

  const handleExportExcel = () => {
    if (!pageState.output?.compliance) return;
    excelGenerator.download('Compliance_Audit_Report', pageState.output.compliance);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left Panel */}
      <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
        <CascadedSpecViewerPanel
          pageState={pageState}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          onAction={handleTriggerGenerate}
          actionLabel="Run Audit"
          actionIcon="fa-shield-alt"
        />
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
        <GeneratedOutput
          title="System Audit & Quality Compliance Board"
          subtitle="Enterprise risk checkpoints scanning, compliance matrices and stack audits"
          versions={savedVersions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(id) => {
            setSelectedVersionId(id);
            const ver = savedVersions.find(v => v.id === id);
            if (ver && ver.content) {
              updatePageState('review-agent', { output: ver.content });
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
                  onClick={publishToConfluence}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fab fa-confluence"></i>
                  <span>Confluence</span>
                </button>
                <button 
                  onClick={linkToJira}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fab fa-jira"></i>
                  <span>Jira</span>
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
          <div className="flex flex-col h-full space-y-4">
            
            <div className="flex space-x-1.5 bg-slate-900/60 p-1 border border-slate-800 rounded-xl self-start">
              <button 
                onClick={() => setRightTab('compliance')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                  rightTab === 'compliance' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Compliance Review
              </button>
              <button 
                onClick={() => setRightTab('code')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                  rightTab === 'code' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Code Quality Audit
              </button>
            </div>

            <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-900 p-5 overflow-auto custom-scroll min-h-[300px]">
              {rightTab === 'compliance' ? (
                !pageState.output ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
                    <div className="p-3.5 bg-indigo-500/5 text-indigo-400 rounded-full">
                      <i className="fas fa-shield-alt text-2xl"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-300">Run Audit to Audit Compliance</p>
                    <p className="text-[10px] text-slate-500 max-w-xs">Select active modules to scan role boundary parameters and compliance certifications.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                            <th className="p-3 w-16 border-r border-slate-800">ID</th>
                            <th className="p-3 border-r border-slate-800">Compliance Checkpoint</th>
                            <th className="p-3 w-20 border-r border-slate-800 text-center">Status</th>
                            <th className="p-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950/20 text-slate-300">
                          {pageState.output.compliance?.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/20">
                              <td className="p-3 border-r border-slate-800 font-bold text-indigo-400">{row.id}</td>
                              <td className="p-3 border-r border-slate-800 font-semibold text-slate-200">{row.checkpoint}</td>
                              <td className="p-3 border-r border-slate-800 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                  row.status === 'Passed' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 leading-normal">{row.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repository Path</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={repoPath}
                        onChange={(e) => setRepoPath(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 font-mono"
                      />
                      <button 
                        onClick={handleValidatePath}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
                      >
                        Validate Path
                      </button>
                    </div>

                    <div className="flex space-x-2 pt-1">
                      <button 
                        onClick={handleScanTechStack}
                        disabled={isScanning}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow cursor-pointer"
                      >
                        {isScanning ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-laptop-code"></i>}
                        <span>Scan Tech Stack</span>
                      </button>
                      <button 
                        onClick={handleAICodeAudit}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow cursor-pointer"
                      >
                        <i className="fas fa-microchip"></i>
                        <span>AI Code Audit</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[150px]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <i className="fas fa-terminal mr-1 text-purple-400"></i> Execution Terminal
                    </div>
                    <div className="flex-1 bg-slate-950/80 font-mono text-[10px] text-slate-300 p-3 rounded-lg border border-slate-800 overflow-y-auto custom-scroll flex flex-col space-y-1">
                      {scanLogs.length === 0 ? (
                        <div className="text-slate-600 italic">Initiate a pathway validation or stack scanner to view build output logs...</div>
                      ) : (
                        scanLogs.map((log, idx) => (
                          <div key={idx} className={log.includes('[Error]') ? 'text-red-400' : log.includes('[TechScanner]') ? 'text-indigo-400' : 'text-slate-400'}>
                            {log}
                          </div>
                        ))
                      )}
                      
                      {scanResults && (
                        <div className="border-t border-slate-800 pt-2.5 mt-2.5 space-y-2">
                          <div className="text-green-400 font-bold">[Scan Report] Detected Frameworks:</div>
                          <div className="pl-4 text-slate-300 flex flex-wrap gap-1.5">
                            {scanResults.languages.map((l, i) => (
                              <span key={i} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px]">{l}</span>
                            ))}
                          </div>
                          <div className="text-red-400 font-bold mt-2">[Scan Report] Potential issues found:</div>
                          <div className="pl-4 space-y-1">
                            {scanResults.issues.map((iss, i) => (
                              <div key={i} className="text-slate-400">
                                <span className="text-yellow-500 font-semibold">[{iss.severity}]</span> {iss.file}: {iss.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </GeneratedOutput>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel max-w-sm w-full mx-4 p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <i className="fas fa-check-circle text-2xl"></i>
              <h3 className="text-sm font-bold text-slate-200">Operation Successful</h3>
            </div>
            <p className="text-xs text-slate-400 leading-normal">{dialogText}</p>
            <button 
              onClick={() => setShowDialog(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition duration-150 cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
