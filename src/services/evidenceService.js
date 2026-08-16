// Evidence & Measurement Layer Service (Document ID: SDD-REQ-L1-EM)

const STORAGE_KEY_EVIDENCE = 'sdd_evidence_ledger';
const STORAGE_KEY_DECISIONS = 'sdd_decision_log';
const API_BASE = 'http://localhost:7001';

// Cryptographic hash simulation helper
function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sha256_' + Math.abs(hash).toString(16).padStart(12, '0') + Math.random().toString(36).substr(2, 6);
}

export const evidenceService = {
  // 1. Get Evidence Ledger Records (EM-FR-001)
  getLedger: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVIDENCE);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  // 2. Log Append-Only Evidence Event (EM-FR-001, EM-FR-003)
  logEvent: ({
    correlationId,
    specId = '001-return-request-tracker',
    artifactId,
    actorType = 'AGENT',
    actorId = 'PersonaAgent',
    persona = 'Software Engineer',
    agentId = 'AgentOrchestrator',
    model = 'gemini-2.5-pro',
    actionType = 'COMPILE_ARTIFACT',
    policyResult = 'APPROVED',
    payload = ''
  }) => {
    const record = {
      evidenceId: 'EVI-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      correlationId: correlationId || 'CORR-' + Date.now(),
      workspaceId: 'ws-frugal-forge',
      projectId: localStorage.getItem('activeProject') || 'sdd-enterprise-dev',
      specId,
      artifactId: artifactId || 'art-' + Date.now(),
      actorType,
      actorId,
      persona,
      agentId,
      model,
      actionType,
      policyResult,
      payloadHash: generateHash(typeof payload === 'string' ? payload : JSON.stringify(payload)),
      timestamp: new Date().toISOString()
    };

    const history = evidenceService.getLedger();
    const updated = [record, ...history];

    try {
      localStorage.setItem(STORAGE_KEY_EVIDENCE, JSON.stringify(updated));
      window.dispatchEvent(new Event('evidence_ledger_updated'));
      
      // Async sync with backend server if available
      fetch(`${API_BASE}/api/evidence/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch(() => {});
    } catch (e) {}

    return record;
  },

  // 3. Get Decision Records (EM-FR-005, EM-FR-006)
  getDecisions: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DECISIONS);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  clearLedger: () => {
    try {
      localStorage.setItem(STORAGE_KEY_EVIDENCE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify([]));
      window.dispatchEvent(new Event('evidence_ledger_updated'));
      window.dispatchEvent(new Event('decision_log_updated'));
      fetch(`${API_BASE}/api/layer0/evidence/clear`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  // 4. Log Decision or Dissent (EM-FR-005, EM-FR-006)
  logDecision: ({
    type = 'GATE_APPROVAL',
    options = [],
    recommendation = '',
    selectedOption = '',
    rationale = '',
    approvers = [],
    dissent = null,
    conditions = ''
  }) => {
    const record = {
      decisionId: 'DEC-' + Date.now(),
      type,
      options,
      recommendation,
      selectedOption,
      rationale,
      approvers,
      dissent,
      conditions,
      status: dissent ? 'APPROVED_WITH_DISSENT' : 'APPROVED',
      timestamp: new Date().toISOString()
    };

    const current = evidenceService.getDecisions();
    const updated = [record, ...current];

    try {
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('decision_log_updated'));
    } catch (e) {}

    return record;
  },

  // 5. Generate Auditor Manifest Package (EM-FR-012, EM-FR-013)
  generateAuditExport: (filterSpec = '001-return-request-tracker') => {
    const ledger = evidenceService.getLedger().filter(r => !filterSpec || r.specId === filterSpec);
    const decisions = evidenceService.getDecisions();

    const manifest = {
      exportId: 'AUDIT-EXP-' + Date.now(),
      generatedAt: new Date().toISOString(),
      requester: localStorage.getItem('activeUser') || 'Super Admin',
      specId: filterSpec,
      recordCount: ledger.length + decisions.length,
      integrityChecksum: generateHash(JSON.stringify(ledger) + JSON.stringify(decisions)),
      records: {
        evidenceEvents: ledger,
        governanceDecisions: decisions
      }
    };

    return manifest;
  },

  // Initial Sample Datasets for Demo Auditability
  getSampleLedger: () => [
    {
      evidenceId: 'EVI-1785750101',
      correlationId: 'CORR-REQ-8821',
      workspaceId: 'ws-frugal-forge',
      projectId: 'sdd-enterprise-dev',
      specId: '001-return-request-tracker',
      artifactId: 'FSD-Return-Request-v1.0',
      actorType: 'AGENT',
      actorId: 'FunctionalSpecAgent',
      persona: 'Requirement Architect',
      agentId: 'AgentOrchestrator',
      model: 'gemini-2.5-pro',
      actionType: 'COMPILE_FSD',
      policyResult: 'APPROVED',
      payloadHash: 'sha256_9f8a12b4081c',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      evidenceId: 'EVI-1785750202',
      correlationId: 'CORR-REQ-8821',
      workspaceId: 'ws-frugal-forge',
      projectId: 'sdd-enterprise-dev',
      specId: '001-return-request-tracker',
      artifactId: 'JIRA-User-Stories-Backlog',
      actorType: 'AGENT',
      actorId: 'UserStoriesAgent',
      persona: 'Scrum Product Owner',
      agentId: 'SpecToStoryAgent',
      model: 'gemini-2.5-pro',
      actionType: 'DECOMPOSE_STORIES',
      policyResult: 'APPROVED',
      payloadHash: 'sha256_3b7c89f1092e',
      timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    {
      evidenceId: 'EVI-1785750303',
      correlationId: 'CORR-REQ-8821',
      workspaceId: 'ws-frugal-forge',
      projectId: 'sdd-enterprise-dev',
      specId: '001-return-request-tracker',
      artifactId: 'ERD-SQL-Schema',
      actorType: 'AGENT',
      actorId: 'DatabaseDesignAgent',
      persona: 'Database Architect',
      agentId: 'DatabaseAgent',
      model: 'gemini-2.5-pro',
      actionType: 'GENERATE_SCHEMA',
      policyResult: 'APPROVED',
      payloadHash: 'sha256_7a4d56e2014f',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      evidenceId: 'EVI-1785750404',
      correlationId: 'CORR-REQ-8821',
      workspaceId: 'ws-frugal-forge',
      projectId: 'sdd-enterprise-dev',
      specId: '001-return-request-tracker',
      artifactId: 'AI-SRB-Validation-Report',
      actorType: 'AGENT',
      actorId: 'ValidatorAgent',
      persona: 'Chief Security Officer',
      agentId: 'ValidatorCourtroom',
      model: 'gemini-2.5-pro',
      actionType: 'ADVERSARIAL_DEBATE',
      policyResult: 'PASS_WITH_WARNING',
      payloadHash: 'sha256_1c2b3d4e5f6a',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ],

  getSampleDecisions: () => [
    {
      decisionId: 'DEC-8801',
      type: 'STAGE_GATE_3_ARCHITECTURE',
      options: ['Approve Microservice Layout', 'Enforce Monolith Refactor'],
      recommendation: 'Approve Microservice Layout',
      selectedOption: 'Approve Microservice Layout',
      rationale: 'Microservice design satisfies 99.99% availability requirements and maintains independent database isolation.',
      approvers: ['Lead Architect [LA]', 'Chief Security Officer [CSO]'],
      dissent: {
        actor: 'Senior Database Administrator',
        note: 'Expressed concern regarding cross-service eventual consistency latency during peak refund processing windows.'
      },
      conditions: 'Must conduct load tests on RMA payment callback Webhooks prior to production deploy.',
      status: 'APPROVED_WITH_DISSENT',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
      decisionId: 'DEC-8802',
      type: 'SECURITY_COMPLIANCE_GATE',
      options: ['Pass OWASP Top 10 Audit', 'Request Exception'],
      recommendation: 'Pass OWASP Top 10 Audit',
      selectedOption: 'Pass OWASP Top 10 Audit',
      rationale: 'No critical or high severity vulnerabilities discovered during automated DeepSeek-R1 static analysis.',
      approvers: ['Security Auditor [SA]'],
      dissent: null,
      conditions: 'All secrets must be injected via KMS vault at runtime.',
      status: 'APPROVED',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ]
};
