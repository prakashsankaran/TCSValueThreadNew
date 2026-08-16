import React, { useState, useEffect, useRef } from 'react';
import { LAYER0_INPUT_TYPES, LAYER0_PERSONAS, INTELLIGENCE_TIERS } from '../agents/layer0Agents';
import { layer0Service } from '../services/layer0Service';
import { evidenceService } from '../services/evidenceService';
import SignalInbox from '../components/SignalInbox';
import SignalBrowserDrawer from '../components/SignalBrowserDrawer';

export default function Layer0IdeaDiscovery() {
  const [activeSubNav, setActiveSubNav] = useState('discovery'); // 'discovery' | 'inbox'
  const [ideas, setIdeas] = useState([]);
  const [activeIdeaId, setActiveIdeaId] = useState('');
  const [currentIdeaState, setCurrentIdeaState] = useState(null);

  // Intake Form state
  const [rawInput, setRawInput] = useState('');
  const [inputType, setInputType] = useState('IDEA');
  const [title, setTitle] = useState('');
  const [ingestionChannel, setIngestionChannel] = useState('DIRECT_TEXT');
  
  // Connector & Signal Drawer State
  const [connectorStatus, setConnectorStatus] = useState('CONNECTED');
  const [availableSignalsCount, setAvailableSignalsCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date().toLocaleTimeString());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('ALL');
  const fileInputRef = useRef(null);
  
  // Persona Submitter selection state
  const [selectedPersona, setSelectedPersona] = useState('Delivery Manager');
  const [customPersona, setCustomPersona] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [intakeSubTab, setIntakeSubTab] = useState('form'); // 'form' | 'thought-stream'

  // Active Model Tier for Generation (Default AUTO -> T0/T1/T2/T3/T4)
  const [activeModelTier, setActiveModelTier] = useState('AUTO');

  // Active Tab in Analysis Workspace
  const [activeTab, setActiveTab] = useState('brief');

  // Discovery Answers
  const [discoveryAnswers, setDiscoveryAnswers] = useState({});

  // Finance Inputs state
  const [financeInputs, setFinanceInputs] = useState({
    userCount: 25,
    hoursSavedPerMonth: 5,
    hourlyRate: 1000,
    initialCost: 1200000,
    recurringCost: 300000
  });

  // Notification Toast state
  const [notification, setNotification] = useState(null);

  // Custom Modal Dialog States
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-rose-600 hover:bg-rose-500',
    onConfirm: null
  });

  const [governanceModal, setGovernanceModal] = useState({
    open: false,
    decision: '',
    comments: ''
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDebateModal, setShowDebateModal] = useState(false);
  const [debateName, setDebateName] = useState('SDLC Debate Circle');
  const [debateTopic, setDebateTopic] = useState('SDLC Architecture & Security Artefacts');
  const [debateRounds, setDebateRounds] = useState(3);
  const [consensusMode, setConsensusMode] = useState('Majority');
  const [debateTab, setDebateTab] = useState('configs'); // 'configs' | 'outcomes'
  const [showMlModal, setShowMlModal] = useState(false);
  const [mlModelName, setMlModelName] = useState('Gemini 2.5 Pro');
  const [mlDataset, setMlDataset] = useState('Enterprise SDLC Repositories');
  const [mlThreshold, setMlThreshold] = useState(85);
  const [mlAnalysisMode, setMlAnalysisMode] = useState('Feasibility');
  const [phase1Expanded, setPhase1Expanded] = useState(true);
  const [phase2Expanded, setPhase2Expanded] = useState(false);
  const [phase3Expanded, setPhase3Expanded] = useState(false);
  const [activeTabPhase3, setActiveTabPhase3] = useState('discovery');
  const [qaTab, setQaTab] = useState('questions'); // 'questions' | 'logs'
  const [activeProject, setActiveProject] = useState(() => localStorage.getItem('activeProject') || 'sdd-enterprise-dev');

  useEffect(() => {
    const syncActiveProject = (e) => {
      const current = e?.detail?.projectId || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      setActiveProject(current);
    };
    window.addEventListener('activeProjectChanged', syncActiveProject);
    window.addEventListener('storage', syncActiveProject);
    const interval = setInterval(syncActiveProject, 1000);
    return () => {
      window.removeEventListener('activeProjectChanged', syncActiveProject);
      window.removeEventListener('storage', syncActiveProject);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    loadIdeas(activeProject);
    checkConnectorHealth();
    fetchAvailableSignalsCount();
  }, [activeProject]);

  useEffect(() => {
    if (currentIdeaState) {
      const logs = [];
      if (currentIdeaState.debateCircleResult?.logs) {
        logs.push(...currentIdeaState.debateCircleResult.logs);
      }
      if (currentIdeaState.mlImpactResult?.telemetryLog) {
        logs.push(...currentIdeaState.mlImpactResult.telemetryLog);
      }
      if (logs.length > 0) {
        setPipelineLogs(logs);
      } else {
        setPipelineLogs([
          `[Orchestrator] Combined simulation suite run complete.`
        ]);
      }
    } else {
      setPipelineLogs([]);
    }
  }, [currentIdeaState]);

  const checkConnectorHealth = async () => {
    try {
      const res = await fetch('http://localhost:7001/api/integrations/frugalforge/health');
      const data = await res.json();
      if (data.status === 'UP') setConnectorStatus('CONNECTED');
      else setConnectorStatus('UNAVAILABLE');
    } catch (e) {
      setConnectorStatus('UNAVAILABLE');
    }
  };

  const fetchAvailableSignalsCount = async () => {
    try {
      const res = await fetch('http://localhost:7001/api/layer0/signals');
      const data = await res.json();
      if (data.success && Array.isArray(data.signals)) {
        setAvailableSignalsCount(data.signals.length);
        setLastRefreshTime(new Date().toLocaleTimeString());
      }
    } catch (e) {}
  };

  const populateFormFromIdea = (idea) => {
    if (!idea) return;
    
    // 1. Raw Input Text
    let cleanInput = idea.originalInput || '';
    if (cleanInput.startsWith('[ServiceNow / ITSM Ticket]\nTicket Reference: ')) {
      cleanInput = cleanInput.replace(/^\[ServiceNow \/ ITSM Ticket\]\nTicket Reference: /, '');
    } else if (cleanInput.startsWith('[Email Thread Analysis]\nBody: ')) {
      cleanInput = cleanInput.replace(/^\[Email Thread Analysis\]\nBody: /, '');
    } else if (cleanInput.startsWith('[Meeting Transcript]\nTranscript: ')) {
      cleanInput = cleanInput.replace(/^\[Meeting Transcript\]\nTranscript: /, '');
    } else if (cleanInput.startsWith('[Policy / SOP Document Update]\nContent: ')) {
      cleanInput = cleanInput.replace(/^\[Policy \/ SOP Document Update\]\nContent: /, '');
    }
    setRawInput(cleanInput);

    // 2. Title
    setTitle(idea.title || idea.ideaBrief?.title || '');

    // 3. Signal Category (inputType)
    if (idea.inputType) {
      setInputType(idea.inputType);
    }

    // 4. Ingestion Channel
    if (idea.ingestionChannel) {
      setIngestionChannel(idea.ingestionChannel);
    }

    // 5. Submitting Persona / Role
    if (idea.submitter) {
      const match = LAYER0_PERSONAS.find(p => p.id === idea.submitter || p.title === idea.submitter || p.role === idea.submitter);
      if (match) {
        setSelectedPersona(match.id);
        setCustomPersona('');
      } else if (idea.submitter.includes('Prakash') || idea.submitter.includes('Architect')) {
        setSelectedPersona('Enterprise Architect');
        setCustomPersona('');
      } else {
        setSelectedPersona('Other');
        setCustomPersona(idea.submitter);
      }
    } else {
      setSelectedPersona('Delivery Manager');
      setCustomPersona('');
    }
  };

  const handleImportSignalFromDrawer = async (signal) => {
    try {
      setIsProcessing(true);
      showNotification(`Importing signal '${signal.candidateTitle}' into Discovery...`);
      const res = await fetch(`http://localhost:7001/api/layer0/signals/${encodeURIComponent(signal.importId)}/create-initiative`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.ideaState) {
        await loadIdeas();
        setActiveIdeaId(data.ideaState.ideaId);
        setCurrentIdeaState(data.ideaState);
        populateFormFromIdea(data.ideaState);
        setPhase1Expanded(false);
        setPhase2Expanded(true);
        setPhase3Expanded(true);
        showNotification(`✅ Signal imported cleanly as ${data.ideaState.ideaId}!`);
      } else {
        showNotification(`❌ Signal import failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (e) {
      showNotification(`❌ Signal import request error: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualJsonUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target?.result);
        showNotification('Uploading SignalEnvelope JSON via manual contract...');
        const res = await fetch('http://localhost:7001/api/layer0/signals/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer frugalforge-signal-poc-bearer-token-2026',
            'X-Signal-Source': 'GoogleEnterpriseSignalPOC',
            'X-Signal-Schema-Version': '1.0'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.valid && data.importId) {
          await handleImportSignalFromDrawer({ importId: data.importId, candidateTitle: payload.signal?.candidateTitle || 'Manual Signal' });
        } else {
          showNotification(`❌ Manual JSON rejected: ${data.error}`, 'error');
        }
      } catch (err) {
        showNotification(`❌ Invalid JSON file format: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadIdeas = async (proj) => {
    const targetProj = proj || activeProject || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
    const res = await layer0Service.getIdeas(targetProj);
    if (res.success && res.ideas) {
      setIdeas(res.ideas);
      if (res.ideas.length > 0) {
        const firstIdea = res.ideas[0];
        setActiveIdeaId(firstIdea.ideaId);
        setCurrentIdeaState(firstIdea);
        setActiveModelTier(firstIdea.activeModelTier || 'AUTO');
        if (firstIdea.financeAnalysis?.inputs) {
          setFinanceInputs(firstIdea.financeAnalysis.inputs);
        }
        populateFormFromIdea(firstIdea);
      } else {
        setActiveIdeaId('');
        setCurrentIdeaState(null);
      }
    }
  };

  const handleSelectIdea = async (id) => {
    setActiveIdeaId(id);
    setPhase1Expanded(false);
    setPhase2Expanded(true);
    setPhase3Expanded(true);
    const res = await layer0Service.getIdeaById(id);
    if (res.success && res.idea) {
      setCurrentIdeaState(res.idea);
      setActiveModelTier(res.idea.activeModelTier || 'AUTO');
      if (res.idea.financeAnalysis?.inputs) {
        setFinanceInputs(res.idea.financeAnalysis.inputs);
      }
      populateFormFromIdea(res.idea);
    }
  };

  const handleCreateIdea = async (e) => {
    e.preventDefault();
    if (!rawInput.trim() || isProcessing) return;

    const finalSubmitter = selectedPersona === 'Other' ? (customPersona.trim() || 'Custom Stakeholder') : selectedPersona;

    setIsProcessing(true);
    setIntakeSubTab('thought-stream');
    setPipelineLogs([
      `⚡ [Pipeline Initialized]: Ingesting raw intake signal (${inputType} / ${ingestionChannel})...`,
      `🔒 [Security Interceptor]: Validated submitter persona '${finalSubmitter}' | PII & credentials clean.`,
      `🎯 [Orchestrator Node 1]: Routing to Google Gemini 2.5 Pro High Intelligence Model...`,
      `🧠 [Agent: Idea Framing]: Extracting domain intent, problem hypothesis & proposed solution...`
    ]);

    try {
      let augmentedInput = rawInput;
      if (ingestionChannel === 'ITSM_TICKET') {
        augmentedInput = `[ServiceNow Incident INC-88219] Category: IT Operations | Priority: P2 High\nDescription: ${rawInput}`;
      } else if (ingestionChannel === 'EMAIL') {
        augmentedInput = `[Email Thread: From Leadership] Subject: Executive Request\nContent: ${rawInput}`;
      } else if (ingestionChannel === 'MEETING_TRANSCRIPT') {
        augmentedInput = `[Meeting Transcript: Product Steering Call]\nTranscript: ${rawInput}`;
      } else if (ingestionChannel === 'POLICY_DOC') {
        augmentedInput = `[Policy / SOP Document Update]\nContent: ${rawInput}`;
      }

      setPipelineLogs(prev => [
        ...prev,
        `💬 [Agent: Discovery Q&A]: Synthesizing 5 targeted elicitation questions...`,
        `🔍 [Agent: Market Analysis]: Benchmarking COTS capability alternatives & differentiators...`,
        `🏗️ [Agent: Enterprise Architect]: Mapping In-Scope & Out-of-Scope system boundaries...`
      ]);

      const res = await layer0Service.createIdea({
        originalInput: augmentedInput,
        inputType,
        title: title.trim() || undefined,
        submitter: finalSubmitter,
        ingestionChannel,
        projectId: activeProject
      }, 'AUTO');

      if (res.success && res.idea) {
        setPipelineLogs(prev => [
          ...prev,
          `📄 [Agent: Requirement Compiler]: Synthesized authoritative Requirement.md (BRs, ACs, NFRs)...`,
          `✅ [Quality Audit Evaluator]: Evaluated 10 readiness dimensions | Score: ${res.idea.readinessScore || 85}/100`,
          `⚖️ [Governance Gate]: Initial status set to PENDING_HUMAN_REVIEW.`
        ]);
        setActiveIdeaId(res.idea.ideaId);
        setCurrentIdeaState(res.idea);
        setActiveModelTier('AUTO');
        setRawInput('');
        setTitle('');
        await loadIdeas();
        setActiveIdeaId(res.idea.ideaId);
        setCurrentIdeaState(res.idea);
        setPhase1Expanded(false);
        setPhase2Expanded(true);
        setPhase3Expanded(true);
        showNotification(`⚡ Initiative ${res.idea.ideaId} processed via Task-Aware Pipeline!`);
      }
    } catch (err) {
      showNotification(`❌ Error creating initiative: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Individual Idea
  const handleDeleteIdeaPrompt = (e, ideaId) => {
    e.stopPropagation();
    setConfirmModal({
      open: true,
      title: `Delete Initiative ${ideaId}`,
      message: `Are you sure you want to delete initiative ${ideaId}? This action cannot be undone.`,
      confirmText: 'Delete Initiative',
      confirmColor: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30',
      onConfirm: () => executeDeleteIdea(ideaId)
    });
  };

  const executeDeleteIdea = async (ideaId) => {
    try {
      await layer0Service.deleteIdea(ideaId);
      showNotification(`Deleted initiative ${ideaId}`);
      
      const res = await layer0Service.getIdeas();
      const updatedIdeas = res.ideas || [];
      setIdeas(updatedIdeas);

      if (activeIdeaId === ideaId) {
        if (updatedIdeas.length > 0) {
          setActiveIdeaId(updatedIdeas[0].ideaId);
          setCurrentIdeaState(updatedIdeas[0]);
        } else {
          setActiveIdeaId('');
          setCurrentIdeaState(null);
        }
      }
    } catch (err) {
      showNotification(`❌ Failed to delete initiative: ${err.message}`, 'error');
    } finally {
      setConfirmModal({ open: false });
    }
  };

  // Reset All Ideas Prompt
  const handleClearAllIdeasPrompt = () => {
    setConfirmModal({
      open: true,
      title: 'Reset Entire Discovery Pipeline',
      message: '⚠️ Are you sure you want to reset the Enterprise Discovery pipeline? This will clear all saved initiatives.',
      confirmText: 'Reset Entire Pipeline',
      confirmColor: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30',
      onConfirm: executeClearAllIdeas
    });
  };

  const executeClearAllIdeas = async () => {
    try {
      await layer0Service.clearAllIdeas();
      setIdeas([]);
      setActiveIdeaId('');
      setCurrentIdeaState(null);
      setRawInput('');
      setTitle('');
      showNotification('🧹 Pipeline reset! Ready for a fresh start.');
    } catch (err) {
      showNotification(`❌ Reset failed: ${err.message}`, 'error');
    } finally {
      setConfirmModal({ open: false });
    }
  };

  const handleStartFreshForm = () => {
    setActiveIdeaId('');
    setCurrentIdeaState(null);
    setRawInput('');
    setTitle('');
    setSelectedPersona('Delivery Manager');
    setCustomPersona('');
    showNotification('Cleared selection. Ready to enter a new initiative.');
  };

  const handleTierEscalation = async (targetTier) => {
    if (!activeIdeaId || !currentIdeaState || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await layer0Service.reEvaluateTier(activeIdeaId, currentIdeaState, targetTier);
      if (res.success && res.idea) {
        setCurrentIdeaState(res.idea);
        setActiveModelTier(targetTier);
        showNotification(`🤖 Task pipeline re-evaluated via ${targetTier} Tier!`);
      }
    } catch (err) {
      showNotification(`❌ Tier escalation error: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAgent = async (agentName) => {
    if (!activeIdeaId || !currentIdeaState) return;
    setIsProcessing(true);
    try {
      const res = await layer0Service.runAgent(activeIdeaId, agentName, currentIdeaState, activeModelTier);
      if (res.success && res.idea) {
        setCurrentIdeaState(res.idea);
        showNotification(`✅ Agent "${agentName}" re-evaluated successfully!`);
      }
    } catch (err) {
      showNotification(`❌ Error running agent: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAllAnswers = async () => {
    if (!activeIdeaId || !currentIdeaState) return;

    const answersToSave = {};
    let count = 0;
    Object.keys(discoveryAnswers).forEach(idxKey => {
      const text = discoveryAnswers[idxKey];
      if (text && text.trim()) {
        answersToSave[idxKey] = text.trim();
        count++;
      }
    });

    if (count === 0) {
      showNotification(`ℹ️ No new answers to save. Type responses into the text boxes above.`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await layer0Service.submitDiscoveryAnswersBatch(activeIdeaId, answersToSave);
      if (res.success && res.idea) {
        setCurrentIdeaState(res.idea);
        showNotification(`✅ Successfully saved ${count} discovery answer(s) & re-compiled requirement facts!`);
      } else {
        throw new Error(res.error || 'Failed to save discovery answers.');
      }
    } catch (err) {
      showNotification(`❌ Failed to save answers: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinanceParamChange = async (key, val) => {
    const nextInputs = { ...financeInputs, [key]: val };
    setFinanceInputs(nextInputs);
    if (!activeIdeaId || !currentIdeaState) return;

    const res = await layer0Service.updateFinanceInputs(activeIdeaId, nextInputs, currentIdeaState);
    if (res.success && res.idea) {
      setCurrentIdeaState(res.idea);
    }
  };

  const handleRunSuite = async () => {
    if (!activeIdeaId || isProcessing) {
      showNotification('Please select or create an initiative before running the suite.', 'error');
      return;
    }
    setIsProcessing(true);
    // Clear old logs and put initial running state logs
    setPipelineLogs([
      `[Orchestrator] Spawning Combined Alignment & ML Analysis Suite...`,
      `[Orchestrator] Reading target requirement specification for validation...`,
      `[Orchestrator] Initiating Debate Circle simulation...`
    ]);
    setIntakeSubTab('thought-stream'); // Switch to log console tab so user can watch output

    try {
      const res = await layer0Service.runSuite({
        ideaId: activeIdeaId,
        debateName,
        debateTopic,
        debateRounds,
        consensusMode,
        mlModelName,
        mlDataset,
        mlThreshold,
        mlAnalysisMode
      });
      if (res.success) {
        // Stream simulated debate logs to the thought stream console
        if (res.debateCircleResult?.logs) {
          setPipelineLogs(prev => [
            ...prev,
            ...res.debateCircleResult.logs,
            `[Orchestrator] Combined simulation suite run complete.`
          ]);
        }

        const serverIdea = res.idea || {
          ...currentIdeaState,
          debateCircleResult: res.debateCircleResult,
          mlImpactResult: res.mlImpactResult
        };
        const updatedIdeas = ideas.map(idea => {
          if (idea.ideaId === activeIdeaId) {
            return serverIdea;
          }
          return idea;
        });
        setIdeas(updatedIdeas);
        setCurrentIdeaState(serverIdea);
        showNotification('🚀 Combined suite executed successfully! Alignment and ML analysis loaded.');
      } else {
        throw new Error(res.error || 'Server error running suite');
      }
    } catch (err) {
      setPipelineLogs(prev => [...prev, `❌ Error running suite: ${err.message}`]);
      showNotification(`❌ Suite execution failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openGovernanceModal = (decision) => {
    setGovernanceModal({
      open: true,
      decision,
      comments: currentHuman.comments || ''
    });
  };

  const submitGovernanceDecision = async () => {
    if (!activeIdeaId || !currentIdeaState) return;

    setIsProcessing(true);
    try {
      const res = await layer0Service.submitHumanDecision(
        activeIdeaId,
        governanceModal.decision,
        governanceModal.comments,
        currentIdeaState
      );
      if (res.success && res.idea) {
        setCurrentIdeaState(res.idea);
        showNotification(`Governance sign-off status updated to: ${governanceModal.decision}`);

        if (governanceModal.decision === 'APPROVED') {
          const reqId = res.idea.compiledRequirement?.requirementId || `REQ-${activeIdeaId}`;
          
          evidenceService.logEvent({
            correlationId: `CORR-${activeIdeaId}`,
            specId: reqId,
            artifactId: `Requirement-${activeIdeaId}.md`,
            actorType: 'HUMAN',
            actorId: res.idea.humanDecision?.approverId || 'Project Admin',
            persona: res.idea.humanDecision?.approverRole || 'Project Admin / Product Owner',
            agentId: 'GovernanceGateAgent',
            model: 'T4 Human Authority Sign-off Gate',
            actionType: 'APPROVE_REQUIREMENT_SPECIFICATION',
            policyResult: 'APPROVED',
            payload: res.idea.compiledRequirement?.markdown || res.idea.originalInput || ''
          });

          evidenceService.logDecision({
            type: 'STAGE_GATE_0_GOVERNANCE_SIGN_OFF',
            options: ['APPROVED', 'SAVED_AS_DRAFT'],
            recommendation: 'APPROVE for SDD Framework Handoff',
            selectedOption: 'APPROVED',
            rationale: governanceModal.comments || 'Human Review Board approved Requirement.md specification.',
            approvers: [res.idea.humanDecision?.approverId || 'Project Admin'],
            conditions: 'Readiness threshold >= 85/100'
          });
        }
      }
    } catch (err) {
      showNotification(`❌ Failed to submit decision: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setGovernanceModal({ open: false, decision: '', comments: '' });
    }
  };

  const handleHandoffToSDD = async () => {
    if (!currentIdeaState) return;
    setIsProcessing(true);
    try {
      const res = await layer0Service.handoffToSDD(activeIdeaId, currentIdeaState);
      if (res.success) {
        showNotification(res.message);
        evidenceService.logEvent({
          correlationId: `CORR-${activeIdeaId}`,
          specId: currentIdeaState.compiledRequirement?.requirementId || `REQ-${activeIdeaId}`,
          artifactId: `spec.md`,
          actorType: 'SYSTEM',
          actorId: 'HandoffOrchestrator',
          persona: 'System Integrator',
          agentId: 'SDDFrameworkHandoff',
          model: 'Minimum Sufficient Intelligence Router',
          actionType: 'HANDOFF_TO_SDD_FRAMEWORK',
          policyResult: 'APPROVED',
          payload: currentIdeaState.compiledRequirement?.markdown || ''
        });
      } else {
        showNotification(`⚠️ ${res.error}`, 'error');
      }
    } catch (err) {
      showNotification(`❌ Handoff failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentBrief = currentIdeaState?.ideaBrief || {};
  const currentDiscovery = currentIdeaState?.discovery || {};
  const currentMarket = currentIdeaState?.competitorResearch || {};
  const currentEnterprise = currentIdeaState?.enterpriseAnalysis || {};
  const currentFinance = currentIdeaState?.financeAnalysis || {};
  const currentCompiled = currentIdeaState?.compiledRequirement || {};
  const currentReadiness = currentIdeaState?.qualityAudit || currentIdeaState?.readiness || {};
  const currentHuman = currentIdeaState?.humanDecision || {};

  // Gate Handoff Condition Check
  const humanApproved = currentHuman.status === 'APPROVED';
  const readinessScore = currentIdeaState?.readinessScore !== undefined
    ? currentIdeaState.readinessScore
    : (currentReadiness.overallScore !== undefined ? currentReadiness.overallScore : (currentReadiness.score || 0));
  const hasBlockers = (currentReadiness.blockers || []).length > 0;
  const canHandoff = humanApproved && !hasBlockers && readinessScore >= 85;

  const renderModelCard = (modelCardObj, defaultName = 'Task Execution Engine') => {
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation Tabs Line */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        {/* Left Side: Title */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <i className="fas fa-lightbulb text-xs"></i>
          </div>
          <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            Enterprise Discovery Workbench
          </h1>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-5 h-5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold transition cursor-pointer ml-0.5"
            title="View Initiative Info & Overview"
          >
            <i className="fas fa-info text-[9px]"></i>
          </button>
        </div>

        {/* Right Side: Sub-Navigation Tabs & Readiness Score / Handoff */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubNav('discovery')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeSubNav === 'discovery'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <i className="fas fa-lightbulb"></i>
              <span>Idea to Requirement Workbench</span>
            </button>

            <button
              onClick={() => setActiveSubNav('inbox')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeSubNav === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <i className="fas fa-inbox"></i>
              <span>Enterprise Signal Inbox</span>
              {availableSignalsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 font-mono border border-indigo-700">
                  {availableSignalsCount}
                </span>
              )}
            </button>
          </div>

          {readinessScore !== undefined && activeIdeaId && (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Readiness</p>
                <p className={`text-xs font-black font-mono ${
                  readinessScore >= 85 ? 'text-emerald-400' : readinessScore >= 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {readinessScore}/100
                </p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                readinessScore >= 85 ? 'bg-emerald-500' : readinessScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
              }`}></div>
            </div>
          )}

          {activeIdeaId && (
            <div className="relative group">
              <button
                onClick={handleHandoffToSDD}
                disabled={!canHandoff || isProcessing}
                className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 transition ${
                  canHandoff
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <i className="fas fa-paper-plane text-[10px]"></i>
                <span>Handoff</span>
              </button>

              {!canHandoff && (
                <div className="absolute right-0 top-10 w-60 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 shadow-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                  <p className="font-bold text-rose-400 mb-1">Handoff Blocked:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    {!humanApproved && <li>Human Governance Approval is required</li>}
                    {readinessScore < 85 && <li>Readiness score is below 85/100 threshold</li>}
                    {hasBlockers && <li>Active critical blockers exist</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeSubNav === 'inbox' && (
        <SignalInbox onImportInitiative={async (ideaState) => {
          const targetProj = activeProject || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
          ideaState.projectId = targetProj;
          setActiveIdeaId(ideaState.ideaId);
          setCurrentIdeaState(ideaState);
          populateFormFromIdea(ideaState);
          setPhase1Expanded(false);
          setPhase2Expanded(true);
          setPhase3Expanded(true);
          setActiveSubNav('discovery');
          await loadIdeas(targetProj);
          showNotification(`Imported initiative ${ideaState.ideaId} cleanly!`);
        }} />
      )}

      {activeSubNav === 'discovery' && (
        <div className="space-y-6">



      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          notification.type === 'error' ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
        }`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Vertical Collapsible Accordion Sections */}
      <div className="space-y-6">

        {/* BOX 1: Phase 1 - Idea Intake */}
        <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setPhase1Expanded(!phase1Expanded)}
            className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <i className="fas fa-plus-circle text-sm"></i>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  Phase 1: Idea Intake & Signal Registration
                </h2>
                <p className="text-[10px] text-slate-400">
                  {activeIdeaId ? `Current Selected Initiative: ${activeIdeaId}` : 'Capture raw ideas, ITSM tickets, emails, meeting transcripts, or SOP docs'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartFreshForm();
                  setPhase1Expanded(true);
                  setPhase2Expanded(false);
                  setPhase3Expanded(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="fas fa-plus"></i>
                <span>+ New Idea</span>
              </button>

              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                <i className={`fas fa-chevron-${phase1Expanded ? 'up' : 'down'} text-xs`}></i>
              </div>
            </div>
          </div>

          {phase1Expanded && (
            <div className="p-5 space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Intake Form & Live Thought Stream Tabbed Panel */}
                <div className="lg:col-span-7 space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  {/* Top Sub-Nav Tabs */}
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <button
                      type="button"
                      onClick={() => setIntakeSubTab('form')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        intakeSubTab === 'form'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-edit text-xs"></i>
                      <span>Initiative Intake Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntakeSubTab('thought-stream')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        intakeSubTab === 'thought-stream'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-terminal text-emerald-400 text-xs font-mono"></i>
                      <span>Live Agent Thought Stream & Telemetry</span>
                      {pipelineLogs.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-950 text-emerald-300 font-mono border border-emerald-800 font-bold">
                          {pipelineLogs.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {intakeSubTab === 'form' ? (
                    <form onSubmit={handleCreateIdea} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Ingestion Channel Selector */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Ingestion Channel:
                          </label>
                          <select
                            value={ingestionChannel}
                            onChange={(e) => setIngestionChannel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="DIRECT_TEXT">Direct Thought / Idea</option>
                            <option value="ITSM_TICKET">ServiceNow / ITSM Ticket</option>
                            <option value="EMAIL">Email Thread</option>
                            <option value="MEETING_TRANSCRIPT">Meeting Transcript</option>
                            <option value="POLICY_DOC">Policy / SOP Doc</option>
                          </select>
                        </div>

                        {/* Input Type Category Selector */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Signal Category:
                          </label>
                          <select
                            value={inputType}
                            onChange={(e) => setInputType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {LAYER0_INPUT_TYPES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Submitting Persona Selector */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Submitting Persona:
                          </label>
                          <select
                            value={selectedPersona}
                            onChange={(e) => setSelectedPersona(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {LAYER0_PERSONAS.map(p => (
                              <option key={p.id} value={p.id}>{p.title || p.role || p.label || p.id}</option>
                            ))}
                          </select>

                          {selectedPersona === 'Other' && (
                            <input
                              type="text"
                              value={customPersona}
                              onChange={(e) => setCustomPersona(e.target.value)}
                              placeholder="Enter custom persona name..."
                              className="w-full bg-slate-900 border border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none mt-1.5"
                            />
                          )}
                        </div>
                      </div>

                      {/* Custom Title Optional */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Initiative Title (Optional):
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Short descriptive title"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Raw Input or Active Connector Panel */}
                      {(ingestionChannel === 'EMAIL' || ingestionChannel === 'MEETING_TRANSCRIPT') ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center space-x-2">
                              <i className={`fas ${ingestionChannel === 'EMAIL' ? 'fa-envelope text-rose-400' : 'fa-comments text-emerald-400'}`}></i>
                              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                                Google Enterprise Signal Intake
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              connectorStatus === 'CONNECTED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}>
                              {connectorStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <div>
                              <span className="text-slate-500 block">Confirmed Signals:</span>
                              <span className="font-bold text-indigo-300">{availableSignalsCount} Available</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Last Refreshed:</span>
                              <span className="font-mono text-slate-400">{lastRefreshTime}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerType(ingestionChannel === 'EMAIL' ? 'GMAIL' : 'MEET');
                                setDrawerOpen(true);
                              }}
                              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                            >
                              <i className="fas fa-folder-open text-xs"></i>
                              <span>Browse Confirmed {ingestionChannel === 'EMAIL' ? 'Email' : 'Meeting'} Signals</span>
                            </button>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  checkConnectorHealth();
                                  fetchAvailableSignalsCount();
                                }}
                                className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center justify-center space-x-1"
                              >
                                <i className="fas fa-sync-alt text-[9px]"></i>
                                <span>Refresh</span>
                              </button>

                              <a
                                href="http://localhost:7070"
                                target="_blank"
                                rel="noreferrer"
                                className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-semibold flex items-center justify-center space-x-1 text-center"
                              >
                                <i className="fas fa-external-link-alt text-[9px]"></i>
                                <span>Open Intake UI</span>
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-semibold transition flex items-center justify-center space-x-1"
                            >
                              <i className="fas fa-file-code text-[9px]"></i>
                              <span>Import SignalEnvelope JSON</span>
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleManualJsonUpload}
                              accept=".json"
                              className="hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Unstructured Input Text / Description:
                          </label>
                          <textarea
                            rows={3}
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            placeholder="Enter a one-line idea, business problem, incident description, or paste email/transcript content..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 custom-scroll font-mono"
                          ></textarea>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isProcessing || !rawInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <i className="fas fa-spinner fa-spin text-xs"></i>
                            <span>Running Task-Aware Pipeline...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-rocket text-xs"></i>
                            <span>Run Discovery Pipeline</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* TAB 2 VIEW: Live Agent Thought Stream & Telemetry */
                    <div className="p-4 rounded-xl bg-[#060911] border border-indigo-500/40 space-y-3 animate-fade-in shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                          <i className="fas fa-terminal text-emerald-400"></i>
                          <span>Live Agent Thought Stream & Telemetry</span>
                        </span>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border font-bold ${
                          isProcessing ? 'bg-indigo-950 text-indigo-300 border-indigo-700 animate-pulse' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {isProcessing ? '⚡ STAGE ACTIVE' : '✅ COMPLETED'}
                        </span>
                      </div>

                      <div className="font-mono text-xs text-slate-300 h-64 overflow-y-auto custom-scroll space-y-2 p-3 bg-slate-950/90 rounded-xl border border-slate-900">
                        {pipelineLogs.length > 0 ? (
                          pipelineLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                              <span className="text-indigo-400 font-bold select-none">&gt;</span>
                              <span className={`${
                                log.includes('Security') || log.includes('🔒')
                                  ? 'text-emerald-400 font-semibold'
                                  : log.includes('Orchestrator') || log.includes('🎯')
                                  ? 'text-indigo-300 font-bold'
                                  : log.includes('Agent') || log.includes('🧠')
                                  ? 'text-cyan-300'
                                  : 'text-slate-300'
                              }`}>
                                {log}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                            <i className="fas fa-terminal text-2xl text-slate-700"></i>
                            <p className="text-xs">No active pipeline logs recorded yet. Click "Run Discovery Pipeline" to stream agent thoughts.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Registered Initiatives List */}
                <div className="lg:col-span-5 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i className="fas fa-folder-open text-indigo-400"></i>
                      Initiatives Repository ({ideas.length})
                    </h3>

                    {ideas.length > 0 && (
                      <button
                        onClick={handleClearAllIdeasPrompt}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fas fa-trash-alt text-[9px]"></i>
                        <span>Reset All</span>
                      </button>
                    )}
                  </div>

                  {ideas.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No initiatives registered yet. Fill in the form on the left to run discovery.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll pr-1">
                      {ideas.map((idea) => {
                        const isActive = idea.ideaId === activeIdeaId;
                        const typeObj = LAYER0_INPUT_TYPES.find(t => t.id === idea.inputType) || LAYER0_INPUT_TYPES[0];
                        return (
                          <div
                            key={idea.ideaId}
                            onClick={() => handleSelectIdea(idea.ideaId)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 relative group ${
                              isActive
                                ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between pr-5">
                              <span className="text-[10px] font-mono font-bold text-indigo-400">{idea.ideaId}</span>
                              <span className="text-[9px] px-2 py-0.2 rounded font-bold bg-slate-950 text-slate-300 border border-slate-800">
                                {typeObj.label}
                              </span>
                            </div>
                            <p className="text-xs font-semibold truncate text-slate-200 pr-5">
                              {idea.ideaBrief?.title || idea.title || idea.originalInput}
                            </p>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                              <span>Tier: AUTO (T0-T4)</span>
                              <span>{new Date(idea.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>

                            <button
                              onClick={(e) => handleDeleteIdeaPrompt(e, idea.ideaId)}
                              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg bg-slate-950/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 flex items-center justify-center transition cursor-pointer"
                            >
                              <i className="fas fa-trash text-[10px]"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>


        {/* BOX 2: Phase 2 - Discovery Analysis Workspace */}
        <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setPhase2Expanded(!phase2Expanded)}
            className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <i className="fas fa-microchip text-sm"></i>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  Phase 2: Intelligent Discovery & Requirement Formation
                </h2>
                <p className="text-[10px] text-slate-400">
                  {activeIdeaId ? `Active Initiative: [${activeIdeaId}] ${currentIdeaState?.title || ''}` : '8-Tab Evidence Synthesis, Financial ROI, and Quality Audit Workspace'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                <i className={`fas fa-chevron-${phase2Expanded ? 'up' : 'down'} text-xs`}></i>
              </div>
            </div>
          </div>

          {phase2Expanded && (
            <div className="p-5 space-y-6 animate-fade-in">
              {!activeIdeaId || !currentIdeaState ? (
                <div className="p-10 text-center space-y-3">
                  <i className="fas fa-lightbulb text-4xl text-indigo-500/30 animate-pulse"></i>
                  <h3 className="text-sm font-bold text-slate-300">No Active Initiative Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Submit a new initiative in Phase 1 above or select an existing initiative to launch Phase 2 discovery analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Workspace Navigation Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-2 border-b border-slate-800">
                    {[
                      { id: 'brief', label: '1. Idea Brief', icon: 'fa-file-alt' },
                      { id: 'market', label: '2. Market & Competitors', icon: 'fa-search-dollar' },
                      { id: 'enterprise', label: '3. Enterprise Impact', icon: 'fa-sitemap' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition cursor-pointer border ${
                          activeTab === tab.id
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <i className={`fas ${tab.icon} text-xs`}></i>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>


              {/* TAB 1: Idea Brief */}
              {activeTab === 'brief' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-4">
                  {renderModelCard(currentBrief.modelCard, 'Deterministic Intent Extractor')}

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fas fa-file-alt text-indigo-400"></i>
                      Idea Brief (`idea_brief.yaml`)
                    </h3>
                    <button
                      onClick={() => handleRunAgent('framing')}
                      disabled={isProcessing}
                      className="px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold hover:bg-indigo-900 cursor-pointer"
                    >
                      Re-run Framing Task
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Problem Hypothesis</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                        {currentBrief.problemHypothesis || currentBrief.problemStatement || 'Intent analysis detects manual compilation overhead and operational tracking friction.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Proposed Solution</span>
                      <p className="text-xs text-emerald-300 leading-relaxed font-sans font-medium">
                        {currentBrief.proposedSolution || currentBrief.solutionOverview || 'Task-aware automated requirement formation pipeline.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Personas</span>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {(currentBrief.targetPersonas || []).map((p, i) => (
                          <li key={i}>{typeof p === 'string' ? p : (p?.role || p?.persona || p?.name || JSON.stringify(p))}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expected Outcomes</span>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {(currentBrief.expectedOutcomes || []).map((o, i) => (
                          <li key={i}>{typeof o === 'string' ? o : (o?.statement || o?.text || o?.outcome || JSON.stringify(o))}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Known Facts & Unknowns</span>
                      <ul className="text-xs text-indigo-300 space-y-1 list-disc list-inside font-mono text-[10px]">
                        {(currentBrief.knownFacts || []).map((f, i) => (
                          <li key={i}>{typeof f === 'string' ? f : (f?.statement || f?.text || f?.fact || JSON.stringify(f))}</li>
                        ))}
                        {(currentBrief.unknowns || []).map((u, i) => (
                          <li key={i} className="text-amber-400">{typeof u === 'string' ? u : (u?.statement || u?.text || u?.question || JSON.stringify(u))}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}


              {/* TAB 3: Market & Competitors */}
              {activeTab === 'market' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
                  {renderModelCard(currentMarket.modelCard, 'Market Research Engine')}

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fas fa-search-dollar text-cyan-400"></i>
                      Competitor & Market Research Analysis
                    </h3>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                      Source Connector: Enterprise Benchmark Knowledge Base & Vector Index (T0/T1)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Market Context & Research Summary</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {currentMarket.marketSummary || `Market context evaluated for ${currentBrief.title || 'Initiative'}. External live web search is bypassed to enforce zero fictional data and strict governance.`}
                    </p>
                  </div>

                  {/* Competitors & COTS Comparison Cards */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Commercial Off-The-Shelf (COTS) Competitor Benchmark
                    </span>

                    {(currentMarket.competitors && currentMarket.competitors.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentMarket.competitors.map((comp, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white flex items-center gap-2">
                                <i className="fas fa-building text-indigo-400"></i>
                                {comp.name}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                                COTS Benchmark
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{comp.capabilitySummary}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 italic">
                        No direct external COTS competitors logged. Internal standard architecture benchmark applied.
                      </div>
                    )}
                  </div>

                  {/* Build vs Buy Differentiation */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Build vs. Buy Key Differentiators (FrugalForge SDD Advantage)
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {(currentMarket.differentiators || [
                        'Evidence-linked requirement synthesis directly coupled with Spec-Driven Development (SDD)',
                        'Tiered Intelligence Engine (T0 -> T4) optimizing token spend and preventing data leakage',
                        'Built-in transparent ROI and payback period calculator with 3-scenario analysis',
                        'Human Governance Sign-off Gate preventing unauthorized downstream code changes'
                      ]).map((diff, i) => (
                        <li key={i} className="leading-relaxed">{diff}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}


              {/* TAB 4: Enterprise Analysis */}
              {activeTab === 'enterprise' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
                  {renderModelCard(currentEnterprise.modelCard, 'Enterprise Impact Agent')}

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fas fa-sitemap text-purple-400"></i>
                      Enterprise Impact & Capability Analysis
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">In Scope Boundaries</h4>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {(currentEnterprise.scope || []).map((s, i) => (
                          <li key={i}>{typeof s === 'string' ? s : (s?.text || s?.statement || JSON.stringify(s))}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 space-y-2">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Out of Scope Boundaries</h4>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {(currentEnterprise.outOfScope || []).map((o, i) => (
                          <li key={i}>{typeof o === 'string' ? o : (o?.text || o?.statement || JSON.stringify(o))}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}




                </div>
              )}
            </div>
          )}
        </div>


        {/* BOX 3: Phase 3 - Discovery Compilation & Governance */}
        <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setPhase3Expanded(!phase3Expanded)}
            className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <i className="fas fa-brain text-sm"></i>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  Phase 3: Discovery Compilation & Governance
                </h2>
                <p className="text-[10px] text-slate-400">
                  {activeIdeaId ? `Active Initiative: [${activeIdeaId}] Compiled requirements, audit checks, and board approvals` : 'Discovery Q&A, Quality Audit, Requirement.md, and Governance Gate'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {readinessScore !== undefined && activeIdeaId && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] font-bold text-slate-300">
                  Readiness: <span className={readinessScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}>{readinessScore}/100</span>
                </span>
              )}
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                <i className={`fas fa-chevron-${phase3Expanded ? 'up' : 'down'} text-xs`}></i>
              </div>
            </div>
          </div>

          {phase3Expanded && (
            <div className="p-5 space-y-6 animate-fade-in">
              {!activeIdeaId || !currentIdeaState ? (
                <div className="p-10 text-center space-y-3">
                  <i className="fas fa-brain text-4xl text-purple-500/30 animate-pulse"></i>
                  <h3 className="text-sm font-bold text-slate-300">No Active Initiative Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Submit a new initiative in Phase 1 above or select an existing initiative to launch Phase 3 discovery compilation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Workspace Navigation Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-2 border-b border-slate-800">
                    {[
                      { id: 'discovery', label: '4. Discovery Q&A', icon: 'fa-comments' },
                      { id: 'readiness', label: '5. Quality Audit', icon: 'fa-check-double' },
                      { id: 'requirement', label: '6. Requirement.md', icon: 'fa-file-invoice' },
                      { id: 'approval', label: '7. Governance Gate', icon: 'fa-gavel' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTabPhase3(tab.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition cursor-pointer border ${
                          activeTabPhase3 === tab.id
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <i className={`fas ${tab.icon} text-xs`}></i>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

              {/* TAB 2: Discovery Q&A */}
              {activeTabPhase3 === 'discovery' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
                      {/* Unified Analysis & Alignment Suite */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-[#0b0f19] to-cyan-950/20 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                      
                      {/* Section 1: Debate Circle */}
                      <div 
                        onClick={() => setShowDebateModal(true)}
                        className="pr-0 md:pr-6 flex items-start space-x-4 cursor-pointer group"
                      >
                        {/* Avatar stack */}
                        <div className="flex items-center -space-x-2 shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-slate-800 flex items-center justify-center text-amber-400 font-extrabold text-[9px] shadow animate-pulse">
                            PO
                          </div>
                          <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 border border-slate-800 flex items-center justify-center text-fuchsia-400 font-extrabold text-[9px] shadow animate-bounce [animation-duration:3.2s]">
                            BA
                          </div>
                          <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-slate-800 flex items-center justify-center text-sky-400 font-extrabold text-[9px] shadow">
                            TA
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 group-hover:text-purple-300 transition">
                            <i className="fas fa-comments text-purple-400"></i>
                            Debate Circle
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Personas debate requirements, raising ambiguities and discrepancies.
                          </p>
                          <span className="text-[9px] font-bold text-indigo-400 block group-hover:underline pt-0.5">
                            Configure Debate Circle &rarr;
                          </span>
                        </div>
                      </div>

                      {/* Section 2: Ambiguity Analyzer */}
                      <div 
                        onClick={() => setShowMlModal(true)}
                        className="pl-0 md:pl-6 pt-4 md:pt-0 flex items-start space-x-4 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 animate-pulse">
                          <i className="fas fa-project-diagram text-[10px]"></i>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition">
                            <i className="fas fa-search-minus text-cyan-400"></i>
                            Ambiguity Analyzer
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Scan requirement specs for conflicting goals, logical voids, and semantic gaps.
                          </p>
                          <span className="text-[9px] font-bold text-cyan-400 block group-hover:underline pt-0.5">
                            Configure Ambiguity Analyzer &rarr;
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Run Button to the side */}
                    <div className="shrink-0 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 w-full lg:w-auto flex justify-center">
                      <button
                        onClick={handleRunSuite}
                        disabled={isProcessing}
                        className={`w-full lg:w-auto px-6 py-3 rounded-xl text-white text-xs font-extrabold shadow-lg transition flex items-center justify-center space-x-2 ${
                          isProcessing 
                            ? 'bg-slate-800 border border-slate-700 cursor-not-allowed opacity-55'
                            : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-500/20 cursor-pointer animate-pulse hover:animate-none'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
                            <span>Running Suite...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-play text-[10px]"></i>
                            <span>Run Suite</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <i className="fas fa-comments text-amber-400"></i>
                        Adaptive Stakeholder Elicitation (1-Question-at-a-Time)
                      </h3>
                      <p className="text-xs text-slate-400">Answering questions converts assumptions into confirmed facts in `Requirement.md`.</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discovery Sufficiency</span>
                      <p className="text-sm font-black font-mono text-amber-400">{currentDiscovery.sufficiencyScore || 0}%</p>
                    </div>
                  </div>

                  {/* Two Tabs Selector */}
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5 mb-4">
                    <button
                      type="button"
                      onClick={() => setQaTab('questions')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        qaTab === 'questions'
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-lg'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-question-circle text-xs"></i>
                      <span>Clarification Questions</span>
                      {(currentDiscovery.questionsAsked || []).length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-950/60 text-amber-400 font-mono border border-amber-800 font-bold ml-1.5">
                          {(currentDiscovery.questionsAsked || []).length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQaTab('logs')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        qaTab === 'logs'
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-terminal text-xs"></i>
                      <span>Thought Logs</span>
                    </button>
                  </div>

                  {qaTab === 'questions' ? (
                    <>
                      {/* Question Answers list */}
                      <div className="space-y-4">
                        {(currentDiscovery.questionsAsked || [
                          "How is the problem currently handled today, and what specific steps are involved?",
                          "Which enterprise systems or data sources (e.g. Jira, SAP, Salesforce, email, DBs) must be integrated?",
                          "How many users/managers experience this daily or weekly, and how many hours are spent manually?",
                          "Who is the primary business sponsor with approval authority for this initiative?",
                          "What specific security, regulatory, or data privacy rules apply to this requirement?"
                        ]).map((q, idx) => {
                          const respObj = currentDiscovery.responses?.[idx] || {};
                          const existingResp = respObj.answer || '';
                          const evalScore = respObj.score;
                          const evalFeedback = respObj.feedback;

                          return (
                            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold text-indigo-300 flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{typeof q === 'string' ? q : (q?.statement || q?.question || q?.text || JSON.stringify(q))}</span>
                                </span>
                                <div className="flex items-center space-x-2 shrink-0">
                                  {evalScore !== undefined && (
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                                      evalScore >= 70 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                                    }`}>
                                      <i className="fas fa-brain text-[8px] mr-1"></i>
                                      LLM Validated ({evalScore}%)
                                    </span>
                                  )}
                                  {existingResp && (
                                    <span className="text-[9px] text-emerald-400 font-bold">
                                      <i className="fas fa-check-circle mr-1"></i>Answered
                                    </span>
                                  )}
                                </div>
                              </div>

                              <textarea
                                rows={2}
                                value={discoveryAnswers[idx] !== undefined ? discoveryAnswers[idx] : existingResp}
                                onChange={(e) => setDiscoveryAnswers({ ...discoveryAnswers, [idx]: e.target.value })}
                                placeholder="Enter business details, system constraints, or persona inputs..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 custom-scroll font-medium"
                              ></textarea>

                              {evalFeedback && (
                                <p className="text-[10px] text-indigo-300/80 font-mono italic flex items-center gap-1.5 pt-0.5">
                                  <i className="fas fa-info-circle text-[9px] text-indigo-400"></i>
                                  <span>LLM Quality Audit: {evalFeedback}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Knowledge Fabric Policy Validation Card */}
                      {currentDiscovery.policyValidationResult && (
                        <div className="mt-6 bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                              <i className="fas fa-shield-alt text-indigo-400"></i>
                              <span>Vectorized Knowledge Fabric Compliance Scan</span>
                            </h4>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border shadow-sm ${
                              currentDiscovery.policyValidationResult.conformanceStatus === 'Compliant'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                : currentDiscovery.policyValidationResult.conformanceStatus === 'Contradiction Flagged'
                                ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
                                : 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                            }`}>
                              {currentDiscovery.policyValidationResult.conformanceStatus}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Policy Conformance Score</p>
                              <div className="flex items-center space-x-2.5 mt-1">
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      currentDiscovery.policyValidationResult.conformanceScore >= 90
                                        ? 'bg-emerald-500'
                                        : currentDiscovery.policyValidationResult.conformanceScore >= 70
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${currentDiscovery.policyValidationResult.conformanceScore}%` }}
                                  ></div>
                                </div>
                                <span className={`text-sm font-black font-mono ${
                                  currentDiscovery.policyValidationResult.conformanceScore >= 90
                                    ? 'text-emerald-400'
                                    : currentDiscovery.policyValidationResult.conformanceScore >= 70
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}>
                                  {currentDiscovery.policyValidationResult.conformanceScore}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* List of Deviations or Compliance Findings */}
                          {(!currentDiscovery.policyValidationResult.findings || currentDiscovery.policyValidationResult.findings.length === 0) ? (
                            <div className="py-4 text-center text-slate-500 text-xs bg-[#070a13] rounded-xl border border-slate-800/50">
                              <i className="fas fa-check-circle text-emerald-500 text-lg mb-1 block"></i>
                              <span className="font-semibold text-slate-400">Perfect Alignment Detected</span>
                              <p className="text-[10px] text-slate-500 mt-0.5">No contradictions or deviations against existing vectorized policy documents.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {currentDiscovery.policyValidationResult.findings.map((f, fIdx) => (
                                <div key={fIdx} className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                      <i className="fas fa-file-alt text-indigo-400 text-[10px]"></i>
                                      {f.policyDocument}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                      f.severity === 'High'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : f.severity === 'Medium'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    }`}>
                                      {f.severity} Severity
                                    </span>
                                  </div>
                                  <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60 font-mono text-[11px] text-slate-300">
                                    <span className="text-[9px] uppercase font-bold text-rose-400 block mb-0.5">Deviation/Contradiction:</span>
                                    {f.deviationText}
                                  </div>
                                  <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60 font-mono text-[11px] text-slate-300">
                                    <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-0.5">Recommended Remediation:</span>
                                    {f.remediationText}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Single Unified Save Button */}
                      <div className="pt-3 border-t border-slate-800 flex justify-end mt-4">
                        <button
                          onClick={handleSaveAllAnswers}
                          disabled={isProcessing}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <i className="fas fa-spinner fa-spin text-xs"></i>
                              <span>Saving Discovery Facts...</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save text-xs"></i>
                              <span>Save Discovery Answers & Sync Requirement Facts</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Thought Logs Tab View */
                    <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                          <i className="fas fa-terminal text-emerald-400"></i>
                          <span>Thought Logs & Telemetry</span>
                        </span>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border font-bold ${
                          isProcessing ? 'bg-indigo-950 text-indigo-300 border-indigo-700 animate-pulse' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {isProcessing ? '⚡ STAGE ACTIVE' : '✅ COMPLETED'}
                        </span>
                      </div>

                      <div className="font-mono text-xs text-slate-300 h-80 overflow-y-auto custom-scroll space-y-2.5 p-3 bg-slate-950/90 rounded-xl border border-slate-900">
                        {pipelineLogs.length > 0 ? (
                          pipelineLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                              <span className="text-indigo-400 font-bold select-none">&gt;</span>
                              <span className={`${
                                log.includes('Security') || log.includes('🔒')
                                  ? 'text-emerald-400 font-semibold'
                                  : log.includes('Orchestrator') || log.includes('Debate Engine')
                                  ? 'text-indigo-300 font-bold'
                                  : log.includes('Round')
                                  ? 'text-cyan-300'
                                  : 'text-slate-300'
                              }`}>
                                {log}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                            <i className="fas fa-terminal text-2xl text-slate-700"></i>
                            <p className="text-xs">No active logs recorded yet. Click "Run Suite" to start multi-persona execution.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* TAB 7: Quality & Readiness Audit */}
              {activeTabPhase3 === 'readiness' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
                  {renderModelCard(currentReadiness.modelCard, 'Readiness Audit Evaluator')}

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <i className="fas fa-check-double text-emerald-400"></i>
                        Requirement Quality & Readiness Audit (10 Real Dimensions)
                      </h3>
                      <p className="text-xs text-slate-400">Independent 10-dimension mathematical audit.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(currentReadiness.dimensions || currentReadiness.checks || []).map((c, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-200">{c.name || c.dimension}</p>
                          <p className="text-[10px] text-slate-400">{c.detail}</p>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0 font-mono text-xs">
                          <span className="text-slate-400">{c.score} / {c.weight || c.max}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            c.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* TAB 6: Requirement.md Viewer */}
              {activeTabPhase3 === 'requirement' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-4">
                  {renderModelCard(currentCompiled.modelCard, 'Requirement Section Compiler')}

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fas fa-file-invoice text-indigo-400"></i>
                      Compiled Enterprise `Requirement.md`
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(currentCompiled.markdown || '')}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
                      >
                        Copy Markdown
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto custom-scroll whitespace-pre-wrap leading-relaxed">
                    {currentCompiled.markdown || 'Requirement not compiled yet.'}
                  </div>
                </div>
              )}


              {/* TAB 8: Review Board & Human Gate */}
              {activeTabPhase3 === 'approval' && (
                <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
                  {renderModelCard({
                    name: 'Human Authority Sign-off Gate',
                    algorithm: 'T4 Human Authority',
                    icon: 'fa-gavel text-amber-400'
                  }, 'Governance Gate Agent')}

                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fas fa-gavel text-amber-400"></i>
                      Governance Review Board & Human Sign-off Gate
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Human Sign-off Status:</span>
                      <p className={`text-sm font-black font-mono ${
                        currentHuman.status === 'APPROVED' ? 'text-emerald-400' : currentHuman.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {currentHuman.status || 'PENDING_HUMAN_REVIEW'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openGovernanceModal('APPROVED')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2"
                      >
                        <i className="fas fa-check-circle"></i>
                        <span>Approve for SDD</span>
                      </button>

                      <button
                        onClick={() => openGovernanceModal('SAVED_AS_DRAFT')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer shadow-lg transition flex items-center space-x-2"
                      >
                        <i className="fas fa-save"></i>
                        <span>Save as Draft</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

                </div>
              )}
            </div>
          )}
        </div>


  </div>
</div>
)}

      {/* CUSTOM FRAMEWORK MODAL: General Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <i className="fas fa-exclamation-triangle text-rose-400 text-lg"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{confirmModal.title}</h3>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Action Confirmation Required</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">{confirmModal.message}</p>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false })}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition cursor-pointer ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM FRAMEWORK MODAL: Governance Sign-off Modal */}
      {governanceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <i className="fas fa-gavel text-indigo-400 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Governance Board Decision</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Human Sign-off Gate</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                governanceModal.decision === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : governanceModal.decision === 'CHANGES_REQUESTED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {governanceModal.decision}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {governanceModal.decision === 'APPROVED'
                  ? 'Sign-off Approval Comments / Authorization Notes:'
                  : 'Executive Draft Notes / Internal Review Comments:'}
              </label>
              <textarea
                rows={4}
                value={governanceModal.comments}
                onChange={(e) => setGovernanceModal({ ...governanceModal, comments: e.target.value })}
                placeholder="Enter executive sign-off notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 custom-scroll font-sans"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => setGovernanceModal({ open: false, decision: '', comments: '' })}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitGovernanceDecision}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition cursor-pointer ${
                  governanceModal.decision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {governanceModal.decision === 'APPROVED' ? 'Approve & Save' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signal Browser Slide-Out Drawer */}
      <SignalBrowserDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onImportSignal={handleImportSignalFromDrawer}
        signalType={drawerType}
      />

      {/* Info Modal for Enterprise Discovery Workbench Overview */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <i className="fas fa-lightbulb text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Enterprise Discovery & Requirement Formation</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Pre-SDD Requirement Formation Layer</span>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Enterprise Discovery & Requirement Formation
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AUTO Mode (Minimum Sufficient Intelligence)
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="font-semibold text-slate-200">
                Enterprise Discovery & Requirement Formation Workbench
              </p>
              <p className="text-slate-400">
                Converts raw business thoughts, incident tickets, mandates, and feedback into evidence-backed, financially modeled, enterprise-grade <code className="text-indigo-300 font-mono">Requirement.md</code> packages ready for Spec Kit.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {showDebateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <i className="fas fa-users-cog text-lg animate-spin [animation-duration:15s]"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Requirement Clarification Debate Workspace</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">P2P Persona Alignment Simulator</span>
                </div>
              </div>
              <button
                onClick={() => setShowDebateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Content - Two Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scroll pr-1 py-1">
              
              {/* Left Column: Configurations & Outcomes Tabbed Panel */}
              <div className="space-y-5 flex flex-col h-full">
                
                {/* Tabs Header */}
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDebateTab('configs')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      debateTab === 'configs'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-lg'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-sliders-h text-xs"></i>
                    <span>Debate Configs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDebateTab('outcomes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      debateTab === 'outcomes'
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-clipboard-list text-xs"></i>
                    <span>Debate Outcomes</span>
                    {currentIdeaState?.debateCircleResult && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-950/60 text-indigo-400 font-mono border border-indigo-800 font-bold ml-1.5">
                        RESOLVED
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab 1: Debate Configs */}
                {debateTab === 'configs' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Debate Name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debate Name</label>
                        <input 
                          type="text"
                          value={debateName}
                          onChange={(e) => setDebateName(e.target.value)}
                          placeholder="e.g. SDLC Debate Circle"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition font-medium"
                        />
                      </div>

                      {/* Topic / Artefact */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic / Artefact</label>
                        <input 
                          type="text"
                          value={debateTopic}
                          onChange={(e) => setDebateTopic(e.target.value)}
                          placeholder="e.g. SDLC Architecture & Security Artefacts"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition font-medium"
                        />
                      </div>
                    </div>

                    {/* Debate Rounds Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Debate Rounds: <span className="text-indigo-400 font-mono font-bold text-xs">{debateRounds}</span>
                        </label>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="10"
                        value={debateRounds}
                        onChange={(e) => setDebateRounds(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Consensus Mode Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consensus Mode</label>
                      <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                        {['Majority', 'Unanimous', 'Moderated'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setConsensusMode(mode)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                              consensusMode === mode
                                ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Debate Outcomes */}
                {debateTab === 'outcomes' && (
                  <div className="space-y-5 animate-fade-in flex-1 overflow-y-auto pr-1 custom-scroll max-h-[50vh]">
                    {currentIdeaState?.debateCircleResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <i className="fas fa-clipboard-check text-indigo-400"></i>
                            Consolidated Debate Outcome
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                            currentIdeaState.debateCircleResult.consolidated?.conformanceScore >= 80
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800'
                          }`}>
                            Conformance: {currentIdeaState.debateCircleResult.consolidated?.conformanceScore || 75}%
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          {/* Pros */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Pros / Advantages</span>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                              {(currentIdeaState.debateCircleResult.consolidated?.pros || []).map((pro, i) => (
                                <li key={i}>{typeof pro === 'string' ? pro : (pro?.text || pro?.statement || JSON.stringify(pro))}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Cons */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">Cons / Risks</span>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                              {(currentIdeaState.debateCircleResult.consolidated?.cons || []).map((con, i) => (
                                <li key={i}>{typeof con === 'string' ? con : (con?.text || con?.statement || JSON.stringify(con))}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Clarification Questions */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Mandatory Clarification Questions</span>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                              {(currentIdeaState.debateCircleResult.consolidated?.clarifications || []).map((q, i) => (
                                <li key={i} className="text-amber-300/90">{typeof q === 'string' ? q : (q?.statement || q?.question || q?.text || JSON.stringify(q))}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Detailed Debate Logs Accordion */}
                        <details className="border-t border-slate-800 pt-3 group">
                          <summary className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer list-none flex items-center justify-between">
                            <span>View Debate Transcript Logs</span>
                            <i className="fas fa-chevron-down text-[8px] group-open:rotate-180 transition-transform"></i>
                          </summary>
                          <div className="space-y-3 mt-3 max-h-40 overflow-y-auto pr-1 text-[11px] font-sans">
                            {(currentIdeaState.debateCircleResult.transcript || []).map((speech, idx) => {
                              const isPO = speech.persona === 'PO';
                              const isBA = speech.persona === 'BA';
                              const colorClass = isPO 
                                ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/90' 
                                : isBA 
                                  ? 'bg-fuchsia-500/5 border-fuchsia-500/20 text-fuchsia-300/90' 
                                  : 'bg-sky-500/5 border-sky-500/20 text-sky-300/90';
                              return (
                                <div key={idx} className={`p-2.5 rounded-lg border ${colorClass} space-y-1`}>
                                  <div className="flex items-center justify-between font-bold text-[10px]">
                                    <span>{speech.name} ({speech.title})</span>
                                    <span className="opacity-60 font-mono">Round {speech.round}</span>
                                  </div>
                                  <p className="leading-relaxed">{speech.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                        <i className="fas fa-clipboard-list text-3xl text-slate-700"></i>
                        <p className="text-xs text-center text-slate-400 leading-relaxed">No debate outcomes simulated yet.<br />Run the combined analysis suite on the main dashboard to generate results.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Circle/Triangle Connection Diagram */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800/60 relative overflow-hidden min-h-[300px]">
                
                {/* SVG Connecting Lines and Nodes */}
                <svg className="w-full h-full max-w-[340px] max-h-[280px] z-10" viewBox="0 0 400 300">
                  
                  {/* Glowing Connecting Lines (Triangle) */}
                  <g className="stroke-indigo-500/30 stroke-2">
                    {/* Line PO -> TA */}
                    <line x1="200" y1="65" x2="90" y2="215" strokeDasharray="5,5" className="animate-dash" />
                    {/* Line TA -> BA */}
                    <line x1="90" y1="215" x2="310" y2="215" strokeDasharray="5,5" className="animate-dash" />
                    {/* Line BA -> PO */}
                    <line x1="310" y1="215" x2="200" y2="65" strokeDasharray="5,5" className="animate-dash" />
                  </g>

                  {/* Nodes */}
                  {/* Node 1: Product Owner (PO) */}
                  <g transform="translate(200, 65)">
                    <circle r="36" className="fill-[#0b0f19] stroke-amber-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
                    <circle r="30" className="fill-amber-500/10" />
                    <text y="5" textAnchor="middle" className="fill-amber-400 font-extrabold text-sm font-sans tracking-tight">PO</text>
                  </g>

                  {/* Node 2: Technical Architect (TA) */}
                  <g transform="translate(90, 215)">
                    <circle r="36" className="fill-[#0b0f19] stroke-sky-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.2)]" />
                    <circle r="30" className="fill-sky-500/10" />
                    <text y="5" textAnchor="middle" className="fill-sky-400 font-extrabold text-sm font-sans tracking-tight">TA</text>
                  </g>

                  {/* Node 3: Business Analyst (BA) */}
                  <g transform="translate(310, 215)">
                    <circle r="36" className="fill-[#0b0f19] stroke-fuchsia-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(217,70,239,0.2)]" />
                    <circle r="30" className="fill-fuchsia-500/10" />
                    <text y="5" textAnchor="middle" className="fill-fuchsia-400 font-extrabold text-sm font-sans tracking-tight">BA</text>
                  </g>

                  {/* Center Node representing Consensus */}
                  <g transform="translate(200, 165)">
                    <circle r="22" className="fill-slate-950 stroke-purple-500/40 stroke-2 animate-pulse" />
                    <circle r="14" className="fill-purple-500/20" />
                    <text y="4" textAnchor="middle" className="fill-purple-400 font-bold text-[9px] font-mono tracking-tight">ALIGN</text>
                  </g>
                </svg>

                {/* Legend Overlay labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-300 shadow">
                  Product Owner (PO)
                </div>
                <div className="absolute bottom-2 left-4 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-300 shadow">
                  Tech Architect (TA)
                </div>
                <div className="absolute bottom-2 right-4 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-300 shadow">
                  Business Analyst (BA)
                </div>

                {/* Background grid visual accent */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 border-t border-slate-800/80 pt-4 shrink-0">
              <button
                onClick={() => setShowDebateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDebateModal(false);
                  showNotification('Alignment debate simulation started cleanly!');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center space-x-2"
              >
                <i className="fas fa-save text-[10px]"></i>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showMlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <i className="fas fa-brain text-lg animate-pulse"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Ambiguity Analyzer Workspace</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Heuristic Ambiguity Scanner & Logical Gap Detector</span>
                </div>
              </div>
              <button
                onClick={() => setShowMlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Content - Two Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scroll pr-1 py-1">
              
              {/* Left Column: Configurations */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Model Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model Name</label>
                    <input 
                      type="text"
                      value={mlModelName}
                      onChange={(e) => setMlModelName(e.target.value)}
                      placeholder="e.g. Gemini 2.5 Pro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition font-medium"
                    />
                  </div>

                  {/* Target Dataset */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Dataset</label>
                    <input 
                      type="text"
                      value={mlDataset}
                      onChange={(e) => setMlDataset(e.target.value)}
                      placeholder="e.g. Enterprise SDLC Repositories"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition font-medium"
                    />
                  </div>
                </div>

                {/* Threshold Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Feasibility Threshold: <span className="text-cyan-400 font-mono font-bold text-xs">{mlThreshold}%</span>
                    </label>
                  </div>
                  <input 
                    type="range"
                    min="50"
                    max="100"
                    value={mlThreshold}
                    onChange={(e) => setMlThreshold(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Analysis Mode Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis Mode</label>
                  <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                    {['Feasibility', 'Cost/Token', 'Latency'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setMlAnalysisMode(mode)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                          mlAnalysisMode === mode
                            ? 'bg-cyan-600 text-white shadow shadow-cyan-600/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Indicator / Simulation log */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                    Model Metrics
                  </h4>
                  <div className="font-mono text-[10px] text-slate-400 space-y-1">
                    <p className="text-cyan-400/90">&gt; Engine: {mlModelName}</p>
                    <p>&gt; Data Pipeline: {mlDataset || 'None'}</p>
                    <p>&gt; Target Confidence Level: {mlThreshold}%</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Connection/Flow Diagram */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800/60 relative overflow-hidden min-h-[300px]">
                
                {/* SVG Flow diagram */}
                <svg className="w-full h-full max-w-[340px] max-h-[280px] z-10" viewBox="0 0 400 300">
                  
                  {/* Connecting flow lines */}
                  <g className="stroke-cyan-500/30 stroke-2">
                    <line x1="100" y1="150" x2="200" y2="80" strokeDasharray="5,5" className="animate-dash" />
                    <line x1="200" y1="80" x2="300" y2="150" strokeDasharray="5,5" className="animate-dash" />
                    <line x1="300" y1="150" x2="200" y2="220" strokeDasharray="5,5" className="animate-dash" />
                    <line x1="200" y1="220" x2="100" y2="150" strokeDasharray="5,5" className="animate-dash" />
                  </g>

                  {/* Nodes */}
                  <g transform="translate(100, 150)">
                    <circle r="30" className="fill-[#0b0f19] stroke-cyan-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.2)]" />
                    <text y="4" textAnchor="middle" className="fill-cyan-400 font-extrabold text-[10px] font-sans tracking-tight">INGEST</text>
                  </g>

                  <g transform="translate(200, 80)">
                    <circle r="30" className="fill-[#0b0f19] stroke-teal-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.2)]" />
                    <text y="4" textAnchor="middle" className="fill-teal-400 font-extrabold text-[10px] font-sans tracking-tight">PROCESS</text>
                  </g>

                  <g transform="translate(300, 150)">
                    <circle r="30" className="fill-[#0b0f19] stroke-indigo-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]" />
                    <text y="4" textAnchor="middle" className="fill-indigo-400 font-extrabold text-[10px] font-sans tracking-tight">INFER</text>
                  </g>

                  <g transform="translate(200, 220)">
                    <circle r="30" className="fill-[#0b0f19] stroke-emerald-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                    <text y="4" textAnchor="middle" className="fill-emerald-400 font-extrabold text-[10px] font-sans tracking-tight">FEEDBACK</text>
                  </g>

                  {/* Center Node representing Consensus */}
                  <g transform="translate(200, 150)">
                    <circle r="20" className="fill-slate-950 stroke-cyan-500/40 stroke-2 animate-pulse" />
                    <text y="4" textAnchor="middle" className="fill-cyan-300 font-bold text-[9px] font-mono tracking-tight">ML</text>
                  </g>
                </svg>

                {/* Legend Overlay labels */}
                <div className="absolute top-2 left-12 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-300 shadow">
                  Data Pipelines
                </div>
                <div className="absolute bottom-2 right-12 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-300 shadow">
                  Closed Loop Learning
                </div>

                {/* Background grid visual accent */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 border-t border-slate-800/80 pt-4 shrink-0">
              <button
                onClick={() => setShowMlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowMlModal(false);
                  showNotification('Ambiguity Analyzer configuration saved successfully!');
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition cursor-pointer flex items-center space-x-2"
              >
                <i className="fas fa-save text-[10px]"></i>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
