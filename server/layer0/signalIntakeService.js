/**
 * FrugalForge Enterprise Signal Intake Service
 * Manages authenticated REST ingestion, schema validation, idempotency,
 * evidence ledger mapping, and initiative creation for Gmail/Meet signals.
 * Persists all records into SQLite database via dbService.
 */

import { dbService } from '../../db.js';
import { EvidenceLedger } from './evidenceLedger.js';
import { routeTaskRequest } from './intelligenceRouter.js';

const CATEGORY_MAP = {
  BUSINESS_PROBLEM: 'PROBLEM',
  BUSINESS_OBJECTIVE: 'OBJECTIVE',
  REQUEST: 'REQUEST',
  OBLIGATION: 'OBLIGATION',
  DECISION: 'DECISION',
  BUSINESS_RULE: 'RULE',
  RISK: 'RISK',
  CONSTRAINT: 'CONSTRAINT',
  DEPENDENCY: 'DEPENDENCY',
  INTEGRATION: 'INTEGRATION',
  NFR: 'NFR',
  SECURITY_REQUIREMENT: 'SECURITY',
  COMPLIANCE_REQUIREMENT: 'COMPLIANCE',
  DEADLINE: 'DEADLINE',
  MEASURABLE_IMPACT: 'IMPACT',
  ASSUMPTION: 'ASSUMPTION'
};

