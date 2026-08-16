/**
 * Layer 0 Evidence-Grounded Requirement Compiler
 * Synthesizes authoritative IEEE-830 / ISO-29148 standard Requirement.md specifications.
 * Connects to configured MODEL_GATEWAY_URL (set in environment) for LLM model synthesis.
 */

import { ENGINE_REGISTRY, invokeModelAdapter } from './engineRegistry.js';

export async function compileRequirementDocument(ideaState, forceTier = 'AUTO') {
  const brief = ideaState.ideaBrief || {};
  const discovery = ideaState.discovery || {};
  const market = ideaState.competitorResearch || {};
  const enterprise = ideaState.enterpriseAnalysis || {};
  const finance = ideaState.financeAnalysis || {};

  const rawNum = (ideaState.ideaId || '001').replace(/\D/g, '');
  const numStr = rawNum ? String(parseInt(rawNum.slice(-3), 10) || 1).padStart(3, '0') : '001';
  const requirementId = (ideaState.ideaId && ideaState.ideaId.startsWith('REQ')) ? ideaState.ideaId : `REQ${numStr}`;
  const compiledDate = new Date().toISOString().split('T')[0];

  let modelEnrichment = null;
  const targetModel = process.env.ENTERPRISE_LLM_MODEL || 'gemini-2.5-flash';

  const title = brief.title || 'Enterprise Software Initiative';
  const rawInput = ideaState.originalInput || brief.title || '';
  const problemHypothesis = brief.problemHypothesis || 'Business stakeholders experience operational tracking overhead and manual friction.';
  const proposedSolution = brief.proposedSolution || 'Task-aware automated requirement formation pipeline.';
  const targetPersonas = (brief.targetPersonas || ['Enterprise Stakeholder', 'Business Analyst', 'Operations Lead']).join(', ');
  const inScope = (enterprise.scope || ['Centralized dashboard tracking', 'Role-based access control', 'Audit logging']).join('; ');
  const impactedSystems = (enterprise.impactedSystems || ['Core Enterprise DB', 'REST APIs', 'Auth Gateway']).join('; ');

  try {
    const prompt = `Synthesize a rigorous, highly detailed, enterprise-grade Requirement Specification Document adhering strictly to IEEE-830 / ISO-29148 Standards for:

Title: "${title}"
Raw Intake Signal: "${rawInput}"
Problem Statement: "${problemHypothesis}"
Proposed Solution Overview: "${proposedSolution}"
Target User Personas: ${targetPersonas}
In-Scope Boundaries: ${inScope}
Impacted Enterprise Systems: ${impactedSystems}
Financial ROI: ${finance.annualNetBenefit ? `Annual Net Benefit ₹${finance.annualNetBenefit.toLocaleString('en-IN')}, ROI ${finance.roiPercentage}%` : 'Standard enterprise ROI threshold'}

CRITICAL INSTRUCTIONS:
- DO NOT INCLUDE ANY SECTION FOR "Idea Origin & Discovery Evidence" OR PROVENANCE LEDGERS.
- Make every requirement section exhaustive, professional, and detailed enough for software engineering handoff.
- Use explicit identifiers for all functional rules (BR-001, BR-002...) and acceptance criteria (AC-001.1, AC-001.2...).
- Use explicit identifiers for all quality SLAs (NFR-01, NFR-02...).

Output structure (Markdown):

# Requirement Specification: ${title}

## 1. Executive Summary & Business Objectives
(Comprehensive 3-paragraph breakdown of domain background, core business pain points, and strategic objectives)

## 2. Target Solution Scope & System Boundaries
### 2.1 In-Scope Functional Capabilities
(Detailed functional features with explicit BR-xxx tags)
### 2.2 Out-of-Scope & System Exclusions
(Clear architectural boundaries and explicit exclusions)
### 2.3 System Integration & Data Contracts
(Data entities, API protocols, database schemas, and integration workflows)

## 3. User Personas & Access Control Matrix
(Detailed user roles, permissions, and workflow interaction models)

## 4. Detailed Functional Requirements & Acceptance Criteria
### 4.1 Business Rules & Processing Logic
- **[BR-001]** ...
- **[BR-002]** ...
- **[BR-003]** ...
### 4.2 Acceptance Criteria (Given-When-Then)
- **[AC-001.1]** ...
- **[AC-001.2]** ...
- **[AC-002.1]** ...

## 5. Non-Functional Requirements & Operational SLAs
- **[NFR-01 Security & Data Encryption]** ...
- **[NFR-02 SLA & Response Latency]** ...
- **[NFR-03 Audit & Compliance Retention]** ...
- **[NFR-04 Availability & Disaster Recovery]** ...

## 6. Financial ROI & Sensitivity Analysis
(Detailed breakdown of cost savings, productivity gains, payback period, and ROI metrics)`;

    const res = await invokeModelAdapter({
      modelName: targetModel,
      prompt,
      systemInstruction: 'You are a Senior Principal Requirements Engineer and Enterprise Solutions Architect generating production-ready ISO/IEEE requirement specification documents.'
    });

    if (res.success && res.text && res.text.trim().length > 300) {
      modelEnrichment = {
        model: res.modelUsed || targetModel,
        text: res.text.trim(),
        tokens: res.tokens,
        latencyMs: res.latencyMs
      };
    }
  } catch (err) {
    console.warn('[RequirementCompiler] Model synthesis note:', err.message);
  }

  let fullMarkdown = '';

  const headerMeta = `---
title: "Requirement Specification: ${title}"
documentId: "${requirementId}"
sourceIdeaId: "${brief.ideaId || 'IDEA-001'}"
inputType: "${brief.inputType || 'IDEA'}"
compiledDate: "${compiledDate}"
status: "APPROVED — IEEE-830 Standard Requirement Specification"
---

`;

  if (modelEnrichment?.text) {
    // LLM generated detailed document
    if (modelEnrichment.text.startsWith('# ')) {
      fullMarkdown = headerMeta + modelEnrichment.text;
    } else {
      fullMarkdown = headerMeta + `# Requirement Specification: ${title}\n\n` + modelEnrichment.text;
    }
  } else {
    // Fallback standard IEEE-830 specification (Strictly excluding Section 2 Idea Origin & Evidence)
    const inScopeList = (enterprise.scope || []).map(s => `- **[BR-SCOPE]** ${s}`).join('\n') || '- **[BR-SCOPE]** Automated tracking, validation, and dashboard status reporting.';
    const outScopeList = (enterprise.outOfScope || []).map(o => `- ${o}`).join('\n') || '- Legacy infrastructure hardware decommissioning (Out of Scope)';

    let finSummary = '- **Annual Net Benefit:** TBD based on operational inputs\n- **Simple ROI:** TBD\n- **Payback Period:** TBD';
    if (finance.status === 'CALCULATED') {
      finSummary = `- **Annual Net Benefit:** ₹${(finance.annualNetBenefit || 0).toLocaleString('en-IN')}\n- **Simple ROI:** ${finance.roiPercentage}%\n- **Payback Period:** ${finance.paybackMonths} Months`;
    }

    fullMarkdown = `${headerMeta}# Requirement Specification: ${title}

**Document ID:** ${requirementId}  
**Source Idea ID:** ${brief.ideaId || 'IDEA-001'}  
**Input Type:** ${brief.inputType || 'IDEA'}  
**Compiled Date:** ${compiledDate}  
**Specification Standard:** IEEE-830 / ISO-29148  

---

## 1. Executive Summary & Business Objectives
### 1.1 Problem Background
${problemHypothesis}

### 1.2 Strategic Objectives
- **Automate Operational Workflows:** Reduce manual tracking friction and processing turnaround time.
- **Enforce Enterprise Governance:** Maintain full auditability and operational compliance across business transactions.
- **Centralize Status Visibility:** Provide real-time operational metrics and status dashboards for enterprise stakeholders.

---

## 2. Target Solution Scope & System Boundaries
### 2.1 Proposed Solution Overview
${proposedSolution}

### 2.2 In-Scope Functional Capabilities
${inScopeList}

### 2.3 Out-of-Scope Boundaries
${outScopeList}

### 2.4 System Integration & Data Dependencies
- **Impacted Systems:** ${impactedSystems}
- **Data Protocol:** RESTful API with HTTPS TLS 1.3 encryption and JSON payload contracts.

---

## 3. User Personas & Access Control Matrix
- **Primary Submitter / Stakeholder:** ${brief.submitter || 'Delivery Manager'} — Full intake submission, status tracking, and requirement review privileges.
- **Business Analyst / Architect:** Solution scope refinement, business rule validation, and spec approval authority.
- **System Administrator:** System configuration, role management, and audit log inspection.

---

## 4. Functional Requirements & Acceptance Criteria
### 4.1 Business Rules (BR)
- **[BR-001 Validation]** The system shall validate all intake signals for completeness, mandatory fields, and formatting constraints prior to processing.
- **[BR-002 Unique Identifier]** The system shall assign a unique tracking identifier (${requirementId}) to every ingested initiative.
- **[BR-003 Audit Trail]** The system shall record timestamped audit logs for all state transitions and governance approvals.

### 4.2 Acceptance Criteria (AC)
- **[AC-001.1]** Given a valid input payload, when submitted, then the system processes the intake signal and transitions the initiative state to PENDING_HUMAN_REVIEW within 2 seconds.
- **[AC-001.2]** Given invalid or missing mandatory parameters, when submitted, then the system displays detailed validation warnings and prevents state progression.

---

## 5. Non-Functional Requirements & Operational SLAs
- **[NFR-01 Security & Data Encryption]** All data in transit shall be encrypted using TLS 1.3. Data at rest shall be stored using AES-256 encryption.
- **[NFR-02 SLA & Latency]** System API endpoints shall respond within 800ms under normal load (p95 latency threshold).
- **[NFR-03 Availability]** System uptime SLA shall meet 99.9% availability during business operating hours.
- **[NFR-04 Audit Retention]** System audit logs and decision records shall be retained for 7 years to meet enterprise compliance policies.

---

## 6. Financial ROI & Sensitivity Analysis
${finSummary}
`;
  }

  return {
    requirementId,
    title,
    markdown: fullMarkdown,
    sectionCount: 6,
    compiledAt: new Date().toISOString(),
    status: 'APPROVED',
    modelEnrichment
  };
}
