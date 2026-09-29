import React, { useEffect, useState } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { api } from '../services/api';
import { ComplexityBadge } from '../components/ComplexityBadge';
import { pdfGenerator } from '../utils/pdfGenerator';
import { excelGenerator } from '../utils/excelGenerator';
import { markdownGenerator } from '../utils/markdownGenerator';
import { JiraPublishModal } from '../components/JiraPublishModal';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';

export default function UserStories() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['user-stories'];

  const [activeLeftTab, setActiveLeftTab] = useState('spec');
  const [specContent, setSpecContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  
  const [isJiraUploading, setIsJiraUploading] = useState(false);
  const [jiraUploadResult, setJiraUploadResult] = useState(null);
  const [jiraError, setJiraError] = useState('');
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);

  const {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact
  } = useArtefactVersioning('user-stories', 'JIRA Spreadsheet Backlog', updatePageState);

  useEffect(() => {
    const loadSpec = async () => {
      try {
        const data = await api.getWorkspaceSpec();
        if (data && data.content) {
          setSpecContent(data.content);
        } else {
          throw new Error('No spec content returned');
        }
      } catch (err) {
        setSpecContent(`# Specification Document: Return Request Tracker (v1.0)

## 1. Feature Overview
The Return Request Tracker system empowers customers to request merchandise returns, track return status, and receive automatic refunds upon warehouse verification.

## 2. Functional Requirements
* **REQ-01**: Customers must be able to initiate a return request within 30 days of purchase.
* **REQ-02**: System must validate item condition and return authorization code.
* **REQ-03**: Automatic SMS & Email notifications sent upon refund approval.
* **REQ-04**: Returns exceeding $500 require visual auditor manual approval.`);
      }
    };
    loadSpec();
  }, []);

  const handleUpdateSpecAndStories = async () => {
    try {
      updatePageState('user-stories', { isLoading: true });
      const generated = await backendAdapter.runGeneration('user-stories', updatePageState, customPrompt);
      if (generated) {
        await handleSaveAndSync(generated);
      }
    } catch (e) {
      console.error('Generation error:', e);
      updatePageState('user-stories', { isLoading: false });
    }
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
      artefactId: `US-${reqSuffix}`,
      title: 'JIRA Spreadsheet Backlog',
      content: payloadContent,
      metadata: { itemCount: payloadContent?.spreadsheet?.length || 0 }
    });
  };

  const handleUploadToJira = () => {
    setIsJiraModalOpen(true);
  };

  const handleJiraSuccess = (createdIssues) => {
    let normalized = [];
    if (Array.isArray(createdIssues)) {
      normalized = createdIssues.map((item, idx) => {
        if (typeof item === 'string') {
          return {
            key: item,
            summary: pageState.output?.spreadsheet?.[idx]?.summary || `Agile User Story ${item}`,
            status: 'To Do',
            link: `https://jira.atlassian.com/browse/${item}`
          };
        }
        return {
          key: item.key || item.id || `SDD-${101 + idx}`,
          summary: item.summary || item.title || `JIRA Backlog Task ${101 + idx}`,
          status: item.status || 'To Do',
          link: item.link || `https://jira.atlassian.com/browse/${item.key || item.id || `SDD-${101 + idx}`}`
        };
      });
    }
    setJiraUploadResult(normalized);
    setJiraError('');
  };

  const handleJiraError = (errorMsg) => {
    setJiraError(errorMsg);
    setJiraUploadResult(null);
  };

  const startEditCell = (rowIdx, colKey, val) => {
    setEditingCell({ rowIdx, colKey });
    setEditingValue(val);
  };

  const saveCellEdit = (rowIdx, colKey) => {
    if (!pageState.output || !pageState.output.spreadsheet) return;
    
    const updatedSpreadsheet = [...pageState.output.spreadsheet];
    updatedSpreadsheet[rowIdx] = {
      ...updatedSpreadsheet[rowIdx],
      [colKey]: colKey === 'storyPoints' ? Number(editingValue) || 0 : editingValue
    };
    
    updatePageState('user-stories', {
      output: {
        ...pageState.output,
        spreadsheet: updatedSpreadsheet
      }
    });
    setEditingCell(null);
  };

  const handleExportPDF = () => {
    if (!pageState.output || !pageState.output.spreadsheet) return;
    
    let htmlContent = `
      <h1>JIRA Compliance Backlog</h1>
      <table>
        <thead>
          <tr>
            <th>Summary</th>
            <th>Description</th>
            <th>Issue Type</th>
            <th>Priority</th>
            <th>Story Points</th>
            <th>Labels</th>
          </tr>
        </thead>
        <tbody>
    `;
    pageState.output.spreadsheet.forEach(row => {
      htmlContent += `
        <tr>
          <td><strong>${row.summary}</strong></td>
          <td>${row.description}</td>
          <td>${row.issueType}</td>
          <td>${row.priority}</td>
          <td>${row.storyPoints}</td>
          <td>${row.labels}</td>
        </tr>
      `;
    });
    htmlContent += '</tbody></table>';
    
    pdfGenerator.download('JIRA_Backlog.pdf', htmlContent);
  };

  const handleExportExcel = () => {
    if (!pageState.output || !pageState.output.spreadsheet) return;
    excelGenerator.download('JIRA_Backlog', pageState.output.spreadsheet);
  };

  const handleExportMarkdown = () => {
    if (!pageState.output || !pageState.output.spreadsheet) return;
    
    let md = '# JIRA Backlog Export\n\n';
    md += '| Summary | Description | Issue Type | Priority | Story Points | Labels |\n';
    md += '| --- | --- | --- | --- | --- | --- |\n';
    pageState.output.spreadsheet.forEach(row => {
      md += `| ${row.summary} | ${row.description} | ${row.issueType} | ${row.priority} | ${row.storyPoints} | ${row.labels} |\n`;
    });
    
    markdownGenerator.download('JIRA_Backlog.md', md);
  };

  const handleDownloadMD = () => {
    markdownGenerator.download('spec.md', specContent);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT PANEL */}
      <CascadedSpecViewerPanel 
        pageState={pageState}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        onAction={handleUpdateSpecAndStories}
        actionLabel="Decompose Stories"
        actionIcon="fa-list-ol"
        onDownloadMD={handleDownloadMD}
      />

      {/* RIGHT PANEL */}
      <div className="bg-white rounded-[18px] flex flex-col overflow-hidden border border-[#ECEEF1] shadow-2xs">
        <div className="px-4 py-3 border-b border-[#ECEEF1] flex flex-wrap items-center justify-between gap-2 bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0 shrink">
            <span className="w-1.5 h-3.5 bg-[#7157F5] rounded-full shrink-0"></span>
            <h2 className="text-xs font-bold tracking-wider text-[#17181C] uppercase whitespace-nowrap shrink-0">
              JIRA Backlog
            </h2>
            <select
              value={selectedVersionId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedVersionId(id);
                const ver = savedVersions.find(v => v.id === id);
                if (ver && ver.content) {
                  updatePageState('user-stories', { output: ver.content });
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
              onClick={handleSaveAndSync}
              disabled={isSyncing || !pageState.output}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-[8px] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition"
            >
              {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              <span>Save Changes & Sync</span>
            </button>
            <button 
              type="button"
              onClick={handleUploadToJira}
              disabled={isJiraUploading || !pageState.output}
              className="px-3 py-1.5 bg-[#7157F5] hover:bg-[#5F46D8] text-white text-xs font-semibold rounded-[8px] shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition"
            >
              {isJiraUploading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fab fa-jira"></i>}
              <span>Upload to JIRA</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scroll bg-[#FAFAF9]">
          {!pageState.output ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#7157F5] flex items-center justify-center text-xl border border-purple-100 shadow-2xs">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-bold text-[#17181C]">Generate Backlog Stories</p>
                <p className="text-xs text-[#667085]">Trigger compilation on the left to extract JIRA tasks directly from specifications.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs bg-white">
              <thead>
                <tr className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-3 border-r border-[#ECEEF1]">Summary</th>
                  <th className="p-3 border-r border-[#ECEEF1]">Description</th>
                  <th className="p-3 border-r border-[#ECEEF1]">Type</th>
                  <th className="p-3 border-r border-[#ECEEF1] w-20">Priority</th>
                  <th className="p-3 border-r border-[#ECEEF1] w-14 text-center">SP</th>
                  <th className="p-3">Labels</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1]">
                {pageState.output.spreadsheet?.map((row, rowIdx) => (
                  <tr key={row.id} className="hover:bg-[#FAFAF9] transition">
                    <td 
                      onDoubleClick={() => startEditCell(rowIdx, 'summary', row.summary)}
                      className="p-2.5 border-r border-[#ECEEF1] font-semibold text-[#17181C]"
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'summary' ? (
                        <input 
                          type="text" 
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveCellEdit(rowIdx, 'summary')}
                          autoFocus
                          className="w-full bg-white text-[#17181C] border border-[#7157F5] rounded-[6px] p-1 text-xs focus:outline-none"
                        />
                      ) : row.summary}
                    </td>

                    <td 
                      onDoubleClick={() => startEditCell(rowIdx, 'description', row.description)}
                      className="p-2.5 border-r border-[#ECEEF1] text-[#475467] truncate max-w-[200px]"
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'description' ? (
                        <input 
                          type="text" 
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveCellEdit(rowIdx, 'description')}
                          autoFocus
                          className="w-full bg-white text-[#17181C] border border-[#7157F5] rounded-[6px] p-1 text-xs focus:outline-none"
                        />
                      ) : row.description}
                    </td>

                    <td 
                      onDoubleClick={() => startEditCell(rowIdx, 'issueType', row.issueType)}
                      className="p-2.5 border-r border-[#ECEEF1]"
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'issueType' ? (
                        <select 
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveCellEdit(rowIdx, 'issueType')}
                          autoFocus
                          className="w-full bg-white text-[#17181C] border border-[#7157F5] rounded-[6px] p-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option>Story</option>
                          <option>Task</option>
                          <option>Bug</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
                          row.issueType === 'Story' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          row.issueType === 'Bug' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-[#F8F8F7] text-[#344054] border border-[#ECEEF1]'
                        }`}>
                          {row.issueType}
                        </span>
                      )}
                    </td>

                    <td 
                      onDoubleClick={() => startEditCell(rowIdx, 'priority', row.priority)}
                      className="p-2.5 border-r border-[#ECEEF1]"
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'priority' ? (
                        <select 
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveCellEdit(rowIdx, 'priority')}
                          autoFocus
                          className="w-full bg-white text-[#17181C] border border-[#7157F5] rounded-[6px] p-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold ${row.priority === 'High' ? 'text-rose-600' : 'text-[#475467]'}`}>
                          {row.priority}
                        </span>
                      )}
                    </td>

                    <td 
                      onDoubleClick={() => startEditCell(rowIdx, 'storyPoints', row.storyPoints)}
                      className="p-2.5 border-r border-[#ECEEF1] text-center font-bold text-[#7157F5]"
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'storyPoints' ? (
                        <input 
                          type="number" 
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveCellEdit(rowIdx, 'storyPoints')}
                          autoFocus
                          className="w-10 bg-white text-[#17181C] border border-[#7157F5] rounded-[6px] p-1 text-xs focus:outline-none text-center"
                        />
                      ) : row.storyPoints}
                    </td>

                    <td 
                      onDoubleClick={() => startEditCell(rowIdx, 'labels', row.labels)}
                      className="p-2.5 text-[#475467]"
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === 'labels' ? (
                        <input 
                          type="text" 
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => saveCellEdit(rowIdx, 'labels')}
                          autoFocus
                          className="w-full bg-white text-[#17181C] border border-[#7157F5] rounded-[6px] p-1 text-xs focus:outline-none"
                        />
                      ) : row.labels}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pageState.output && (
          <div className="px-5 py-3 border-t border-[#ECEEF1] bg-white flex justify-end gap-2 pr-16 shadow-2xs">
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
            <button 
              onClick={handleExportMarkdown}
              className="px-2.5 py-1.5 bg-[#F8F8F7] hover:bg-purple-50 text-purple-700 text-xs font-semibold rounded-[8px] border border-[#ECEEF1] hover:border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <i className="fab fa-markdown"></i>
              <span>Markdown</span>
            </button>
          </div>
        )}
      </div>

      {(jiraUploadResult || jiraError) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-[20px] border border-[#ECEEF1] shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#F2F4F7] pb-3">
              <h3 className="text-sm font-bold text-[#17181C] flex items-center gap-2">
                <i className="fab fa-jira text-[#7157F5]"></i>
                <span>JIRA Push Status</span>
              </h3>
              <button 
                onClick={() => { setJiraUploadResult(null); setJiraError(''); }}
                className="text-[#98A2B3] hover:text-[#17181C] transition cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {jiraError ? (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-[12px] text-rose-700 text-xs flex items-start gap-2">
                <i className="fas fa-exclamation-triangle mt-0.5 shrink-0"></i>
                <div className="space-y-1">
                  <p className="font-bold">Sync Failed</p>
                  <p className="leading-normal">{jiraError}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-[12px] text-emerald-800 text-xs flex items-center gap-2">
                  <i className="fas fa-check-circle text-emerald-600"></i>
                  <span>Successfully generated separate user story cards on JIRA board!</span>
                </div>

                <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider font-mono">Created JIRA Cards ({jiraUploadResult.length})</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scroll">
                  {jiraUploadResult.map((issue) => (
                    <div key={issue.key} className="bg-[#F8F8F7] border border-[#ECEEF1] p-3 rounded-[10px] flex justify-between items-center text-xs">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[#17181C] font-semibold truncate">{issue.summary}</span>
                        <span className="text-[10px] text-[#667085]">Key: <span className="text-[#7157F5] font-mono font-bold">{issue.key}</span> | Status: {issue.status}</span>
                      </div>
                      <a 
                        href={issue.link || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(issue.link || `https://jira.atlassian.com/browse/${issue.key}`, '_blank');
                        }}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#7157F5] border border-purple-200 rounded-[6px] font-semibold shrink-0 flex items-center gap-1 transition cursor-pointer text-xs"
                      >
                        <span>Open</span>
                        <i className="fas fa-external-link-alt text-[9px]"></i>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#F2F4F7]">
              <button 
                onClick={() => { setJiraUploadResult(null); setJiraError(''); }}
                className="px-4 py-1.5 bg-[#F8F8F7] hover:bg-[#ECEEF1] text-[#344054] text-xs font-semibold rounded-[8px] transition cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      <JiraPublishModal 
        isOpen={isJiraModalOpen}
        onClose={() => setIsJiraModalOpen(false)}
        onSuccess={handleJiraSuccess}
        onError={handleJiraError}
      />

    </div>
  );
}
