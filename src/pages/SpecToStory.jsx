import React, { useEffect, useState } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { api } from '../services/api';
import { vectorService } from '../services/vectorService';
import { pdfGenerator } from '../utils/pdfGenerator';
import { ComplexityBadge } from '../components/ComplexityBadge';
import { excelGenerator } from '../utils/excelGenerator';
import { markdownGenerator } from '../utils/markdownGenerator';
import CascadedSpecViewerPanel from '../components/CascadedSpecViewerPanel';
import { useArtefactVersioning } from '../hooks/useArtefactVersioning';
import { specControlService } from '../services/specControlService';

export default function SpecToStory() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['spec-to-story'];

  const [activeLeftTab, setActiveLeftTab] = useState('spec');
  const [specContent, setSpecContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedStoryIdx, setSelectedStoryIdx] = useState(0);
  const [editModalStory, setEditModalStory] = useState(null);
  const [isParentDriftInModalOpen, setIsParentDriftInModalOpen] = useState(false);
  const [parentDriftTextInModal, setParentDriftTextInModal] = useState('');
  const [driftSuccessModalMsg, setDriftSuccessModalMsg] = useState('');

  const handleSubmitModalParentDrift = async () => {
    if (!parentDriftTextInModal.trim()) return;
    const activeProj = localStorage.getItem('activeProject') || 'Vendor Management';
    const userRole = localStorage.getItem('userRole') || 'Delivery Manager';
    const parentSpecId = 'SPEC-REQ001';

    try {
      await specControlService.markSpecAsDrifted(parentSpecId, parentDriftTextInModal.trim(), activeProj, userRole);
      setDriftSuccessModalMsg(`Parent Specification (${parentSpecId}) marked as DRIFTED!`);
      setParentDriftTextInModal('');
      setIsParentDriftInModalOpen(false);
      setTimeout(() => setDriftSuccessModalMsg(''), 5000);
    } catch (e) {
      console.error('Error marking parent spec as drifted from story modal:', e);
    }
  };

  const {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact
  } = useArtefactVersioning('spec-to-story', 'User Stories Backlog', updatePageState);

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
    updatePageState('spec-to-story', { isLoading: true });
    try {
      const generated = await backendAdapter.runGeneration('spec-to-story', updatePageState, customPrompt);
      if (generated) {
        await handleSaveAndSync(generated);
      }
    } catch (err) {
      console.error('Failed to run generation:', err);
    } finally {
      updatePageState('spec-to-story', { isLoading: false });
    }
  };

  const handleSaveAndSync = async (contentToSave = null) => {
    const activeProject = localStorage.getItem('activeProject') || 'Vendor Management';
    let reqId = 'REQ001';
    try {
      const res = await fetch(`http://localhost:7001/api/requirements?project=${encodeURIComponent(activeProject)}`);
      const data = await res.json();
      if (data.success && data.requirements.length > 0) {
        reqId = data.requirements[0].requirement_id || data.requirements[0].idea_id || 'REQ001';
      }
    } catch (e) {}

    const payloadContent = contentToSave || pageState.output;
    if (!payloadContent) return;

    const parentSpecId = reqId.startsWith('SPEC-') ? reqId : `SPEC-${reqId}`;

    await saveAndSyncArtefact({
      artefactId: `US-${reqId}`,
      title: 'User Stories Backlog',
      content: payloadContent,
      metadata: { 
        parentArtefactId: parentSpecId,
        specId: parentSpecId,
        requirementId: reqId,
        itemCount: payloadContent?.stories?.length || 0 
      }
    });
  };

  const handleExportPDF = () => {
    if (!pageState.output || !pageState.output.stories) return;
    
    let htmlContent = `
      <h1>Agile User Stories Export</h1>
      <hr/>
    `;
    pageState.output.stories.forEach(story => {
      htmlContent += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2>${story.id}: ${story.title}</h2>
          <p><strong>As a</strong> ${story.asA}</p>
          <p><strong>I want to</strong> ${story.iWantTo}</p>
          <p><strong>So that</strong> ${story.soThat}</p>
          <h3>Acceptance Criteria:</h3>
          <ul>
            ${story.criteria.map(c => `<li>${c}</li>`).join('')}
          </ul>
          <p><strong>Priority:</strong> ${story.priority} | <strong>Story Points:</strong> ${story.points}</p>
          <p><strong>Technical Notes:</strong> ${story.techNotes}</p>
          <hr/>
        </div>
      `;
    });
    
    pdfGenerator.download('User_Stories.pdf', htmlContent);
  };

  const handleExportExcel = () => {
    if (!pageState.output || !pageState.output.stories) return;
    
    const rows = pageState.output.stories.map(s => ({
      ID: s.id,
      Title: s.title,
      'As A': s.asA,
      'I Want To': s.iWantTo,
      'So That': s.soThat,
      'Acceptance Criteria': s.criteria.join('; '),
      Priority: s.priority,
      'Story Points': s.points,
      'Tech Notes': s.techNotes
    }));
    
    excelGenerator.download('Agile_User_Stories', rows);
  };

  const handleExportMarkdown = () => {
    if (!pageState.output || !pageState.output.stories) return;
    
    let md = '# Agile User Stories Backlog\n\n';
    pageState.output.stories.forEach(s => {
      md += `## ${s.id}: ${s.title}\n`;
      md += `* **As a:** ${s.asA}\n`;
      md += `* **I want to:** ${s.iWantTo}\n`;
      md += `* **So that:** ${s.soThat}\n\n`;
      md += `### Acceptance Criteria\n`;
      s.criteria.forEach(c => {
        md += `- ${c}\n`;
      });
      md += `\n* **Priority:** ${s.priority}\n`;
      md += `* **Story Points:** ${s.points}\n`;
      md += `* **Technical Notes:** ${s.techNotes}\n\n`;
      md += `---\n\n`;
    });
    
    markdownGenerator.download('User_Stories.md', md);
  };

  const handleSaveModalEdit = () => {
    if (!editModalStory || !pageState.output) return;
    const index = pageState.output.stories.findIndex(s => s.id === editModalStory.id);
    if (index === -1) return;

    const updatedStories = [...pageState.output.stories];
    updatedStories[index] = { ...editModalStory };
    
    updatePageState('spec-to-story', {
      output: {
        ...pageState.output,
        stories: updatedStories
      }
    });
    setEditModalStory(null);
  };

  const handleDownloadMD = () => {
    markdownGenerator.download('spec.md', specContent);
  };

  const storiesList = Array.isArray(pageState.output?.stories)
    ? pageState.output.stories
    : Array.isArray(pageState.output)
    ? pageState.output
    : [];
  const activeStory = storiesList[selectedStoryIdx] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT PANEL */}
      <CascadedSpecViewerPanel 
        pageState={pageState}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        onAction={handleUpdateSpecAndStories}
        actionLabel="Decompose Spec"
        actionIcon="fa-magic"
        onDownloadMD={handleDownloadMD}
        hideEditParentButton={true}
      />

      {/* RIGHT PANEL */}
      <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800 shadow-xl">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/60 shrink-0">
          <div className="flex items-center space-x-2 min-w-0 shrink">
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full shrink-0"></span>
            <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase whitespace-nowrap shrink-0">
              User Stories
            </h2>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-500/40 rounded-lg px-2 py-1 text-[11px] text-indigo-300 font-mono font-bold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[170px] truncate shrink min-w-[90px]"
            >
              {savedVersions && savedVersions.length > 0 ? (
                savedVersions.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-950 text-slate-200">
                    {v.version}{v.status === 'LATEST' ? ' (LATEST)' : ''} - {v.artefactId || v.id}
                  </option>
                ))
              ) : (
                <option value="" className="bg-slate-950 text-slate-200">v1.0.0 (LATEST)</option>
              )}
            </select>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {showSyncSuccess && (
              <span className="px-2 py-0.5 bg-green-900/40 text-green-400 border border-green-800 text-[10px] font-bold rounded-md animate-fade-in whitespace-nowrap">
                {syncMessage || 'Saved & Synchronized!'}
              </span>
            )}
            <button 
              type="button"
              onClick={() => handleSaveAndSync()}
              disabled={isSyncing || !pageState.output}
              className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg border border-green-500/30 shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              {isSyncing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              <span>Save Changes & Sync</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {!pageState.output ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-full">
                <i className="fas fa-exchange-alt text-3xl"></i>
              </div>
              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-bold text-slate-300">Generate Agile Backlog</p>
                <p className="text-[11px] text-slate-500">Decompose specifications on the left using standard templates (As a... I want to... So that...).</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex divide-x divide-slate-800">
              
              {/* Stories list */}
              <div className="w-1/3 flex flex-col bg-slate-950/20 overflow-y-auto custom-scroll p-3 space-y-2">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-1">Stories ({storiesList.length})</div>
                {storiesList.map((story, idx) => (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStoryIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all duration-150 cursor-pointer ${
                      selectedStoryIdx === idx
                        ? 'bg-indigo-950/20 border-indigo-500/50 text-white'
                        : 'bg-slate-900/10 border-slate-800 text-slate-400 hover:bg-slate-900/30 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[10px] text-indigo-400 font-mono">{story.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        story.priority === 'High' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                      }`}>{story.priority}</span>
                    </div>
                    <p className="font-semibold line-clamp-2 leading-tight">{story.title}</p>
                  </button>
                ))}
              </div>

              {/* Story Detail view */}
              {activeStory && (
                <div className="w-2/3 flex flex-col h-full bg-slate-950/40 p-5 overflow-y-auto custom-scroll space-y-5 animate-fade-in">
                  
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest mb-1">{activeStory.id}</div>
                      <h3 className="text-base font-bold text-slate-100">{activeStory.title}</h3>
                    </div>
                    
                    <button 
                      onClick={() => setEditModalStory({ ...activeStory })}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="fas fa-edit"></i>
                      <span>Edit Story</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Story Statement</h4>
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                      <div>
                        <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] mr-2">As a:</span>
                        <span className="text-slate-200">{activeStory.asA}</span>
                      </div>
                      <div>
                        <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] mr-2">I want to:</span>
                        <span className="text-slate-200">{activeStory.iWantTo}</span>
                      </div>
                      <div>
                        <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] mr-2">So that:</span>
                        <span className="text-slate-200">{activeStory.soThat}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acceptance Criteria</h4>
                    <ul className="space-y-2.5">
                      {activeStory.criteria.map((c, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-indigo-500 mt-0.5"><i className="fas fa-check-circle"></i></span>
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Story Points</span>
                      <span className="text-slate-200 font-mono text-sm font-bold">{activeStory.points} SP</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</span>
                      <span className="text-slate-200 text-xs font-bold">{activeStory.priority}</span>
                    </div>
                  </div>

                  {activeStory.techNotes && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technical Implementation Notes</h4>
                      <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-400 leading-relaxed">
                        {activeStory.techNotes}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 pt-4 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mr-2">Export Board:</span>
                    <button 
                      onClick={handleExportPDF}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 shadow cursor-pointer"
                    >
                      <i className="far fa-file-pdf"></i>
                      <span>PDF</span>
                    </button>
                    <button 
                      onClick={handleExportExcel}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-green-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 shadow cursor-pointer"
                    >
                      <i className="far fa-file-excel"></i>
                      <span>Excel</span>
                    </button>
                    <button 
                      onClick={handleExportMarkdown}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1 shadow cursor-pointer"
                    >
                      <i className="fab fa-markdown"></i>
                      <span>Markdown</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Story modal overlay */}
      {editModalStory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel max-w-lg w-full mx-4 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center">
                <i className="fas fa-edit mr-2 text-indigo-400"></i> Edit Story: {editModalStory.id}
              </h3>
              <button 
                onClick={() => setEditModalStory(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                <input 
                  type="text" 
                  value={editModalStory.title}
                  onChange={(e) => setEditModalStory({ ...editModalStory, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 border border-slate-800 rounded-xl">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">As A</label>
                  <input 
                    type="text" 
                    value={editModalStory.asA}
                    onChange={(e) => setEditModalStory({ ...editModalStory, asA: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">I Want To</label>
                  <input 
                    type="text" 
                    value={editModalStory.iWantTo}
                    onChange={(e) => setEditModalStory({ ...editModalStory, iWantTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">So That</label>
                  <input 
                    type="text" 
                    value={editModalStory.soThat}
                    onChange={(e) => setEditModalStory({ ...editModalStory, soThat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Acceptance Criteria (Semicolon separated)</label>
                <textarea 
                  value={editModalStory.criteria.join('; ')}
                  onChange={(e) => setEditModalStory({ ...editModalStory, criteria: e.target.value.split(';').map(x => x.trim()).filter(Boolean) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 h-24 resize-none custom-scroll"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Story Points</label>
                  <input 
                    type="number" 
                    value={editModalStory.points}
                    onChange={(e) => setEditModalStory({ ...editModalStory, points: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                  <select 
                    value={editModalStory.priority}
                    onChange={(e) => setEditModalStory({ ...editModalStory, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Technical Implementation Notes</label>
                <input 
                  type="text" 
                  value={editModalStory.techNotes}
                  onChange={(e) => setEditModalStory({ ...editModalStory, techNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 font-mono"
                />
              </div>

              {/* Collapsible Parent Specification Edit Box Inside Edit Story Modal */}
              {isParentDriftInModalOpen && (
                <div className="p-3 bg-slate-950 border-2 border-amber-500/50 rounded-xl space-y-2 text-xs animate-fade-in my-2">
                  <div className="flex justify-between items-center text-amber-300 font-bold">
                    <span className="flex items-center space-x-1.5 text-xs">
                      <i className="fas fa-edit text-amber-400"></i>
                      <span>Propose Parent Specification Modification</span>
                    </span>
                    <button onClick={() => setIsParentDriftInModalOpen(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Input changes needed in the parent specification file. Submitting this will mark the parent specification as <span className="text-amber-400 font-bold uppercase">DRIFTED</span> in Spec Registry.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <textarea
                      rows={2}
                      value={parentDriftTextInModal}
                      onChange={(e) => setParentDriftTextInModal(e.target.value)}
                      placeholder="E.g. Require 2FA for all vendor invoice payments exceeding $10,000..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitModalParentDrift}
                      disabled={!parentDriftTextInModal.trim()}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 self-end sm:self-stretch shadow-md"
                    >
                      <i className="fas fa-flag text-xs"></i>
                      <span>Submit & Flag Drifted</span>
                    </button>
                  </div>
                </div>
              )}

              {driftSuccessModalMsg && (
                <div className="p-2 bg-amber-950 border border-amber-700 rounded-lg text-amber-300 text-xs font-bold flex items-center space-x-1.5 animate-fade-in">
                  <i className="fas fa-check-circle text-amber-400"></i>
                  <span>{driftSuccessModalMsg}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2.5 pt-3 border-t border-slate-800 justify-between items-center">
              <button 
                type="button"
                onClick={() => setIsParentDriftInModalOpen(!isParentDriftInModalOpen)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center space-x-1.5 shadow-md ${
                  isParentDriftInModalOpen 
                    ? 'bg-amber-600 text-white border-amber-500' 
                    : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 hover:text-white border-amber-700/60'
                }`}
                title="Propose modifications to the parent specification file"
              >
                <i className="fas fa-pen-to-square text-xs"></i>
                <span>{isParentDriftInModalOpen ? 'Close Spec Edit' : 'Edit Parent Spec'}</span>
              </button>

              <div className="flex space-x-2">
                <button 
                  onClick={() => setEditModalStory(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveModalEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-lg border border-indigo-500/30 transition cursor-pointer"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