export const signalIntakeService = {
  // Validate authentication and headers
  authenticateRequest: (headers) => {
    const authHeader = headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const source = headers['x-signal-source'] || '';
    const schemaVersion = headers['x-signal-schema-version'] || '1.0';

    const validToken = process.env.SIGNAL_INTAKE_API_TOKEN || 'frugalforge-signal-poc-bearer-token-2026';
    const allowedSources = (process.env.ALLOWED_SIGNAL_SOURCES || 'GoogleEnterpriseSignalPOC').split(',').map(s => s.trim());

    if (!token || token !== validToken) {
      return { valid: false, code: 401, error: 'Unauthorized: Invalid or missing Signal Intake Bearer API Token.' };
    }

    if (!source || !allowedSources.includes(source)) {
      return { valid: false, code: 403, error: `Forbidden: Signal source '${source}' is not in the allowed sources whitelist.` };
    }

    if (schemaVersion !== '1.0') {
      return { valid: false, code: 422, error: `Unprocessable Entity: Unsupported schema version '${schemaVersion}'. Required: '1.0'.` };
    }

    return { valid: true };
  },

  // Validate payload against Schema v1.0 & Governance rules
  validatePayload: (payload) => {
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Payload must be a valid JSON object.' };
    }

    if (payload.schemaVersion !== '1.0') {
      return { valid: false, error: "schemaVersion must be '1.0'." };
    }

    const { signal, statements } = payload;
    if (!signal || !signal.signalId || !signal.candidateTitle) {
      return { valid: false, error: 'Signal metadata (signalId, candidateTitle) is missing.' };
    }

    if (signal.review?.status !== 'CONFIRMED') {
      return { valid: false, error: 'Signal review status must be CONFIRMED.' };
    }

    if (!signal.governance?.consentConfirmed) {
      return { valid: false, error: 'Signal governance consentConfirmed must be true.' };
    }

    if (!signal.governance?.sensitivity) {
      return { valid: false, error: 'Signal governance sensitivity classification is required.' };
    }

    if (!signal.provenance?.contentHash) {
      return { valid: false, error: 'Signal provenance contentHash is required.' };
    }

    if (!Array.isArray(statements) || statements.length === 0) {
      return { valid: false, error: 'Payload must contain at least one statement.' };
    }

    // Filter confirmed/edited statements
    const validStatements = statements.filter(s =>
      (s.reviewStatus === 'CONFIRMED' || s.reviewStatus === 'EDITED') &&
      Array.isArray(s.sourceReferences) &&
      s.sourceReferences.length > 0
    );

    if (validStatements.length === 0) {
      return { valid: false, error: 'Zero confirmed or edited statements with valid source references found in payload.' };
    }

    return { valid: true, validStatements };
  },

  // Process incoming signal import with Idempotency & Versioning
  importSignal: async (payload, headers = {}) => {
    const authCheck = signalIntakeService.authenticateRequest(headers);
    if (!authCheck.valid) return authCheck;

    const valCheck = signalIntakeService.validatePayload(payload);
    if (!valCheck.valid) {
      return { valid: false, code: 422, error: valCheck.error };
    }

    const { signal } = payload;
    const { validStatements } = valCheck;
    const signals = dbService.getAllSignals();

    const sourceSystem = signal.source.sourceSystem;
    const sourceObjectId = signal.source.sourceObjectId;
    const contentHash = signal.provenance.contentHash;

    const idempotencyKey = `${sourceSystem}:${sourceObjectId}:${contentHash}`;

    // 1. Check exact duplicate
    const exactDup = signals.find(s => s.idempotencyKey === idempotencyKey);
    if (exactDup) {
      return {
        valid: true,
        code: 409,
        status: 'DUPLICATE',
        message: `Signal ${signal.signalId} is an exact duplicate. Existing importId: ${exactDup.importId}`,
        importId: exactDup.importId,
        importedIdeaId: exactDup.importedIdeaId || null,
        signalRecord: exactDup
      };
    }

    // 2. Check content hash update
    const previousVersion = signals.filter(s => s.sourceSystem === sourceSystem && s.sourceObjectId === sourceObjectId);
    const newVersionNum = previousVersion.length + 1;
    const isUpdate = previousVersion.length > 0;

    const importId = `IMP-SIG-${Date.now().toString().slice(-6)}`;
    const uiBase = process.env.SIGNAL_CONNECTOR_UI_URL || 'http://localhost:7070';
    const deepLink = signal.source.sourceDeepLink || `${uiBase}/signals/${encodeURIComponent(signal.signalId)}`;

    const newRecord = {
      importId,
      idempotencyKey,
      schemaVersion: payload.schemaVersion || '1.0',
      publicationId: payload.publicationId || `PUB-${Date.now()}`,
      sourceApplication: payload.sourceApplication || 'GoogleEnterpriseSignalPOC',
      signalId: signal.signalId,
      sourceSystem,
      sourceType: signal.source.sourceType,
      connectorMode: signal.source.connectorMode,
      sourceObjectId,
      sourceDeepLink: deepLink,
      contentHash,
      candidateTitle: signal.candidateTitle,
      originalSourceTitle: signal.originalSourceTitle || signal.candidateTitle,
      sensitivity: signal.governance.sensitivity,
      containsPotentialPII: Boolean(signal.governance.containsPotentialPII),
      piiCategories: signal.governance.piiCategories || [],
      reviewedBy: signal.review.reviewedBy || 'Signal Reviewer',
      reviewedAt: signal.review.reviewedAt || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      status: isUpdate ? 'UPDATED' : 'READY_TO_IMPORT',
      version: newVersionNum,
      statements: validStatements,
      unresolvedQuestions: payload.unresolvedQuestions || [],
      stakeholderViewpoints: payload.stakeholderViewpoints || [],
      conflicts: payload.conflicts || [],
      actionItems: payload.actionItems || []
    };

    dbService.upsertSignal(newRecord);

    return {
      valid: true,
      code: 201,
      status: isUpdate ? 'UPDATED' : 'RECEIVED',
      message: `Signal ${signal.signalId} imported successfully as ${importId} (v${newVersionNum}).`,
      importId,
      signalRecord: newRecord
    };
  },

  // Map imported signal to Layer 0 Evidence Ledger & create Idea Brief
  createInitiativeFromSignal: async (importId) => {
    const sig = dbService.getSignalById(importId);
    if (!sig) {
      return { success: false, error: `Imported signal ${importId} not found.` };
    }

    const ideaId = `IDEA-SIG-${Date.now().toString().slice(-4)}`;

    // 1. Build evidence items
    const ledger = new EvidenceLedger();
    
    // Parent Evidence
    ledger.addEvidence({
      statement: `Imported signal '${sig.candidateTitle}' via ${sig.sourceSystem} (${sig.connectorMode})`,
      type: 'ORIGINAL_INPUT',
      source: sig.reviewedBy,
      confidence: 'HIGH',
      verificationStatus: 'CONFIRMED_BY_SOURCE_REVIEWER',
      sourceReferences: [sig.sourceObjectId],
      deepLink: sig.sourceDeepLink
    });

    // Child Evidence Items from Confirmed Statements
    sig.statements.forEach((stmt) => {
      const mappedCategory = CATEGORY_MAP[stmt.primaryCategory] || 'STATEMENT';
      let refStr = 'Source Reference';
      if (Array.isArray(stmt.sourceReferences)) {
        refStr = stmt.sourceReferences.map(r => typeof r === 'string' ? r : (r.messageId || r.quote || 'Ref')).join(', ');
      }
      const deepLinkWithRef = `${sig.sourceDeepLink}?ref=${encodeURIComponent(refStr)}`;

      ledger.addEvidence({
        statement: `[${stmt.primaryCategory}] ${stmt.text}`,
        type: mappedCategory,
        source: stmt.speaker ? `${stmt.speaker} (${stmt.speakerRole || 'Stakeholder'})` : sig.reviewedBy,
        confidence: stmt.confidence || 'HIGH',
        verificationStatus: 'CONFIRMED_BY_SOURCE_REVIEWER',
        sourceReferences: stmt.sourceReferences,
        deepLink: deepLinkWithRef
      });
    });

    // Extract Problems, Objectives, Facts, Unknowns
    const problemStmts = sig.statements.filter(s => s.primaryCategory === 'BUSINESS_PROBLEM').map(s => s.text);
    const objectiveStmts = sig.statements.filter(s => s.primaryCategory === 'BUSINESS_OBJECTIVE').map(s => s.text);
    const solutionStmts = sig.statements.filter(s => s.primaryCategory === 'REQUEST' || s.primaryCategory === 'BUSINESS_OBJECTIVE').map(s => s.text);
    const decisionStmts = sig.statements.filter(s => s.primaryCategory === 'DECISION' || s.primaryCategory === 'BUSINESS_RULE').map(s => s.text);
    const assumptionStmts = sig.statements.filter(s => s.primaryCategory === 'ASSUMPTION').map(s => s.text);

    const rawProblem = problemStmts.length > 0
      ? problemStmts.join(' ')
      : `Operational friction, manual compilation overhead, and tracking delays identified in ${sig.candidateTitle}.`;
    const problemHypothesis = rawProblem.length >= 80
      ? rawProblem
      : `${rawProblem} Manual tracking and manual verification cause operational bottlenecks for enterprise stakeholders.`;

    const proposedSolution = solutionStmts.length > 0
      ? solutionStmts.join(' ')
      : `Automated solution for ${sig.candidateTitle}.`;

    let ideaState = {
      ideaId,
      projectId: sig.projectId || 'sdd-enterprise-dev',
      version: 1,
      originalInput: `Signal Import (${sig.sourceSystem}): ${sig.candidateTitle}`,
      inputType: sig.sourceType === 'GMAIL_THREAD' ? 'IDEA' : 'OPERATIONAL_INCIDENT',
      submitter: sig.reviewedBy || 'Signal Reviewer',
      title: sig.candidateTitle,
      createdAt: new Date().toISOString(),
      executionTrace: [],
      evidence: ledger.getAllEvidence(),
      ideaBrief: {
        ideaId,
        title: sig.candidateTitle,
        inputType: sig.sourceType === 'GMAIL_THREAD' ? 'IDEA' : 'OPERATIONAL_INCIDENT',
        submitter: sig.reviewedBy,
        problemHypothesis,
        proposedSolution,
        targetPersonas: sig.stakeholderViewpoints && sig.stakeholderViewpoints.length > 0
          ? sig.stakeholderViewpoints.map(v => v.role || v.stakeholder).filter(Boolean)
          : [sig.reviewedBy || 'Delivery Manager', 'Business Analyst', 'Operations Lead'],
        expectedOutcomes: objectiveStmts,
        knownFacts: decisionStmts,
        assumptions: assumptionStmts,
        unknowns: (sig.unresolvedQuestions || []).map(q => typeof q === 'string' ? q : (q.statement || q.question || q.text || JSON.stringify(q))),
      },
      discovery: {
        questionsAsked: (sig.unresolvedQuestions || []).map(q => typeof q === 'string' ? q : (q.statement || q.question || q.text || JSON.stringify(q))),
        responses: []
      }
    };

    // Link import to created idea in SQLite immediately
    sig.importedIdeaId = ideaId;
    sig.status = 'IMPORTED';
    dbService.upsertSignal(sig);

    // Save initial idea into SQLite DB storage immediately
    dbService.upsertLayer0Idea(ideaState);

    // Seed Full Discovery Pipeline across all tabs asynchronously in background
    (async () => {
      let enrichedState = { ...ideaState };
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'GENERATE_DISCOVERY_QUESTION' }); } catch (e) { console.warn('Discovery question note:', e.message); }
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'RESEARCH_MARKET' }); } catch (e) { console.warn('Market research note:', e.message); }
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'ANALYZE_ENTERPRISE_IMPACT' }); } catch (e) { console.warn('Impact analysis note:', e.message); }
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'CALCULATE_FINANCE', payload: { financeInputs: { userCount: 25, hoursSavedPerMonth: 5, hourlyRate: 45, implementationCost: 15000, maintenanceCostAnnual: 2500 } } }); } catch (e) { console.warn('Finance calculation note:', e.message); }
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'SYNTHESIZE_REQUIREMENT_SECTION' }); } catch (e) { console.warn('Requirement synthesis note:', e.message); }
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'QUALITY_AUDIT' }); } catch (e) { console.warn('Quality audit note:', e.message); }
      try { enrichedState = await routeTaskRequest({ ideaState: enrichedState, taskType: 'EVALUATE_GOVERNANCE' }); } catch (e) { console.warn('Governance evaluation note:', e.message); }
      dbService.upsertLayer0Idea(enrichedState);
    })();

    return {
      success: true,
      importId,
      ideaId,
      ideaState
    };
  },

  // Reject Signal
  rejectSignal: (importId, comments = '') => {
    const sig = dbService.getSignalById(importId);
    if (!sig) return { success: false, error: `Imported signal ${importId} not found.` };

    sig.status = 'REJECTED';
    sig.rejectComments = comments;
    dbService.upsertSignal(sig);

    return { success: true, importId, signal: sig };
  },

  // Get All Signals
  getSignals: () => dbService.getAllSignals(),

  // Get Signal by Import ID
  getSignalById: (importId) => dbService.getSignalById(importId),

  // Update Signal Status to HANDED_OFF_TO_SDD on SDD Framework Handoff
  updateSignalStatusOnHandoff: (ideaId) => {
    const signals = dbService.getAllSignals();
    const sig = signals.find(s => s.importedIdeaId === ideaId || s.ideaId === ideaId);
    if (sig) {
      sig.status = 'HANDED_OFF_TO_SDD';
      sig.handedOffAt = new Date().toISOString();
      dbService.upsertSignal(sig);
      return sig;
    }
    return null;
  },

  // Delete Signal by Import ID
  deleteSignal: (importId) => {
    const sig = dbService.getSignalById(importId);
    if (!sig) return { success: false, error: `Imported signal ${importId} not found.` };

    dbService.deleteSignal(importId);
    return { success: true, importId, message: `Signal ${importId} deleted successfully.` };
  },

  // Clear All Signals
  clearAllSignals: () => {
    dbService.clearAllSignals();
    return { success: true, message: 'All enterprise signals cleared successfully.' };
  }
};
