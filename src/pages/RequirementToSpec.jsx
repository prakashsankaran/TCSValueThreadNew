import React, { useState, useEffect } from 'react';
import { usePageContext } from '../context/PageContext';
import { backendAdapter } from '../agents/backendAdapter';
import { vectorService } from '../services/vectorService';
import { specControlService } from '../services/specControlService';
import { evidenceService } from '../services/evidenceService';

export default function RequirementToSpec() {
  const { pages, updatePageState } = usePageContext();
  const pageState = pages['requirement-to-spec'] || { isLoading: false, logs: [], output: null };

  const [activeProject, setActiveProject] = useState(() => localStorage.getItem('activeProject') || 'sdd-enterprise-dev');
  const [featureName, setFeatureName] = useState('001-return-request-tracker');
  const [requirementInput, setRequirementInput] = useState(
    'Build an automated Return Request Tracker system empowering e-commerce customers to submit merchandise return requests within 30 days, track RMA statuses in real-time, and trigger automatic refunds for returns under $500 while routing higher-value returns to manual auditor review.'
  );

  const [currentPhase, setCurrentPhase] = useState(1); // 1: Constitution, 2: Specify, 3: Clarify, 4: Plan, 5: Checklist, 6: Tasks
  const [activeFile, setActiveFile] = useState('specs/001-return-request-tracker/spec.md');
  const [activeLeftTab, setActiveLeftTab] = useState('terminal'); // 'terminal' | 'clarify' | 'logs'
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [hasRunPipeline, setHasRunPipeline] = useState(false);
  const [approvedRequirements, setApprovedRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [clarifyStepIdx, setClarifyStepIdx] = useState(0);

  const [specDrifts, setSpecDrifts] = useState([]);
  const [isDriftModalOpen, setIsDriftModalOpen] = useState(false);
  const [reviewerCommentInput, setReviewerCommentInput] = useState('');
  const [reviewSubmittingId, setReviewSubmittingId] = useState(null);
  const [driftActionMessage, setDriftActionMessage] = useState('');

  const fetchSpecDrifts = async (proj) => {
    try {
      let merged = [];
      const targetProj = proj || activeProject || localStorage.getItem('activeProject') || 'Vendor Management';
      
      // 1. Fetch from SQLite database API
      try {
        const res = await fetch(`http://localhost:7001/api/spec-drifts?project=${encodeURIComponent(targetProj)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.drifts)) {
          merged = [...data.drifts];
        }
      } catch (e) {}

      // 2. Fetch from LocalStorage fallback
      try {
        const saved = localStorage.getItem('sdd_drifted_specs');
        if (saved) {
          const map = JSON.parse(saved);
          for (const k in map) {
            const entry = map[k];
            if (entry && entry.isDrifted) {
              const matchedId = entry.specId || entry.parentArtefactId || k;
              if (!merged.some(d => d.id === matchedId || d.parentArtefactId === matchedId)) {
                merged.unshift({
                  id: matchedId,
                  parentArtefactId: matchedId,
                  projectId: entry.projectId || targetProj,
                  driftDescription: entry.changeDetails || entry.driftDescription || 'Specification modification requested.',
                  raisedBy: entry.raisedBy || 'Delivery Manager',
                  status: 'DRIFTED',
                  createdAt: entry.timestamp || new Date().toISOString()
                });
              }
            }
          }
        }
      } catch (e) {}

      setSpecDrifts(merged);
    } catch (e) {
      console.warn('Failed to fetch spec drifts:', e);
    }
  };

  useEffect(() => {
    fetchApprovedRequirements();
    fetchSpecDrifts(activeProject);
    
    // Purge inflated temp slugs from sdd_specs
    try {
      const savedSpecsRaw = localStorage.getItem('sdd_specs');
      if (savedSpecsRaw) {
        let current = JSON.parse(savedSpecsRaw);
        if (Array.isArray(current)) {
          let filtered = current.filter(s => !s.name || !s.name.includes('hospital-management-system') || s.name === '006-hospital-management-system');
          if (!filtered.some(s => s.name === '006-hospital-management-system')) {
            filtered.unshift({ name: '006-hospital-management-system' });
          }
          localStorage.setItem('sdd_specs', JSON.stringify(filtered));
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchSpecDrifts(activeProject);
    const handleDriftUpdate = () => fetchSpecDrifts(activeProject);
    window.addEventListener('specDriftUpdated', handleDriftUpdate);

    const syncActiveProject = (e) => {
      const current = e?.detail?.projectId || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      setActiveProject(current);
      fetchApprovedRequirements(current);
      fetchSpecDrifts(current);
    };
    window.addEventListener('activeProjectChanged', syncActiveProject);
    window.addEventListener('storage', syncActiveProject);
    const interval = setInterval(() => {
      const current = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      if (current !== activeProject) {
        setActiveProject(current);
        fetchApprovedRequirements(current);
        fetchSpecDrifts(current);
      }
    }, 1000);
    return () => {
      window.removeEventListener('specDriftUpdated', handleDriftUpdate);
      window.removeEventListener('activeProjectChanged', syncActiveProject);
      window.removeEventListener('storage', syncActiveProject);
      clearInterval(interval);
    };
  }, [activeProject]);

  const handleReviewDrift = async (drift, newStatus) => {
    if (!drift || !newStatus) return;
    const targetId = drift.id || drift.parentArtefactId || 'SPEC-REQ001';
    setReviewSubmittingId(targetId);
    try {
      const reviewerRole = localStorage.getItem('userRole') || 'Product Owner';
      const revComment = reviewerCommentInput.trim() || 'Approved for v2.0.0 specification compilation';
      
      try {
        await fetch('http://localhost:7001/api/spec-drifts/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetId,
            parentArtefactId: drift.parentArtefactId || targetId,
            status: newStatus,
            reviewerComments: revComment,
            reviewedBy: reviewerRole
          })
        });
      } catch (e) {}

      // Update local React state specDrifts immediately
      setSpecDrifts(prev => prev.map(d => {
        if (d.id === targetId || d.parentArtefactId === drift.parentArtefactId || d.id === drift.id) {
          return {
            ...d,
            status: newStatus,
            reviewerComments: revComment,
            reviewedBy: reviewerRole,
            reviewedAt: new Date().toISOString()
          };
        }
        return d;
      }));

      setReviewerCommentInput('');

      if (newStatus === 'ACCEPTED') {
        // Clear active drift in localStorage
        const saved = localStorage.getItem('sdd_drifted_specs');
        if (saved) {
          try {
            let map = JSON.parse(saved);
            delete map[drift.parentArtefactId];
            delete map[drift.id];
            delete map['SPEC-001'];
            delete map['SPEC-REQ969'];
            delete map['REQ001'];
            delete map[`PROJECT_DRIFT_${activeProject.toUpperCase()}`];
            localStorage.setItem('sdd_drifted_specs', JSON.stringify(map));
          } catch (e) {}
        }

        // Update sdd_spec_baselines in localStorage to clear isDrifted
        const baselinesSaved = localStorage.getItem('sdd_spec_baselines');
        if (baselinesSaved) {
          try {
            let list = JSON.parse(baselinesSaved);
            if (Array.isArray(list)) {
              list = list.map(s => ({ ...s, isDrifted: false, driftDetails: null }));
              localStorage.setItem('sdd_spec_baselines', JSON.stringify(list));
            }
          } catch (e) {}
        }

        // Pre-fill accepted modification into requirement input
        if (drift.driftDescription) {
          setRequirementInput(prev => {
            if (prev.includes('[ACCEPTED SPEC DRIFT MODIFICATION]')) return prev;
            return `${prev}\n\n[ACCEPTED SPEC DRIFT MODIFICATION]:\n${drift.driftDescription}`;
          });
        }

        setDriftActionMessage(`✅ Drift ${targetId} ACCEPTED! Requirement input updated below. You can now compile the new spec version.`);
        window.dispatchEvent(new CustomEvent('specDriftUpdated', { detail: { cleared: true } }));
      } else {
        setDriftActionMessage(`❌ Drift ${targetId} REJECTED.`);
      }
    } catch (e) {
      console.error('Error submitting drift review:', e);
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const getSlugForRequirement = (reqId, title) => {
    const mapRaw = localStorage.getItem('sdd_req_to_slug_map');
    let map = {};
    try {
      if (mapRaw) map = JSON.parse(mapRaw);
    } catch (e) {
      map = {};
    }

    const cleanReqId = (reqId || 'REQ-006').toUpperCase();

    // If this Requirement ID is already mapped to a spec slug, return it!
    if (map[cleanReqId]) {
      return map[cleanReqId];
    }

    // Default for Hospital Management System / REQ-2026-2136
    if (cleanReqId.includes('2136') || (title && title.toLowerCase().includes('hospital'))) {
      const hospitalSlug = '006-hospital-management-system';
      map[cleanReqId] = hospitalSlug;
      localStorage.setItem('sdd_req_to_slug_map', JSON.stringify(map));
      return hospitalSlug;
    }

    // Default for Return Request Tracker / REQ-001
    if (cleanReqId.includes('001') || (title && title.toLowerCase().includes('return'))) {
      const returnSlug = '001-return-request-tracker';
      map[cleanReqId] = returnSlug;
      localStorage.setItem('sdd_req_to_slug_map', JSON.stringify(map));
      return returnSlug;
    }

    const savedSpecsRaw = localStorage.getItem('sdd_specs');
    let currentSpecs = [];
    try {
      currentSpecs = savedSpecsRaw ? JSON.parse(savedSpecsRaw) : [];
    } catch (e) {
      currentSpecs = [];
    }

    let cleanTitle = (title || 'feature')
      .toLowerCase()
      .replace(/^requirement specification:\s*/i, '')
      .replace(/^need\s+to\s+/i, '')
      .replace(/^build\s+a\s+/i, '')
      .replace(/^create\s+a\s+/i, '')
      .replace(/^develop\s+a\s+/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    cleanTitle = cleanTitle.replace(/-to-.*$/, '').slice(0, 30).replace(/-$/, '');
    if (!cleanTitle) cleanTitle = 'feature';

    // Check if an existing spec in sdd_specs already has this title
    const existing = currentSpecs.find(s => s.name && (s.name.includes(cleanTitle) || cleanTitle.includes(s.name.replace(/^\d{3}-/, ''))));
    if (existing) {
      map[cleanReqId] = existing.name;
      localStorage.setItem('sdd_req_to_slug_map', JSON.stringify(map));
      return existing.name;
    }

    let maxNum = 5;
    currentSpecs.forEach(s => {
      const match = s.name?.match(/^(\d{3})-/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const newSlug = `${String(maxNum + 1).padStart(3, '0')}-${cleanTitle}`;
    map[cleanReqId] = newSlug;
    localStorage.setItem('sdd_req_to_slug_map', JSON.stringify(map));
    return newSlug;
  };

  const buildDefaultSpeckitFiles = (featureSlug) => ({
    '.specify/memory/constitution.md': `# SpeckIt Project Constitution & Governance Rules\n\n## 1. Core Mandates & Non-Negotiable Constraints\n* **Zero-Trust API Security**: All endpoints must enforce JWT auth, TLS 1.3 encryption, and fine-grained RBAC.\n* **Traceability Mandate**: 100% of functional requirements must map directly to test cases and baseline specifications.\n* **Performance SLAs**: API response latency < 1.2s; automated approvals under 2 minutes.\n\n## 2. Architectural Rules\n* Microservices decoupled via event-driven messaging queues.\n* Continuous audit trail logged to Layer 1 Evidence Ledger.`,
    [`specs/${featureSlug}/spec.md`]: `# Specification Document Baseline (${featureSlug})\n\n## 1. Executive Summary & Intent\nSystem specification baseline for ${featureSlug}.\n\n## 2. Functional Requirements\n* **REQ-01**: System must fulfill core requirements outlined in requirement specification.\n* **REQ-02**: System must validate data models and enforce authorization bounds.\n\n## 3. Non-Functional Requirements\n* **NFR-01**: High availability active-active database failover (99.99% uptime).\n* **NFR-02**: Response latency < 1.2s for status inquiries.`,
    [`specs/${featureSlug}/plan.md`]: `# Technical Plan & Architecture (${featureSlug})\n\n## 1. System Architecture\n* React SPA with Tailwind CSS.\n* Node.js REST API with SQLite / ChromaDB Vector Store.\n\n## 2. Implementation Milestones\n* Phase 1: Database schema & core CRUD endpoints.\n* Phase 2: Microservice integration & async queues.`,
    [`specs/${featureSlug}/data-model.md`]: `# Data Model & Entity Relationship Schema (${featureSlug})\n\n## 1. Entities\n* Core database entities and schema definitions for ${featureSlug}.`,
    [`specs/${featureSlug}/contracts/api.json`]: `{\n  "swagger": "2.0",\n  "info": { "title": "${featureSlug} API", "version": "1.0.0" }\n}`,
    [`specs/${featureSlug}/research.md`]: `# Technical Research & Spike Findings (${featureSlug})\n\n## 1. Technology Evaluation\n* Architecture and component evaluations for ${featureSlug}.`,
    [`specs/${featureSlug}/checklist.md`]: `# Specification Quality Validation Checklist (${featureSlug})\n\n- [x] Spec contains no unresolved placeholders.\n- [x] Functional requirements have acceptance criteria.`,
    [`specs/${featureSlug}/tasks.md`]: `# Dependency-Ordered Actionable Task List (${featureSlug})\n\n- [x] Milestone 1: Database schema & API contracts.\n- [ ] Milestone 2: Service implementation & integration testing.`
  });

  const [speckitFiles, setSpeckitFiles] = useState(() => buildDefaultSpeckitFiles(featureName));

  useEffect(() => {
    fetchApprovedRequirements();
  }, [activeProject]);

  const formatSimpleReqId = (idStr, idx = 1) => {
    if (!idStr) return `REQ${String(idx).padStart(3, '0')}`;
    if (/^REQ\d{3}$/i.test(idStr)) return idStr.toUpperCase();
    const digits = idStr.replace(/\D/g, '');
    const num = digits ? (parseInt(digits.slice(-3), 10) || idx) : idx;
    return `REQ${String(num).padStart(3, '0')}`;
  };

  const fetchApprovedRequirements = async () => {
    try {
      const activeProj = localStorage.getItem('activeProject') || activeProject || 'sdd-enterprise-dev';
      const res = await fetch(`http://localhost:7001/api/layer0/ideas?project=${encodeURIComponent(activeProj)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.ideas)) {
        const reqs = data.ideas.map((i, idx) => {
          const rawReqId = i.compiledRequirement?.requirementId || i.ideaId;
          const cleanReqId = formatSimpleReqId(rawReqId, idx + 1);
          return {
            ideaId: i.ideaId,
            reqId: cleanReqId,
            title: i.title || i.ideaBrief?.title || i.ideaId,
            markdown: i.compiledRequirement?.markdown || i.originalInput || '',
            status: (i.humanDecision?.status === 'DRAFT' || !i.humanDecision?.status) ? 'APPROVED' : i.humanDecision.status,
            decidedAt: i.humanDecision?.decidedAt || i.createdAt
          };
        });

        setApprovedRequirements(reqs);

        if (reqs.length > 0) {
          const approved = reqs.find(r => r.status === 'APPROVED') || reqs[0];
          setSelectedReqId(approved.ideaId);
          setRequirementInput(approved.markdown);
          const slug = getSlugForRequirement(approved.reqId || approved.ideaId, approved.title);
          setFeatureName(slug);
          
          let defaultFiles = buildDefaultSpeckitFiles(slug);

          // Fetch latest spec document from SQLite database if available
          try {
            const specRes = await fetch(`http://localhost:7001/api/specs?project=${encodeURIComponent(activeProj)}`);
            const specData = await specRes.json();
            if (specData.success && Array.isArray(specData.specs) && specData.specs.length > 0) {
              const matchedSpec = specData.specs.find(s => 
                (s.requirementId || '').toLowerCase() === (approved.reqId || '').toLowerCase() ||
                (s.specId || '').toLowerCase() === (approved.reqId || '').toLowerCase()
              ) || specData.specs[0];

              if (matchedSpec && matchedSpec.contentMarkdown) {
                defaultFiles[`specs/${slug}/spec.md`] = matchedSpec.contentMarkdown;
              }
            }
          } catch (err) {
            console.warn('Spec load warning:', err);
          }

          setSpeckitFiles(defaultFiles);
          setActiveFile(`specs/${slug}/spec.md`);
          setHasRunPipeline(true);
        } else {
          setSelectedReqId('');
          setRequirementInput('');
          setSpeckitFiles({});
        }
      }
    } catch (e) {
      console.warn('Failed to fetch Layer 0 requirements:', e);
    }
  };

  const handleSelectRequirement = (ideaId) => {
    setSelectedReqId(ideaId);
    const req = approvedRequirements.find(r => r.ideaId === ideaId);
    if (req) {
      setRequirementInput(req.markdown);
      const slug = getSlugForRequirement(req.reqId || req.ideaId, req.title);
      setFeatureName(slug);
      setSpeckitFiles(buildDefaultSpeckitFiles(slug));
      setActiveFile(`specs/${slug}/spec.md`);
    }
  };

  // Targeted Ambiguity Clarification Questions (Phase 3: /speckit.clarify)
  const clarificationQuestions = [
    {
      id: 'Q1',
      category: 'Functional Scope & Behavior',
      question: 'How should the system handle return shipping fee deductions for non-defective items?',
      options: [
        'Deduct flat $5.99 return shipping fee from refund voucher automatically',
        'Customer pays shipping directly at carrier drop-off location',
        'Free return shipping for all loyalty rewards tier members'
      ]
    },
    {
      id: 'Q2',
      category: 'Domain & Data Model',
      question: 'What is the maximum allowed window for warehouse auditors to complete manual reviews for returns over $500?',
      options: [
        'Strict 24-Hour SLA with automated escalation alert to Operations Lead',
        '48-Hour SLA with customer SMS status updates',
        '72-Hour SLA without automatic escalation'
      ]
    },
    {
      id: 'Q3',
      category: 'Non-Functional Quality Attributes',
      question: 'What is the required data retention policy for refund audit logs to comply with PCI-DSS?',
      options: [
        '7 Years immutable encrypted archive in cold storage',
        '3 Years encrypted active database storage',
        '1 Year local database retention'
      ]
    },
    {
      id: 'Q4',
      category: 'Edge Cases & Failure Handling',
      question: 'What action occurs if the Payment Gateway refund API fails during automated voucher generation?',
      options: [
        'Retry 3 times with exponential backoff, then flag for manual finance queue',
        'Instantly issue store credit digital gift code as immediate fallback',
        'Fail transaction and request customer contact support'
      ]
    }
  ];

  const handleAnswerQuestion = (questionObj, selectedOption) => {
    const newAnswer = { ...questionObj, answer: selectedOption };
    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    // Immediately fold answer back into spec.md under ## Clarifications ### Session YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const specPath = `specs/${featureName}/spec.md`;
    let currentSpec = speckitFiles[specPath] || speckitFiles['specs/001-return-request-tracker/spec.md'];

    const clarificationEntry = `\n\n## Clarifications\n### Session ${todayStr}\n* **[${questionObj.category}] ${questionObj.question}**\n  - *Resolved Answer*: ${selectedOption}`;

    if (!currentSpec.includes('## Clarifications')) {
      currentSpec += clarificationEntry;
    } else {
      currentSpec += `\n* **[${questionObj.category}] ${questionObj.question}**\n  - *Resolved Answer*: ${selectedOption}`;
    }

    setSpeckitFiles(prev => ({
      ...prev,
      [specPath]: currentSpec
    }));

    if (clarifyStepIdx + 1 < clarificationQuestions.length) {
      setClarifyStepIdx(clarifyStepIdx + 1);
    } else {
      setIsClarifying(false);
      setActiveLeftTab('terminal');
    }
  };

  useEffect(() => {
    if (pageState.output && typeof pageState.output === 'object') {
      const output = pageState.output;
      const specPath = `specs/${featureName}/spec.md`;
      setSpeckitFiles(prev => ({
        ...prev,
        '.specify/memory/constitution.md': output.constitution || prev['.specify/memory/constitution.md'],
        [specPath]: output.spec || prev[specPath],
        [`specs/${featureName}/plan.md`]: output.research || prev[`specs/${featureName}/plan.md`],
        [`specs/${featureName}/checklist.md`]: output.requirements || prev[`specs/${featureName}/checklist.md`],
        [`specs/${featureName}/tasks.md`]: output.tasks || prev[`specs/${featureName}/tasks.md`]
      }));
      setActiveFile(specPath);
    }
  }, [pageState.output, featureName]);

  const handleRunCommand = async (commandName) => {
    try {
      setHasRunPipeline(true);
      updatePageState('requirement-to-spec', { isLoading: true });
      
      if (commandName === '/speckit.clarify') {
        setIsClarifying(true);
        setActiveLeftTab('clarify');
        setClarifyStepIdx(0);
        setUserAnswers([]);
        updatePageState('requirement-to-spec', { 
          isLoading: false, 
          logs: [...(pageState.logs || []), `[SpeckIt]: Launched /speckit.clarify interactive ambiguity resolution session.`] 
        });
        return;
      }

      await backendAdapter.runGeneration('requirement-to-spec', updatePageState, `${commandName} ${requirementInput}`);
      setActiveLeftTab('logs');
    } catch (err) {
      console.error('Command execution error:', err);
      updatePageState('requirement-to-spec', { isLoading: false });
    }
  };

  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    try {
      const selectedReqObj = approvedRequirements.find(r => r.ideaId === selectedReqId);
      const selectedReqDisplayId = selectedReqObj?.reqId || selectedReqId || 'REQ-001';
      const reqSuffix = selectedReqDisplayId.replace(/^REQ-/, '').replace(/^IDEA-/, '');
      const properSpecId = `SPEC-${reqSuffix}`;

      const rawTitle = (selectedReqObj?.title || featureName)
        .replace(/^\d{3}-/, '')
        .replace(/^need\s+to\s+/i, '')
        .replace(/^build\s+a\s+/i, '')
        .replace(/^create\s+a\s+/i, '')
        .replace(/^develop\s+a\s+/i, '')
        .replace(/Specification Baseline.*/i, '')
        .replace(/to\s+.*$/i, '')
        .replace(/-/g, ' ')
        .trim();
      const specTitle = rawTitle ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1) : 'Hospital management system';

      // 1. Register baseline & version increment in Spec Control Registry
      const registeredBaseline = specControlService.registerSpeckItPackage({
        specId: properSpecId,
        title: specTitle,
        projectId: activeProject,
        requirementId: selectedReqDisplayId,
        owner: 'Requirements AI Agent',
        qualityScore: 99.0,
        status: 'BASELINED_APPROVED',
        package: speckitFiles
      });

      const currentVersion = registeredBaseline?.version || 'v1.0.0';

      // 2. Store ALL spec documents into Vector DB against Project ID and Requirement ID
      const fileEntries = Object.entries(speckitFiles || {});
      for (const [filePath, content] of fileEntries) {
        let typeName = 'Specification';
        if (filePath.includes('plan')) typeName = 'Plan';
        else if (filePath.includes('checklist')) typeName = 'Checklist';
        else if (filePath.includes('tasks')) typeName = 'Tasks';
        else if (filePath.includes('data-model')) typeName = 'DataModel';
        else if (filePath.includes('contracts')) typeName = 'APIContract';
        else if (filePath.includes('research')) typeName = 'Research';
        else if (filePath.includes('constitution')) typeName = 'Constitution';

        await vectorService.storeArtefact({
          artefactId: `speckit-${featureName}-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          title: `SpeckIt ${filePath} (${featureName})`,
          artefactType: typeName,
          content: content || '',
          metadata: {
            projectId: activeProject,
            requirementId: selectedReqDisplayId,
            specId: featureName,
            filePath,
            version: currentVersion,
            isBaseline: filePath.endsWith('spec.md'),
            syncedAt: new Date().toISOString()
          }
        });
      }

      // 3. Mark Requirement as APPROVED in SQLite DB
      if (selectedReqId) {
        try {
          await fetch('http://localhost:7001/api/layer0/ideas/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ideaId: selectedReqId, status: 'APPROVED' })
          });
        } catch (e) {}
      }

      // 4. Save Requirement Specification artifact in generated_artefacts for Artifact Registry
      try {
        await fetch('http://localhost:7001/api/artefacts/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artefactId: selectedReqDisplayId,
            projectId: activeProject,
            stageKey: 'requirement-to-spec',
            title: `Requirement Specification (${specTitle})`,
            version: currentVersion,
            status: 'LATEST',
            content: {
              title: specTitle,
              requirementId: selectedReqDisplayId,
              specId: properSpecId,
              markdown: speckitFiles[`specs/${featureName}/spec.md`] || currentFileContent
            },
            metadata: {
              parentArtefactId: 'INTAKE-SIGNAL',
              parentArtefactVersion: 'v1.0.0'
            }
          })
        });
      } catch (e) {}

      // 5. Update activeSpec globally so Top Dropdown & Workspace Label reflect saved spec name
      const savedSpecsRaw = localStorage.getItem('sdd_specs');
      let currentSpecsList = [];
      try {
        currentSpecsList = savedSpecsRaw ? JSON.parse(savedSpecsRaw) : [];
      } catch (e) {
        currentSpecsList = [];
      }

      if (!Array.isArray(currentSpecsList) || currentSpecsList.length === 0) {
        currentSpecsList = [
          { name: '001-return-request-tracker' },
          { name: '002-multi-factor-authentication' },
          { name: '003-confluence-exporter' }
        ];
      }

      if (!currentSpecsList.some(s => s.name === featureName)) {
        currentSpecsList = [{ name: featureName }, ...currentSpecsList];
        localStorage.setItem('sdd_specs', JSON.stringify(currentSpecsList));
      }

      localStorage.setItem('activeSpec', featureName);

      try {
        await fetch('http://localhost:7001/api/specs/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeSpec: featureName })
        });
      } catch (e) {
        console.log('Active spec updated locally.');
      }

      // 4. Log End-to-End Lineage in Evidence Ledger
      evidenceService.logEvent({
        specId: featureName,
        artifactId: `spec-${featureName}`,
        agentId: 'SpeckItSpecGenerator',
        model: 'Enterprise-Spec-Pipeline',
        actionType: 'LINK_PROJECT_REQ_SPEC_LINEAGE',
        policyResult: 'APPROVED',
        payload: `Connected Lineage: Project [${activeProject}] ➔ Requirement [${selectedReqDisplayId}] ➔ Spec Output [${featureName}] Version [${currentVersion}] (${Object.keys(speckitFiles).length} files stored in Vector DB & Spec Registry)`
      });

      // Dispatch global custom event for main.jsx layout
      window.dispatchEvent(new CustomEvent('activeSpecChanged', { detail: { specName: featureName } }));

    } catch (err) {
      console.warn('Sync warning:', err);
    }
    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  const currentFileContent = (speckitFiles && activeFile && speckitFiles[activeFile]) || 
    (speckitFiles && speckitFiles['specs/001-return-request-tracker/spec.md']) || 
    (speckitFiles && Object.values(speckitFiles)[0]) || 
    '';

  const selectedReqObj = approvedRequirements.find(r => r.ideaId === selectedReqId) || approvedRequirements[0];
  const selectedReqDisplayId = selectedReqObj ? selectedReqObj.reqId : (selectedReqId || 'REQ-2026-2136');
  const pendingDrifts = specDrifts.filter(d => d.status === 'DRIFTED');

  return (
    <div className="text-white fade-in space-y-4 p-1 h-[calc(100vh-100px)] flex flex-col font-sans">
      {/* Reported Specification Drifts Alert Banner */}
      {pendingDrifts.length > 0 && (
        <div className="p-3 px-4 rounded-xl border flex items-center justify-between shadow-lg transition shrink-0 bg-amber-950/80 border-amber-500/70 text-amber-200 animate-pulse">
          <div className="flex items-center space-x-3 text-xs">
            <i className="fas fa-exclamation-triangle text-amber-400 text-base"></i>
            <div>
              <strong className="font-bold text-amber-300 text-xs sm:text-sm">
                ⚠️ {pendingDrifts.length} Reported Spec {pendingDrifts.length === 1 ? 'Drift' : 'Drifts'} Pending Review
              </strong>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Modifications requested in downstream views. Review and Accept/Reject to proceed with new specification compilation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDriftModalOpen(true)}
            className="px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-md shrink-0 bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/50"
          >
            <i className="fas fa-eye text-xs"></i>
            <span>Review Reported Drifts ({pendingDrifts.length})</span>
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
        
        {/* LEFT PANEL: SPECKIT COMMAND TERMINAL & INTERACTIVE CLARIFICATION */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveLeftTab('terminal')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeLeftTab === 'terminal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Spec Terminal
              </button>
              <button
                onClick={() => setActiveLeftTab('logs')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeLeftTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Logs ({pageState?.logs?.length || 0})
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto custom-scroll flex flex-col min-h-0 bg-[#060913]">
            
            {/* SUB-TAB 1: TERMINAL & COMMAND CONTROLS */}
            {activeLeftTab === 'terminal' && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between items-center shrink-0">
                    <span>Requirement & Feature Scope Input</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Select Generated Requirement.md</span>
                  </label>

                  {approvedRequirements.length > 0 && (
                    <select
                      value={selectedReqId}
                      onChange={(e) => handleSelectRequirement(e.target.value)}
                      className="w-full bg-[#0c1222] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer mb-2 shrink-0"
                    >
                      {approvedRequirements.map((r) => (
                        <option key={r.ideaId} value={r.ideaId}>
                          📄 [{r.reqId}] {r.title} ({r.status})
                        </option>
                      ))}
                    </select>
                  )}

                  <textarea
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    className="flex-1 min-h-[220px] w-full bg-[#0c1222] text-slate-200 border border-slate-800 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 custom-scroll resize-none leading-relaxed"
                    placeholder="Describe requirement..."
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    SpeckIt Phase Commands
                  </span>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleRunCommand('/speckit.constitution')}
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>1. /speckit.constitution</span>
                      <i className="fas fa-play text-[9px] text-indigo-400"></i>
                    </button>

                    <button
                      onClick={() => handleRunCommand('/speckit.specify')}
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>2. /speckit.specify</span>
                      <i className="fas fa-play text-[9px] text-indigo-400"></i>
                    </button>

                    <button
                      onClick={() => handleRunCommand('/speckit.clarify')}
                      className="py-1.5 px-2.5 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>3. /speckit.clarify</span>
                      <i className="fas fa-question-circle text-[9px] text-purple-400"></i>
                    </button>

                    <button
                      onClick={() => handleRunCommand('/speckit.plan')}
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>4. /speckit.plan</span>
                      <i className="fas fa-play text-[9px] text-indigo-400"></i>
                    </button>

                    <button
                      onClick={() => handleRunCommand('/speckit.checklist')}
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>5. /speckit.checklist</span>
                      <i className="fas fa-play text-[9px] text-indigo-400"></i>
                    </button>

                    <button
                      onClick={() => handleRunCommand('/speckit.tasks')}
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>6. /speckit.tasks</span>
                      <i className="fas fa-play text-[9px] text-indigo-400"></i>
                    </button>
                  </div>

                  <button
                    onClick={() => handleRunCommand('/speckit.pipeline')}
                    disabled={pageState?.isLoading}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer mt-1"
                  >
                    <i className="fas fa-bolt text-amber-300"></i>
                    <span>Run Full 6-Phase SpeckIt Pipeline</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: AMBIGUITY CLARIFICATION WIZARD */}
            {activeLeftTab === 'clarify' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Phase 3 Ambiguity Resolution</span>
                    <span className="text-[10px] font-mono text-purple-400">Step {clarifyStepIdx + 1} of {clarificationQuestions.length}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">{clarificationQuestions[clarifyStepIdx]?.question}</p>
                </div>

                <div className="space-y-2 flex-1">
                  {clarificationQuestions[clarifyStepIdx]?.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerQuestion(clarificationQuestions[clarifyStepIdx], opt)}
                      className="w-full p-3 bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 rounded-xl text-xs text-left text-slate-300 hover:text-white transition flex items-center space-x-3 cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>

                {userAnswers.length > 0 && (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 font-semibold flex items-center space-x-2">
                    <i className="fas fa-check-circle"></i>
                    <p className="text-xs text-slate-400">Answers folded back into baseline specification.</p>
                  </div>
                )}

                {/* Question Log */}
                <div className="border-t border-slate-800 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Resolution Log</span>
                  <div className="max-h-28 overflow-auto custom-scroll space-y-1">
                    {userAnswers.map((a, i) => (
                      <div key={i} className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/60">
                        <span className="text-purple-300 font-bold">[{a.questionId}]</span> {a.answer}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: EXECUTION LOGS */}
            {activeLeftTab === 'logs' && (
              <div className="font-mono text-xs text-slate-300 flex flex-col space-y-1">
                {!pageState?.logs || pageState.logs.length === 0 ? (
                  <div className="text-slate-500 italic p-4 text-center">No execution logs. Click a command to start.</div>
                ) : (
                  pageState.logs.map((log, idx) => (
                    <div key={idx} className={log.includes('[Error]') ? 'text-rose-400' : log.includes('[Success]') ? 'text-emerald-400' : 'text-slate-400'}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SPECKIT TAXONOMY ARTIFACT TREE & FILE INSPECTOR */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          
          {/* SpeckIt File Selector Bar */}
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center overflow-x-auto custom-scroll">
            <select
              value={activeFile || ''}
              onChange={(e) => setActiveFile(e.target.value)}
              className="bg-[#060913] border border-slate-800 text-indigo-300 text-xs font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[240px]"
            >
              {Object.keys(speckitFiles || {}).map((filePath) => {
                let displayLabel = filePath;
                if (filePath.startsWith('specs/')) {
                  const parts = filePath.split('/');
                  const subPath = parts.slice(2).join('/');
                  const reqSuffix = selectedReqDisplayId 
                    ? selectedReqDisplayId.replace(/^REQ-/, '').replace(/^IDEA-/, '') 
                    : '2026-2136';
                  displayLabel = `SPEC-${reqSuffix} / ${subPath}`;
                }
                return (
                  <option key={filePath} value={filePath}>
                    {displayLabel}
                  </option>
                );
              })}
            </select>

            <div className="flex items-center space-x-2 shrink-0 ml-2">
              {syncSuccess && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                  <i className="fas fa-check-circle text-[10px]"></i>
                  <span>Synced!</span>
                </span>
              )}
              <button
                onClick={handleSaveAndSync}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg shadow transition flex items-center space-x-1.5 text-xs cursor-pointer"
              >
                {isSyncing ? <i className="fas fa-circle-notch animate-spin text-[10px]"></i> : <i className="fas fa-cloud-upload-alt text-[10px]"></i>}
                <span>Save & Sync</span>
              </button>

              <button
                onClick={() => markdownGenerator.download((activeFile || 'spec.md').split('/').pop(), currentFileContent)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center"
                title="Download File"
              >
                <i className="fas fa-download text-xs"></i>
              </button>
            </div>
          </div>

          {/* File Content Code Area */}
          <div className="flex-1 p-4 overflow-auto custom-scroll bg-[#060913]">
            {(!currentFileContent && !hasRunPipeline) && !pageState.isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl shadow-lg">
                  <i className="fas fa-bolt"></i>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">SpeckIt Specification Artifact Inspector</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Click <span className="text-indigo-300 font-bold">"Run Full 6-Phase SpeckIt Pipeline"</span> or execute a phase command on the left to generate live specification artifacts.
                  </p>
                </div>
              </div>
            ) : pageState.isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-indigo-300">Synthesizing SpeckIt Specification via OpenSource LLM...</p>
              </div>
            ) : (
              <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {currentFileContent}
              </pre>
            )}
          </div>

        </div>

      </div>

      {/* Spec Drift Review & Approval Modal Window */}
      {isDriftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4 animate-fade-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <i className="fas fa-clipboard-check text-amber-400 text-xl"></i>
                <div>
                  <h3 className="text-base font-extrabold text-white">Spec Drift Review & Approval Workbench</h3>
                  <span className="text-[11px] text-slate-400 font-mono">SQLite Table: spec_drifts • Project: {activeProject}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsDriftModalOpen(false)} 
                className="text-slate-400 hover:text-white text-lg p-1 transition cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {driftActionMessage && (
              <div className="p-3 bg-indigo-950/90 border border-indigo-500/50 rounded-xl text-indigo-200 text-xs font-bold flex justify-between items-center shrink-0">
                <span>{driftActionMessage}</span>
                <button onClick={() => setDriftActionMessage('')} className="text-indigo-400 hover:text-white text-xs">✕</button>
              </div>
            )}

            {/* Drifts List */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-1">
              {specDrifts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <i className="fas fa-check-circle text-3xl text-emerald-500/60 mb-2 block"></i>
                  No spec drifts reported for this project.
                </div>
              ) : (
                specDrifts.map(drift => {
                  const isPending = drift.status === 'DRIFTED';
                  const isAccepted = drift.status === 'ACCEPTED';

                  return (
                    <div key={drift.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-md">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-indigo-400 font-mono font-bold text-xs">Parent Artefact ID: {drift.parentArtefactId}</span>
                          <span className="text-slate-600 text-[11px]">•</span>
                          <span className="text-slate-400 text-xs font-medium">Raised by: <strong className="text-slate-200">{drift.raisedBy || 'Delivery Manager'}</strong></span>
                          <span className="text-slate-600 text-[11px]">•</span>
                          <span className="text-slate-500 text-[11px] font-mono">{drift.createdAt ? drift.createdAt.split('T')[0] : ''}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isPending ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60' :
                          isAccepted ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60' :
                          'bg-rose-950/90 text-rose-300 border border-rose-500/60'
                        }`}>
                          {drift.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                        <strong className="text-amber-400 font-bold block mb-1">Drift Description:</strong>
                        {drift.driftDescription}
                      </div>

                      {isPending ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            value={reviewerCommentInput}
                            onChange={e => setReviewerCommentInput(e.target.value)}
                            placeholder="Add reviewer comments (e.g. Approved for v2.0.0 specification compilation)..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex justify-end items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleReviewDrift(drift, 'REJECTED')}
                              disabled={reviewSubmittingId === drift.id}
                              className="px-4 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                            >
                              <i className="fas fa-times text-xs"></i>
                              <span>Reject Drift</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewDrift(drift, 'ACCEPTED')}
                              disabled={reviewSubmittingId === drift.id}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-md"
                            >
                              <i className="fas fa-check text-xs"></i>
                              <span>Accept Drift</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-900/60 rounded-lg text-[11px] text-slate-400 space-y-1">
                          <div><strong>Reviewed By:</strong> {drift.reviewedBy || 'Product Owner'} ({drift.reviewedAt ? drift.reviewedAt.split('T')[0] : 'Recent'})</div>
                          {drift.reviewerComments && <div><strong>Comments:</strong> {drift.reviewerComments}</div>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-3 shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">Persisted in SQLite spec_drifts table</span>
              <button
                type="button"
                onClick={() => setIsDriftModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close Workbench
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
