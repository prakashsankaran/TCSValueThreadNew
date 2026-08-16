import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdfGenerator } from '../utils/pdfGenerator';
import { ConfluencePublishModal } from '../components/ConfluencePublishModal';

const BOARD_MEMBERS = [
  { id: 'architect', name: 'Software Architect', role: 'System & Stack Alignment', icon: 'fa-project-diagram', color: 'indigo', desc: 'Audits modular structures, tech stack alignments, and interfaces.' },
  { id: 'security', name: 'Security Architect', role: 'OWASP & Data Isolation', icon: 'fa-user-shield', color: 'red', desc: 'Verifies authorization, RBAC rules, and vector data leaking risks.' },
  { id: 'performance', name: 'Performance Engineer', role: 'Scalability & Caching', icon: 'fa-tachometer-alt', color: 'emerald', desc: 'Evaluates asynchronous queues, caching, and worker pools.' },
  { id: 'cost', name: 'FinOps Engineer', role: 'API & Compute Budgets', icon: 'fa-coins', color: 'amber', desc: 'Estimates LLM operational costs and API budget restrictions.' },
  { id: 'product_owner', name: 'Product Owner', role: 'Requirements Coverage', icon: 'fa-tasks', color: 'blue', desc: 'Cross-verifies requirements coverages and user story completion.' },
  { id: 'devil_advocate', name: "Devil's Advocate", role: 'Unstated Risks & Edge Cases', icon: 'fa-balance-scale-right', color: 'rose', desc: 'Identifies implicit logic assumptions and failures under load.' },
  { id: 'data_architect', name: 'Data Architect', role: 'Data Models & Sharding', icon: 'fa-database', color: 'cyan', desc: 'Audits Postgres schemas, Qdrant indexes, and data consistency.' },
  { id: 'devops', name: 'DevOps Engineer', role: 'CI/CD & Scaling Gate', icon: 'fa-server', color: 'violet', desc: 'Checks Docker parameters, environment files, and KEDA configurations.' },
  { id: 'compliance', name: 'Compliance Auditor', role: 'GDPR & Consent Framework', icon: 'fa-file-contract', color: 'teal', desc: 'Ensures data protection policies, PII-masking, and audit logs.' }
];

