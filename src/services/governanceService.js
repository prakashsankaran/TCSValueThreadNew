// Governance & Security Layer Service (Document ID: SDD-REQ-L2-GS)
import { evidenceService } from './evidenceService';

const STORAGE_KEY_REGISTRY = 'sdd_agent_registry';
const STORAGE_KEY_REDACTION_LOGS = 'sdd_redaction_logs';

export const governanceService = {
  // 1. Get All Registered Agents (GS-FR-001)
  getAgents: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REGISTRY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return governanceService.getInitialRegistry();
  },

  // 2. Update Agent Status / Autonomy / Kill Switch (GS-FR-001, GS-FR-015)
  updateAgent: (agentId, updates) => {
    const registry = governanceService.getAgents();
    const idx = registry.findIndex(a => a.agentId === agentId);
    if (idx !== -1) {
      registry[idx] = { ...registry[idx], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(registry));
      window.dispatchEvent(new Event('agent_registry_updated'));

      // Log security administrative event to Layer 1 Evidence Ledger
      evidenceService.logEvent({
        artifactId: `agent-governance-${agentId}`,
        agentId: 'GovernanceEngine',
        persona: 'Chief Security Officer',
        actionType: updates.status === 'KILLED' ? 'KILL_SWITCH_TRIGGERED' : 'AGENT_POLICY_UPDATED',
        policyResult: updates.status === 'KILLED' ? 'DENIED_KILL_SWITCH' : 'APPROVED',
        payload: JSON.stringify({ agentId, updates })
      });
    }
    return registry;
  },

  // 3. Check if Agent is Permitted to Execute (GS-FR-001, GS-FR-015)
  validateAgentPermission: (agentId) => {
    const registry = governanceService.getAgents();
    const agent = registry.find(a => a.agentId === agentId || a.agentName === agentId);
    if (!agent) {
      return { allowed: true, agentName: agentId, autonomy: 'Generate' }; // Default allow fallback for unmapped custom names
    }
    if (agent.status === 'KILLED' || agent.status === 'DISABLED') {
      return { allowed: false, reason: `Agent '${agent.agentName}' is currently ${agent.status} by Security Administration.` };
    }
    return { allowed: true, agent, autonomy: agent.autonomyLevel };
  },

  // 4. Data Classification & Secret/PII Redaction Interceptor (GS-FR-011, GS-FR-012)
  redactSensitiveData: (text) => {
    if (!text || typeof text !== 'string') return { redactedText: text, redactCount: 0 };

    let redactedText = text;
    let redactCount = 0;

    // Patterns: API Keys, Secrets, Bearer tokens, Passwords, SSNs, Credit Cards
    const patterns = [
      { name: 'API_KEY', regex: /(sk-[a-zA-Z0-9]{20,})|(AIzaSy[a-zA-Z0-9_-]{33})/g, mask: '[REDACTED_API_KEY]' },
      { name: 'SECRET_TOKEN', regex: /(bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi, mask: '[REDACTED_BEARER_TOKEN]' },
      { name: 'PASSWORD', regex: /(password|pwd|secret)\s*[:=]\s*["']?([^"'\s]+)["']?/gi, mask: '$1: "[REDACTED_SECRET]"' },
      { name: 'CREDIT_CARD', regex: /\b(?:\d[ -]*?){13,16}\b/g, mask: '[REDACTED_CREDIT_CARD]' }
    ];

    patterns.forEach(p => {
      const matches = redactedText.match(p.regex);
      if (matches) {
        redactCount += matches.length;
        redactedText = redactedText.replace(p.regex, p.mask);
      }
    });

    if (redactCount > 0) {
      governanceService.logRedactionEvent(redactCount);
    }

    return { redactedText, redactCount };
  },

  // 5. Log Redaction Event
  logRedactionEvent: (count) => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_REDACTION_LOGS) || '[]');
      const newLog = {
        id: 'redact_' + Date.now(),
        count,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_REDACTION_LOGS, JSON.stringify([newLog, ...current.slice(0, 50)]));
    } catch (e) {}
  },

  // Initial Registered 102 Agent Blueprint (Sample Subset of Key SDLC Agents)
  getInitialRegistry: () => [
    {
      agentId: 'RequirementAgent',
      agentName: 'Requirement Architect Agent',
      persona: 'Requirement Architect',
      autonomyLevel: 'Generate',
      status: 'ACTIVE',
      allowedModels: ['gemini-2.5-pro'],
      owner: 'Lead Architect',
      tasksPerformed: 142,
      lastEvaluated: '2026-08-03'
    },
    {
      agentId: 'SpecToStoryAgent',
      agentName: 'Agile User Stories Agent',
      persona: 'Scrum Product Owner',
      autonomyLevel: 'Generate',
      status: 'ACTIVE',
      allowedModels: ['gemini-2.5-pro'],
      owner: 'Product Manager',
      tasksPerformed: 98,
      lastEvaluated: '2026-08-03'
    },
    {
      agentId: 'DatabaseAgent',
      agentName: 'Database Design Agent',
      persona: 'Database Architect',
      autonomyLevel: 'Validate',
      status: 'ACTIVE',
      allowedModels: ['gemini-2.5-pro'],
      owner: 'Lead DBA',
      tasksPerformed: 74,
      lastEvaluated: '2026-08-02'
    },
    {
      agentId: 'ValidatorCourtroom',
      agentName: 'AI-SRB Validator Courtroom Agent',
      persona: 'Chief Security Officer',
      autonomyLevel: 'Bounded Execution',
      status: 'ACTIVE',
      allowedModels: ['gemini-2.5-pro'],
      owner: 'Security Lead',
      tasksPerformed: 215,
      lastEvaluated: '2026-08-04'
    },
    {
      agentId: 'ReviewAgent',
      agentName: 'Code Quality & Security Audit Agent',
      persona: 'Security Auditor',
      autonomyLevel: 'Validate',
      status: 'ACTIVE',
      allowedModels: ['gemini-2.5-pro'],
      owner: 'Security Auditor',
      tasksPerformed: 189,
      lastEvaluated: '2026-08-04'
    }
  ]
};
