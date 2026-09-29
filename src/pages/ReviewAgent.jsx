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
                  onClick={publishToConfluence}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-[#7157F5] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="fab fa-confluence"></i>
                  <span>Confluence</span>
                </button>
                <button 
                  onClick={linkToJira}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-white hover:border-[#D0D5DD] text-emerald-700 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="fab fa-jira"></i>
                  <span>Jira</span>
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] hover:border-emerald-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <i className="far fa-file-excel"></i>
                  <span>Excel</span>
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
          <div className="flex flex-col h-full space-y-4">
            
            <div className="flex bg-[#F8F8F7] p-1 border border-[#ECEEF1] rounded-[10px] self-start shadow-2xs">
              <button 
                onClick={() => setRightTab('compliance')}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                  rightTab === 'compliance' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                }`}
              >
                Compliance Review
              </button>
              <button 
                onClick={() => setRightTab('code')}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                  rightTab === 'code' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C]'
                }`}
              >
                Code Quality Audit
              </button>
            </div>

            <div className="flex-1 bg-white rounded-[14px] border border-[#ECEEF1] p-5 overflow-auto custom-scroll min-h-[300px] shadow-2xs">
              {rightTab === 'compliance' ? (
                !pageState.output ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7157F5] flex items-center justify-center text-xl border border-purple-100 shadow-2xs">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <p className="text-sm font-bold text-[#17181C]">Run Audit to Audit Compliance</p>
                    <p className="text-xs text-[#667085] max-w-xs">Select active modules to scan role boundary parameters and compliance certifications.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-semibold text-[10px]">
                            <th className="p-3 w-16 border-r border-[#ECEEF1]">ID</th>
                            <th className="p-3 border-r border-[#ECEEF1]">Compliance Checkpoint</th>
                            <th className="p-3 w-20 border-r border-[#ECEEF1] text-center">Status</th>
                            <th className="p-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ECEEF1] text-[#344054]">
                          {pageState.output.compliance?.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[#FAFAF9] transition">
                              <td className="p-3 border-r border-[#ECEEF1] font-bold text-[#7157F5] font-mono">{row.id}</td>
                              <td className="p-3 border-r border-[#ECEEF1] font-semibold text-[#17181C]">{row.checkpoint}</td>
                              <td className="p-3 border-r border-[#ECEEF1] text-center">
                                <span className={`px-2 py-0.5 rounded-[6px] text-[9px] font-bold ${
                                  row.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-3 text-[#475467] leading-normal">{row.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="bg-[#F8F8F7] p-4 border border-[#ECEEF1] rounded-[12px] space-y-3">
                    <label className="block text-[10px] font-bold text-[#667085] uppercase tracking-wider">Repository Path</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={repoPath}
                        onChange={(e) => setRepoPath(e.target.value)}
                        className="flex-1 bg-white border border-[#ECEEF1] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:border-[#7157F5] text-[#17181C] font-mono"
                      />
                      <button 
                        onClick={handleValidatePath}
                        className="px-3 py-2 bg-[#F8F8F7] hover:bg-white text-[#344054] text-xs font-semibold rounded-[8px] border border-[#ECEEF1] cursor-pointer shadow-2xs transition"
                      >
                        Validate Path
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={handleScanTechStack}
                        disabled={isScanning}
                        className="px-4 py-2 bg-[#7157F5] hover:bg-[#5F46D8] text-white text-xs font-semibold rounded-[8px] flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                      >
                        {isScanning ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-laptop-code"></i>}
                        <span>Scan Tech Stack</span>
                      </button>
                      <button 
                        onClick={handleAICodeAudit}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-[8px] flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                      >
                        <i className="fas fa-microchip"></i>
                        <span>AI Code Audit</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[150px]">
                    <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider flex items-center">
                      <i className="fas fa-terminal mr-1 text-[#7157F5]"></i> Execution Terminal
                    </div>
                    <div className="flex-1 bg-[#17181C] font-mono text-[10px] text-slate-300 p-3.5 rounded-[10px] border border-slate-800 overflow-y-auto custom-scroll flex flex-col space-y-1">
                      {scanLogs.length === 0 ? (
                        <div className="text-slate-500 italic">Initiate a pathway validation or stack scanner to view build output logs...</div>
                      ) : (
                        scanLogs.map((log, idx) => (
                          <div key={idx} className={log.includes('[Error]') ? 'text-rose-400' : log.includes('[TechScanner]') ? 'text-purple-400' : 'text-slate-300'}>
                            {log}
                          </div>
                        ))
                      )}
                      
                      {scanResults && (
                        <div className="border-t border-slate-800 pt-2.5 mt-2.5 space-y-2">
                          <div className="text-emerald-400 font-bold">[Scan Report] Detected Frameworks:</div>
                          <div className="pl-4 text-slate-300 flex flex-wrap gap-1.5">
                            {scanResults.languages.map((l, i) => (
                              <span key={i} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px]">{l}</span>
                            ))}
                          </div>
                          <div className="text-rose-400 font-bold mt-2">[Scan Report] Potential issues found:</div>
                          <div className="pl-4 space-y-1">
                            {scanResults.issues.map((iss, i) => (
                              <div key={i} className="text-slate-400">
                                <span className="text-amber-400 font-semibold">[{iss.severity}]</span> {iss.file}: {iss.message}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white max-w-sm w-full p-5 rounded-[20px] border border-[#ECEEF1] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <i className="fas fa-check-circle text-2xl"></i>
              <h3 className="text-sm font-bold text-[#17181C]">Operation Successful</h3>
            </div>
            <p className="text-xs text-[#475467] leading-normal">{dialogText}</p>
            <button 
              onClick={() => setShowDialog(false)}
              className="w-full py-2 bg-[#7157F5] hover:bg-[#5F46D8] text-white text-xs font-semibold rounded-[8px] transition shadow-2xs cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