export default function ValidatorAgent() {
  const navigate = useNavigate();
  const [activeSpec, setActiveSpec] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [report, setReport] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isConfluenceModalOpen, setIsConfluenceModalOpen] = useState(false);

  const [humanApprovalStatus, setHumanApprovalStatus] = useState('PENDING');
  const [sessionId, setSessionId] = useState('');
  const [humanComments, setHumanComments] = useState('');
  const [aiConfidence, setAiConfidence] = useState(null);
  const [risksCount, setRisksCount] = useState(0);

  const [boardStep, setBoardStep] = useState(0);
  const [activeMember, setActiveMember] = useState(null);
  const [memberStatuses, setMemberStatuses] = useState({});
  const [memberVotes, setMemberVotes] = useState({});
  const [liveLogs, setLiveLogs] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const consoleEndRef = useRef(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs]);

  const extractStatsFromReport = (reportText) => {
    if (!reportText) return { confidence: 95, risks: 0 };
    const confMatch = reportText.match(/Confidence(?:\s+Score)?\s*:\s*(\d{1,3})%/i);
    const confidence = confMatch ? parseInt(confMatch[1], 10) : 95;
    const risksMatch = reportText.match(/- \*\*Risk\*\*/gi);
    const risks = risksMatch ? risksMatch.length : 0;
    return { confidence, risks };
  };

  const updateStats = (data) => {
    if (data.session_id) setSessionId(data.session_id);
    if (data.human_approval_status) {
      setHumanApprovalStatus(data.human_approval_status);
    } else if (data.approved) {
      setHumanApprovalStatus('APPROVED');
    } else {
      setHumanApprovalStatus('PENDING');
    }
    if (data.report) {
      const stats = extractStatsFromReport(data.report);
      setAiConfidence(stats.confidence);
      setRisksCount(stats.risks);
    }
  };

  useEffect(() => {
    const fetchActiveSpecAndStatus = async () => {
      try {
        const specRes = await fetch('http://localhost:7001/api/specs/active');
        const specData = await specRes.json();
        if (specData.success && specData.activeSpec) {
          setActiveSpec(specData.activeSpec);
          
          const statusRes = await fetch(`http://localhost:7001/api/specs/validate/status/${encodeURIComponent(specData.activeSpec)}`);
          const statusData = await statusRes.json();
          if (statusData.success) {
            setReport(statusData.report);
            setIsApproved(statusData.approved);
            updateStats(statusData);
          }
        }
      } catch (err) {
        console.error('Failed to initialize Validator:', err);
        setError('Failed to connect to the backend server.');
      }
    };
    fetchActiveSpecAndStatus();
  }, []);

  const handleValidate = async () => {
    if (!activeSpec) return;
    setIsValidating(true);
    setError('');

    const initialStatuses = {};
    BOARD_MEMBERS.forEach(m => { initialStatuses[m.id] = 'idle'; });
    setMemberStatuses(initialStatuses);
    setMemberVotes({});
    setActiveMember(null);
    setOverallProgress(0);
    setBoardStep(1);
    setLiveLogs(['[System] Initializing AI Specification Review Board (AI-SRB) Governance Layer...']);

    let pollIntervalId;
    const startPolling = () => {
      pollIntervalId = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:7001/api/specs/validate/progress/${encodeURIComponent(activeSpec)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'running') {
            if (data.logs && data.logs.length > 0) setLiveLogs(data.logs);
            if (data.step) setBoardStep(data.step);
            if (data.progress !== undefined) setOverallProgress(data.progress);
            if (data.activeMember !== undefined) setActiveMember(data.activeMember);
            if (data.statuses) setMemberStatuses(data.statuses);
            if (data.votes) setMemberVotes(data.votes);
          } else if (data.status === 'completed') {
            clearInterval(pollIntervalId);
            if (data.logs) setLiveLogs(data.logs);
            setReport(data.report || '');
            setIsApproved(data.approved || false);
            setHumanApprovalStatus(data.human_approval_status || (data.approved ? 'APPROVED' : 'PENDING'));
            updateStats(data);
            setBoardStep(9);
            setOverallProgress(100);
            setIsValidating(false);
          } else if (data.status === 'failed') {
            clearInterval(pollIntervalId);
            setError(data.error || 'Validation failed.');
            setIsValidating(false);
            setBoardStep(0);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 1000);
    };

    startPolling();

    try {
      const response = await fetch('http://localhost:7001/api/specs/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder: activeSpec })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        clearInterval(pollIntervalId);
        if (data.log) setLiveLogs(data.log);
        setReport(data.report);
        setIsApproved(data.approved);
        const statusRes = await fetch(`http://localhost:7001/api/specs/validate/status/${encodeURIComponent(activeSpec)}`);
        const statusData = await statusRes.json();
        if (statusData.success) {
          updateStats(statusData);
        }
        setBoardStep(9);
        setOverallProgress(100);
        setIsValidating(false);
      } else {
        throw new Error(data.error || 'Validation execution failed.');
      }
    } catch (err) {
      console.warn('Validate API request finished with status/error:', err.message);
    }
  };

  const handleHumanDecision = async (decision) => {
    if (!activeSpec || !sessionId) return;
    setIsApproving(true);
    setError('');
    try {
      const response = await fetch('http://localhost:7001/api/specs/validate/human-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder: activeSpec,
          session_id: sessionId,
          decision,
          comments: humanComments,
          user: 'Lead Enterprise Architect'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setLiveLogs(prev => [...prev, `[System] Submitted human decision: ${decision}. comments: "${humanComments || ''}".`]);
        setHumanApprovalStatus(decision);
        
        if (decision === 'APPROVED') {
          setIsValidating(true);
          const pollIntervalId = setInterval(async () => {
            try {
              const res = await fetch(`http://localhost:7001/api/specs/validate/progress/${encodeURIComponent(activeSpec)}`);
              if (!res.ok) return;
              const data = await res.json();
              if (data.status === 'completed') {
                clearInterval(pollIntervalId);
                setReport(data.report || '');
                setIsApproved(true);
                setHumanApprovalStatus('APPROVED');
                setIsValidating(false);
                setOverallProgress(100);
                setBoardStep(9);
              }
            } catch (e) {
              console.error(e);
            }
          }, 1000);
        } else if (decision === 'CHANGES_REQUESTED') {
          setIsValidating(true);
          setOverallProgress(50);
          setBoardStep(4);
          
          const pollIntervalId = setInterval(async () => {
            try {
              const res = await fetch(`http://localhost:7001/api/specs/validate/progress/${encodeURIComponent(activeSpec)}`);
              if (!res.ok) return;
              const data = await res.json();
              if (data.logs && data.logs.length > 0) setLiveLogs(data.logs);
              if (data.step) setBoardStep(data.step);
              if (data.progress !== undefined) setOverallProgress(data.progress);
              if (data.activeMember !== undefined) setActiveMember(data.activeMember);
              if (data.statuses) setMemberStatuses(data.statuses);
              if (data.votes) setMemberVotes(data.votes);

              if (data.status === 'completed') {
                clearInterval(pollIntervalId);
                setReport(data.report || '');
                setIsApproved(data.approved || false);
                setHumanApprovalStatus(data.human_approval_status || 'PENDING');
                setIsValidating(false);
                setOverallProgress(100);
                setBoardStep(9);
              }
            } catch (e) {
              console.error(e);
            }
          }, 1000);
        } else {
          setIsApproved(false);
          setIsApproving(false);
        }
      } else {
        throw new Error(data.error || 'Failed to submit human decision.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleApprove = async () => {
    if (!activeSpec) return;
    setIsApproving(true);
    try {
      const response = await fetch('http://localhost:7001/api/specs/validate/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder: activeSpec })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsApproved(true);
        navigate('/orchestrator');
      } else {
        throw new Error(data.error || 'Failed to approve validation.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const styledHtml = `
      <div style="padding: 10px;">
        <h1>Architecture Validation & Model Recommendation Report</h1>
        <p style="font-size: 12px; color: #64748b; margin-top: -10px; margin-bottom: 20px;">Workspace Folder: ${activeSpec}</p>
        ${parseMarkdown(report)}
      </div>
    `;
    pdfGenerator.download('Specification_Validation_Report.pdf', styledHtml);
  };

  const parseMarkdown = (md) => {
    if (!md) return '';
    let html = md;
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-base font-bold text-white border-b border-slate-800 pb-2 mt-6 mb-3 uppercase tracking-wider">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-sm font-bold text-indigo-400 mt-5 mb-2.5 uppercase tracking-wide">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xs font-bold text-slate-200 mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300 font-bold">$1</strong>');
    html = html.replace(/```markdown([\s\S]*?)```/g, '<pre class="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-300 my-4 overflow-auto">$1</pre>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-indigo-300 my-4 overflow-auto">$1</pre>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-900 font-mono text-[9px] text-indigo-400 font-semibold">$1</code>');
    html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc text-slate-300 py-0.5">$1</li>');
    html = html.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc text-slate-300 py-0.5">$1</li>');
    html = html.replace(/\n/g, '<br/>');
    return html;
  };

  const getLogPrefixColor = (log) => {
    if (log.startsWith('[System]')) return 'text-purple-400 font-semibold';
    if (log.startsWith('[Selector]')) return 'text-blue-400';
    if (log.startsWith('[Moderator]')) return 'text-amber-400 font-bold';
    if (log.startsWith('[Editor]')) return 'text-indigo-400 font-semibold';
    if (log.startsWith('[Validation]')) return 'text-teal-400 font-semibold';
    if (log.startsWith('[CEO Agent]')) return 'text-rose-400 font-bold';
    return 'text-slate-300';
  };

  const getStepDetails = () => {
    switch (boardStep) {
      case 1:
        return { label: 'SELECTION', desc: 'Assembling Panel & Dynamic Triggers', icon: 'fa-user-tag text-blue-400' };
      case 2:
        return { label: 'ROUND 0: READ', desc: 'Distributing Draft & Historical Lessons', icon: 'fa-book-reader text-indigo-400' };
      case 3:
        return { label: 'ROUND 1: PANELS', desc: 'Running Independent Specialist Audits', icon: 'fa-microchip text-amber-400' };
      case 4:
        return { label: 'ROUND 2: DEBATES', desc: 'Challenging & Defending Design Gaps', icon: 'fa-comments text-purple-400' };
      case 5:
        return { label: 'ROUND 3: GAVEL', desc: 'Synthesizing Consensus & Conflict Matrix', icon: 'fa-gavel text-amber-500' };
      case 6:
        return { label: 'SPEC EDITING', desc: 'Compiling Revisions to spec_v2.md', icon: 'fa-file-signature text-indigo-400' };
      case 7:
        return { label: 'VALIDATION', desc: 'Auditing spec_v2 against Backlog Check', icon: 'fa-clipboard-check text-teal-400' };
      case 8:
        return { label: 'CEO STAMP', desc: 'Evaluating Cost & Financial Feasibility', icon: 'fa-signature text-rose-400' };
      default:
        return { label: 'BOARD RUNNING', desc: 'Executing Multi-Agent Governance Run', icon: 'fa-cog fa-spin text-slate-400' };
    }
  };

  const getMemberStyles = (member, isActive, status) => {
    if (isActive) {
      return { border: 'border-indigo-500/80 shadow-lg bg-slate-900/60', badge: 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/30', dot: 'bg-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' };
    }
    if (status === 'thinking') {
      return { border: 'border-amber-500/40 bg-slate-900/20', badge: 'bg-amber-950/30 text-amber-400 border border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    }
    if (status === 'done') {
      return { border: 'border-emerald-500/30 bg-slate-950/10', badge: 'bg-emerald-950/20 text-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    }
    return { border: 'border-slate-800 bg-slate-950/20 opacity-40 hover:opacity-80', badge: 'bg-slate-900 text-slate-500', dot: 'bg-slate-600', text: 'text-slate-400', bg: 'bg-slate-500/10' };
  };

  const renderMemberCard = (member) => {
    const status = memberStatuses[member.id] || 'idle';
    const vote = memberVotes[member.id];
    const isActive = activeMember === member.id;
    const s = getMemberStyles(member, isActive, status);

    return (
      <div key={member.id} className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[120px] ${s.border}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.text} text-xs border border-slate-800`}>
              <i className={`fas ${member.icon}`}></i>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-200 leading-tight">{member.name}</h4>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider">{member.role}</p>
            </div>
          </div>
          <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center ${s.badge}`}>
            <span className={`w-1 h-1 rounded-full ${s.dot} mr-1`}></span>
            {status}
          </span>
        </div>

        <p className="text-[8px] text-slate-400 leading-normal line-clamp-2 my-1.5">{member.desc}</p>

        {vote && (
          <div className={`mt-auto text-[7px] font-bold uppercase tracking-wider py-1 rounded border text-center ${
            vote === 'APPROVED' 
              ? 'bg-green-950/30 border-green-800/40 text-green-400' 
              : vote === 'APPROVED WITH CONDITIONS' 
              ? 'bg-amber-950/30 border-amber-800/40 text-amber-400' 
              : 'bg-red-950/30 border-red-800/40 text-red-400'
          }`}>
            Decision: {vote}
          </div>
        )}
      </div>
    );
  };

  const stepDetails = getStepDetails();

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
            <i className="fas fa-shield-alt text-indigo-500 mr-3"></i> Spec & Tech Stack Validator Agent
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Cross-verifies the SpecKit files against original functional requirements, evaluates architectural technology alignments, and recommends ideal LLM/SLM sub-agent orchestrations.
          </p>
        </div>
        {activeSpec && (
          <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-2 text-xs">
            <i className="fas fa-folder text-amber-500"></i>
            <span className="font-mono text-slate-300 font-bold">{activeSpec}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/60 p-4 rounded-2xl text-red-400 text-xs flex items-start space-x-2.5 max-w-2xl">
          <i className="fas fa-exclamation-triangle mt-0.5 shrink-0 text-red-500"></i>
          <div>
            <p className="font-bold">System Error</p>
            <p className="leading-normal mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {isValidating ? (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 bg-slate-950/20 relative">
          
          <div className="flex flex-col space-y-2 border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-3 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-2"></span>
                  AI-SRB Active Agentic Boardroom Run
                </h3>
                <p className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                  Pipeline Stage {boardStep}/8: {stepDetails.label}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-300">{overallProgress}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                const isPassed = boardStep > s;
                const isCurr = boardStep === s;
                return (
                  <div key={s} className="flex-1 flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition ${
                      isPassed 
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-400' 
                        : isCurr 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse scale-110' 
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}>
                      {s}
                    </div>
                    {s < 8 && (
                      <div className={`flex-1 h-0.5 mx-1 transition ${
                        isPassed ? 'bg-indigo-500' : isCurr ? 'bg-gradient-to-r from-amber-500 to-slate-800' : 'bg-slate-800'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 h-[440px] items-center">
            
            <div className="space-y-4 col-span-1">
              {renderMemberCard(BOARD_MEMBERS[0])}
              {renderMemberCard(BOARD_MEMBERS[1])}
              {renderMemberCard(BOARD_MEMBERS[6])}
            </div>

            <div className="col-span-2 flex flex-col items-center justify-between h-full py-4 bg-slate-950/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-inner">
              <div className="flex space-x-4 w-full">
                <div className="flex-1">{renderMemberCard(BOARD_MEMBERS[4])}</div>
                <div className="flex-1">{renderMemberCard(BOARD_MEMBERS[3])}</div>
              </div>

              <div className="my-auto text-center relative flex flex-col items-center justify-center h-[160px] w-full">
                <div className="absolute w-24 h-24 rounded-full border border-indigo-500/10 animate-ping"></div>
                <div className="absolute w-36 h-36 rounded-full border border-purple-500/5 animate-pulse"></div>
                <div className="absolute w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg z-10">
                  <i className={`fas ${stepDetails.icon} text-lg`}></i>
                </div>

                <div className="mt-20 z-10 text-center space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center justify-center">
                    {stepDetails.label}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed max-w-[240px]">{stepDetails.desc}</p>
                </div>
              </div>

              <div className="flex justify-center w-full">
                <div className="w-1/2">{renderMemberCard(BOARD_MEMBERS[5])}</div>
              </div>
            </div>

            <div className="space-y-4 col-span-1">
              {renderMemberCard(BOARD_MEMBERS[2])}
              {renderMemberCard(BOARD_MEMBERS[7])}
              {renderMemberCard(BOARD_MEMBERS[8])}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <i className="fas fa-terminal mr-1"></i> AI-SRB ACTIVE CONSOLE LOGS
              </span>
            </div>
            <div className="h-32 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] overflow-y-auto custom-scroll space-y-1">
              {liveLogs.map((log, index) => (
                <div key={index} className={`leading-normal border-l-2 pl-2 border-slate-800 ${getLogPrefixColor(log)}`}>
                  {log}
                </div>
              ))}
              <div ref={consoleEndRef}></div>
            </div>
          </div>

        </div>
      ) : !report ? (
        <div className="glass-panel max-w-2xl mx-auto p-8 rounded-2xl border border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-500/5 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-indigo-500/10 shadow-lg">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Validation Report Required</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No validation scan has been executed for this specification folder yet. Trigger the validation model to analyze files, verify dependencies, and generate LLM sub-agent cards.
            </p>
          </div>
          <button 
            onClick={handleValidate}
            disabled={isValidating || !activeSpec}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl border border-indigo-500/20 shadow-lg flex items-center space-x-2 mx-auto transition cursor-pointer"
          >
            <i className="fas fa-shield-alt"></i>
            <span>Run Spec & Tech Stack Audit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-230px)] overflow-hidden">
          <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800 shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-3 bg-indigo-500 rounded-full mr-2"></span> Architecture Audit Report
                </h2>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Dual-Model Verification Summary</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsConfluenceModalOpen(true)}
                  disabled={isValidating || !report}
                  className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-900/60 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fab fa-confluence"></i>
                  <span>Confluence</span>
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isValidating || !report}
                  className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-900/60 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fas fa-file-pdf"></i>
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {isValidating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-redo"></i>}
                  <span>Re-audit Spec</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto custom-scroll bg-slate-950/40 relative">
              {isValidating && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center space-y-2">
                    <i className="fas fa-circle-notch animate-spin text-indigo-500 text-xl"></i>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Running Audit Scan...</span>
                  </div>
                </div>
              )}
              <div 
                className="validation-document text-xs leading-relaxed text-slate-300 space-y-4"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(report) }}
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800 shadow-xl p-5 space-y-4 justify-between bg-slate-900/10">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Human-In-The-Loop Review</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Approve findings or iterate on requirements specs</p>
              </div>

              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                isApproved 
                  ? 'bg-green-950/10 border-green-800/40 text-green-400' 
                  : humanApprovalStatus === 'PENDING'
                    ? 'bg-orange-950/10 border-orange-850/40 text-orange-400'
                    : humanApprovalStatus === 'CHANGES_REQUESTED'
                      ? 'bg-yellow-950/10 border-yellow-800/40 text-yellow-400'
                      : 'bg-red-950/10 border-red-800/40 text-red-450'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isApproved ? 'bg-green-500/10' : 'bg-orange-500/10'
                }`}>
                  <i className={`fas ${isApproved ? 'fa-check' : 'fa-clock'} text-xs`}></i>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {isApproved ? 'Approved & Ready' : `Gate Status: ${humanApprovalStatus}`}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    {isApproved 
                      ? 'The spec validation has been signed off. You can proceed directly to orchestrating the sub-agent pipeline.' 
                      : humanApprovalStatus === 'PENDING'
                        ? 'AI CEO Approval has completed. Awaiting final human verification and release authorization.'
                        : humanApprovalStatus === 'CHANGES_REQUESTED'
                          ? 'Changes requested. The debate loop-back has targeted relevant reviewer agents.'
                          : 'Design is currently rejected or escalated for manual override.'}
                  </p>
                </div>
              </div>

              {report && (
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">AI Confidence</span>
                    <span className="text-base font-bold text-indigo-400 mt-1">{aiConfidence || 95}%</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">Board Risks</span>
                    <span className="text-base font-bold text-red-400 mt-1">{risksCount || 0} Identified</span>
                  </div>
                </div>
              )}

              {report && humanApprovalStatus === 'PENDING' && (
                <div className="space-y-3 bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl shrink-0">
                  <p className="text-xs font-bold text-slate-200">Human Architecture Gate Decision:</p>
                  
                  <textarea
                    value={humanComments}
                    onChange={(e) => setHumanComments(e.target.value)}
                    placeholder="Enter review comments or changes requested notes..."
                    className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleHumanDecision('APPROVED')}
                      disabled={isApproving}
                      className="py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Approve Spec
                    </button>
                    <button
                      onClick={() => handleHumanDecision('CHANGES_REQUESTED')}
                      disabled={isApproving || !humanComments.trim()}
                      className="py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleHumanDecision('REJECTED')}
                      disabled={isApproving}
                      className="py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Reject Spec
                    </button>
                    <button
                      onClick={() => handleHumanDecision('ESCALATED')}
                      disabled={isApproving}
                      className="py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Escalate Spec
                    </button>
                  </div>
                </div>
              )}

              {report && humanApprovalStatus !== 'PENDING' && (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <p><span className="font-bold text-slate-200">Decision: </span>
                    <span className={`font-bold uppercase ${
                      humanApprovalStatus === 'APPROVED' ? 'text-green-400' :
                      humanApprovalStatus === 'CHANGES_REQUESTED' ? 'text-yellow-400' :
                      humanApprovalStatus === 'REJECTED' ? 'text-red-400' : 'text-purple-400'
                    }`}>
                      {humanApprovalStatus}
                    </span>
                  </p>
                  {humanComments && <p className="text-[10px] text-slate-500 italic mt-1">Comments: "{humanComments}"</p>}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4 shrink-0">
              <button 
                onClick={() => navigate('/requirements')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <i className="fas fa-edit"></i>
                <span>Edit Specifications</span>
              </button>

              <button 
                onClick={handleApprove}
                disabled={isApproving || !isApproved}
                className={`w-full py-2.5 text-white text-xs font-bold rounded-xl shadow-lg border border-indigo-500/30 transition flex items-center justify-center space-x-2 cursor-pointer ${
                  isApproved 
                    ? 'bg-green-600 hover:bg-green-500' 
                    : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed'
                }`}
              >
                {isApproving ? (
                  <>
                    <i className="fas fa-circle-notch animate-spin"></i>
                    <span>Signing off spec...</span>
                  </>
                ) : isApproved ? (
                  <>
                    <i className="fas fa-arrow-right"></i>
                    <span>Proceed to SDLC Generation</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-thumbs-up"></i>
                    <span>Awaiting Gate Decision</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      <ConfluencePublishModal 
        isOpen={isConfluenceModalOpen} 
        onClose={() => setIsConfluenceModalOpen(false)} 
        stageType="validator" 
        onSuccess={(msg) => alert(msg)} 
        onError={(err) => alert(err)} 
      />
    </div>
  );
}
