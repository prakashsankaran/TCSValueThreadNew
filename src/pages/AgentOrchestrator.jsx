import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageContext } from '../context/PageContext';

export default function AgentOrchestrator() {
  const navigate = useNavigate();
  const { loadSavedOutputs } = usePageContext();
  const [activeSpec, setActiveSpec] = useState('');
  const [threadId, setThreadId] = useState(localStorage.getItem('orchestrator_thread_id') || '');
  const [graphState, setGraphState] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  const stagesOrder = [
    { key: 'spec-to-story', label: 'Spec to Story', icon: 'fas fa-exchange-alt' },
    { key: 'user-stories', label: 'User Stories', icon: 'fas fa-clipboard-list' },
    { key: 'ux-wireframe', label: 'UX Wireframe', icon: 'fas fa-desktop' },
    { key: 'functional-spec', label: 'Functional Spec', icon: 'fas fa-file-invoice' },
    { key: 'tech-architecture', label: 'Tech Architecture', icon: 'fas fa-sitemap' },
    { key: 'database-design', label: 'Database Design', icon: 'fas fa-database' },
    { key: 'test-cases', label: 'Test Cases', icon: 'fas fa-tasks' }
  ];

  useEffect(() => {
    fetch('http://localhost:7001/api/specs/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setActiveSpec(data.activeSpec);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!threadId) return;

    let stopped = false;

    const pollStatus = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`http://localhost:7001/api/orchestrator/status/${threadId}`);

        if (res.status === 404) {
          stopped = true;
          clearInterval(interval);
          setSessionExpired(true);
          setThreadId('');
          localStorage.removeItem('orchestrator_thread_id');
          return;
        }

        const data = await res.json();
        if (data.success && data.state) {
          setGraphState(data.state);
          setSessionExpired(false);
          loadSavedOutputs();
        }
      } catch (err) {
        if (err.message && err.message.includes('Failed to fetch')) {
          console.warn('[Orchestrator] Server unreachable — will retry on next poll.');
        } else {
          console.error('Failed to poll orchestrator status:', err);
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 4000);
    return () => { stopped = true; clearInterval(interval); };
  }, [threadId]);

  const handleStartOrchestrator = async () => {
    if (!activeSpec || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch('http://localhost:7001/api/orchestrator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSpec })
      });
      const data = await res.json();
      if (data.success) {
        setThreadId(data.threadId);
        setGraphState(data.state);
        localStorage.setItem('orchestrator_thread_id', data.threadId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleReviewResponse = async (action) => {
    if (!threadId || isResponding || !graphState) return;
    setIsResponding(true);

    const currentStage = graphState.currentStage || 'functional-spec';
    try {
      const res = await fetch('http://localhost:7001/api/orchestrator/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          stage: currentStage,
          action,
          feedbackText: action === 'reject' ? feedbackText : ''
        })
      });
      const data = await res.json();
      if (data.success && data.state) {
        setGraphState(data.state);
        setFeedbackText('');
        if (action === 'approve') {
          loadSavedOutputs();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResponding(false);
    }
  };

  const handleResetThread = async () => {
    try {
      if (threadId) {
        await fetch('http://localhost:7001/api/orchestrator/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId })
        });
      }
    } catch (err) {
      console.error('Failed to reset orchestrator session:', err);
    } finally {
      setThreadId('');
      setGraphState(null);
      setSessionExpired(false);
      localStorage.removeItem('orchestrator_thread_id');
      loadSavedOutputs();
    }
  };

  const getStageStatus = (stageKey) => {
    if (stageKey === 'completed') return 'completed';
    if (!graphState) return 'pending';
    
    if (graphState.approvalStatus[stageKey] === 'approved') return 'approved';
    if (graphState.approvalStatus[stageKey] === 'rejected') return 'rejected';
    
    if (graphState.currentStage === stageKey) {
      if (graphState.results[stageKey] !== undefined && graphState.results[stageKey] !== null && graphState.results[stageKey] !== '') {
        return 'pending_review';
      }
      return 'running';
    }
    
    if (graphState.results[stageKey] !== undefined && graphState.results[stageKey] !== null) {
      return 'pending_review';
    }
    
    return 'pending';
  };

  const currentStage = graphState?.currentStage || 'spec-to-story';
  const isStageAwaitingReview = graphState && graphState.results[currentStage] && graphState.approvalStatus[currentStage] !== 'approved';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
            <i className="fas fa-project-diagram text-indigo-500 mr-3"></i> LangGraph Orchestrator Agent
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Central orchestration board powered by LangGraph. Routes compilation tasks dynamically using the Selector Agent and gates key phases for Human-in-the-Loop verification.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {sessionExpired && (
            <span className="text-[10px] px-3 py-1.5 bg-amber-950/30 border border-amber-900/40 text-amber-400 font-bold rounded-xl flex items-center space-x-1.5">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Session expired after server restart. Please start a new session.</span>
            </span>
          )}
          {(graphState || threadId || sessionExpired) && (
            <button
              onClick={handleResetThread}
              className="px-4 py-2 bg-red-950/20 border border-red-900/50 text-red-400 hover:bg-red-900/10 hover:text-red-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Stop &amp; Reset Session
            </button>
          )}
          {!graphState && !sessionExpired && (
            <button
              onClick={handleStartOrchestrator}
              disabled={!activeSpec || isStarting}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting Orchestrator...' : 'Start Orchestration'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Pipeline Execution Plan</h3>
            <div className="space-y-3">
              {stagesOrder.map((stage) => {
                const status = getStageStatus(stage.key);
                const decision = graphState?.modelDecision[stage.key];
                
                return (
                  <div key={stage.key} className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        status === 'pending_review' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                        status === 'running' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        <i className={`${stage.icon} text-xs`}></i>
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-200">{stage.label}</p>
                        {decision && (
                          <p className="text-[9px] text-indigo-400 font-semibold truncate max-w-[170px]" title={decision.reasoning}>
                            {decision.model}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {status === 'approved' && (
                        <span className="text-[9px] px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 font-bold rounded-full">Approved</span>
                      )}
                      {status === 'rejected' && (
                        <span className="text-[9px] px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-full">Refining</span>
                      )}
                      {status === 'pending_review' && (
                        <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-full">Awaiting Review</span>
                      )}
                      {status === 'running' && (
                        <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold rounded-full">Processing</span>
                      )}
                      {status === 'pending' && (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 font-bold rounded-full">Queued</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center">
              <i className="fas fa-terminal mr-2 text-pink-500"></i> Execution log console
            </h3>
            
            <div className="bg-slate-950 font-mono text-[10px] p-3 rounded-xl border border-slate-900 h-64 overflow-y-auto custom-scroll flex flex-col space-y-1">
              {!graphState ? (
                <div className="text-slate-500 text-center py-20">Console idle. Start orchestration to view live traces.</div>
              ) : (
                graphState.logs.map((log, idx) => (
                  <div key={idx} className={`whitespace-pre-wrap ${
                    log.includes('[Error]') || log.includes('failed') ? 'text-red-400' :
                    log.includes('[Selector]') ? 'text-indigo-400 font-semibold' :
                    log.includes('[Generator]') ? 'text-emerald-400 font-medium' :
                    log.includes('[Gating]') ? 'text-amber-400' :
                    'text-slate-400'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {graphState ? (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 flex flex-col h-[670px] overflow-hidden">
              <div className="border-b border-slate-850 pb-4 mb-4 shrink-0 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase flex items-center">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full mr-2"></span> Orchestration Viewport
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active stage: <span className="text-indigo-400 font-bold capitalize font-mono">{currentStage.replace('-', ' ')}</span></p>
                </div>
                
                {graphState.modelDecision[currentStage] && (
                  <div className="text-right">
                    <span className="text-[9px] px-2 py-1 bg-indigo-950 border border-indigo-900 text-indigo-400 font-bold rounded-lg uppercase">
                      {graphState.modelDecision[currentStage].model}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[10px] text-slate-350 leading-relaxed custom-scroll relative mb-4">
                {currentStage === 'completed' ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 animate-bounce">
                      <i className="fas fa-check text-2xl"></i>
                    </div>
                    <div className="max-w-md space-y-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Orchestration Pipeline Completed!</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        All 8 software development specification stages have been processed, approved, and indexed in the Qdrant database.
                        Please navigate to the specific submenu dashboards in the sidebar to review and export the individual agent artifacts.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/spec-to-story')}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:shadow-lg transition cursor-pointer"
                    >
                      Go to Spec to Story Dashboard
                    </button>
                  </div>
                ) : getStageStatus(currentStage) === 'running' ? (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <i className="fas fa-circle-notch animate-spin text-indigo-500 text-lg"></i>
                      <span className="text-[10px] text-slate-400">Agent generating draft output...</span>
                    </div>
                  </div>
                ) : graphState.results[currentStage] ? (
                  currentStage === 'database-design' ? (
                    <div className="space-y-6 font-sans text-sm text-slate-300 p-2 overflow-y-auto h-full">
                      {graphState.results[currentStage].erd && (
                        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">ERD Diagram (Mermaid)</h4>
                          <pre className="bg-slate-950 p-3 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto select-all">{graphState.results[currentStage].erd}</pre>
                        </div>
                      )}
                      {graphState.results[currentStage].sql && (
                        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">SQL DDL Script</h4>
                          <pre className="bg-slate-950 p-3 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto select-all">{graphState.results[currentStage].sql}</pre>
                        </div>
                      )}
                      {graphState.results[currentStage].fsd && (
                        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl space-y-2 h-[500px] flex flex-col">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider shrink-0 font-sans">Database Design Document</h4>
                          <iframe
                            srcDoc={
                              graphState.results[currentStage].fsd.trim().startsWith('<')
                                ? `<!DOCTYPE html><html><head><style>body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 12px; margin: 0; } table { width: 100%; border-collapse: collapse; margin-top: 8px; } th, td { border: 1px solid #334155; padding: 6px; text-align: left; } th { background: #1e293b; }</style></head><body>${graphState.results[currentStage].fsd}</body></html>`
                                : `<!DOCTYPE html><html><head><style>body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 12px; margin: 0; white-space: pre-wrap; }</style></head><body>${graphState.results[currentStage].fsd}</body></html>`
                            }
                            className="w-full flex-1 border-0 rounded-lg bg-[#0f172a]"
                            title="Database Design Document Preview"
                          />
                        </div>
                      )}
                    </div>
                  ) : (currentStage === 'functional-spec' ||
                       (typeof graphState.results[currentStage] === 'string' && graphState.results[currentStage].startsWith('<!DOCTYPE')) ||
                       (graphState.results[currentStage] && typeof graphState.results[currentStage] === 'object' && typeof graphState.results[currentStage].html === 'string')
                  ) ? (
                    <iframe
                      srcDoc={typeof graphState.results[currentStage] === 'string' ? graphState.results[currentStage] : graphState.results[currentStage].html}
                      className="w-full h-full border-none bg-white rounded"
                      title="FSD Preview"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap">
                      {typeof graphState.results[currentStage] === 'string' 
                        ? graphState.results[currentStage] 
                        : JSON.stringify(graphState.results[currentStage], null, 2)}
                    </pre>
                  )
                ) : (
                  <div className="text-slate-500 text-center py-40">Awaiting agent execution results.</div>
                )}
              </div>

              {isStageAwaitingReview ? (
                <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl space-y-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Human-In-The-Loop Quality Gate</h4>
                  </div>
                  <p className="text-[10px] text-slate-400">Review the generated draft enqueued above. You can either approve and trigger the next pipeline agent, or provide feedback comments to refine the output.</p>
                  
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Add refinement feedback..."
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200 outline-none placeholder-slate-600"
                    />
                    
                    <button
                      onClick={() => handleReviewResponse('reject')}
                      disabled={isResponding || !feedbackText.trim()}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Refine Draft
                    </button>
                    
                    <button
                      onClick={() => handleReviewResponse('approve')}
                      disabled={isResponding}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:from-green-500 hover:to-green-400 transition cursor-pointer disabled:opacity-50"
                    >
                      Approve & Proceed
                    </button>
                  </div>
                </div>
              ) : (
                graphState.approvalStatus[currentStage] === 'approved' && (
                  <div className="bg-green-950/20 border border-green-950 p-3 rounded-xl flex items-center justify-between shrink-0">
                    <span className="text-xs text-green-400 font-bold flex items-center">
                      <i className="fas fa-check-circle mr-2"></i> Stage Approved! Proceeding in background...
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center h-[670px] border-dashed">
              <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
                <i className="fas fa-project-diagram text-2xl"></i>
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Multi-Agent Workflow Viewport</h3>
              <p className="text-[10px] text-slate-500 mt-2 max-w-sm leading-relaxed">
                Click **"Start Orchestration"** at the top right. 
                The LangGraph orchestrator will trigger sequential agent processing and highlight selector model routing decisions here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
