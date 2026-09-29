import React, { useState } from 'react';

// 1. Primary Agents (55 Total from SDD Matrix PDF - 15 Linked Enabled Workspace Modules + 40 Reserve Agents)
export const PRIMARY_AGENTS_55 = [
  { id: 'PA-01', name: 'Evidence Ledger', originalName: 'AI Governance & Evidence Agent', status: 'Enabled', subagents: [], responsibility: 'Governs model access, prompt/output records, data handling, retention and AI audit evidence.', mainOutput: 'AI governance findings; evidence package; blocked unapproved use', capabilities: ['Model Gateway/Router', 'Prompt/Output Registry', 'Data Classification & Redaction', 'Audit Export Service'] },
  { id: 'PA-02', name: 'Trust, Eval & Quality', originalName: 'AI Governance Audit Agent', status: 'Enabled', subagents: [], responsibility: 'Assesses model inventory, data handling, prompt/output evidence, agent permissions and evaluation controls.', mainOutput: 'AI governance control assessment; gaps; risk rating', capabilities: ['Model Gateway/Router', 'Agent Permission Policy', 'Data Classification & Redaction', 'AI Eval Harness'] },
  { id: 'PA-03', name: 'API & Integration Contract Agent', originalName: 'API & Integration Contract Agent', status: 'Disabled', subagents: ['Architecture Drift & Change Impact Agent'], responsibility: 'Designs and validates API, event and integration contracts and monitors architecture drift.', mainOutput: 'OpenAPI/event contracts; compatibility rules; drift report', capabilities: ['Contract-Test Generator', 'Conformance Agent', 'AST/Schema Validator', 'Spec Registry', 'Artifact Graph', 'Change Impact Agent', 'Staleness Detector'] },
  { id: 'PA-04', name: 'Approval & Evidence Readiness Agent', originalName: 'Approval & Evidence Readiness Agent', status: 'Disabled', subagents: ['Release Calendar & Collision Agent', 'Release Notes & Communication Agent'], responsibility: 'Checks mandatory evidence, manages approval readiness, identifies release collisions and prepares communications.', mainOutput: 'Readiness report; approval tasks; release calendar; release notes', capabilities: ['Approval Gate Engine', 'RBAC/SoD Service', 'Human Review Workbench', 'Exception Manager', 'Connector Hub', 'Canonical Artifact Model', 'Event Bus', 'Decision Log', 'Permission-Aware RAG', 'Audit Export Service'] },
  { id: 'PA-05', name: 'Architecture Driver Extraction Agent', originalName: 'Architecture Driver Extraction Agent', status: 'Disabled', subagents: ['NFR & Risk Conformance Agent'], responsibility: 'Extracts functional, NFR, integration, data and constraint drivers from approved specifications.', mainOutput: 'Architecture driver catalogue; NFR-control mapping', capabilities: ['Spec Registry', 'Requirement Quality Agent', 'NFR Agent', 'Domain Rule Validator', 'Policy Engine', 'Threat Model Agent', 'Privacy/Compliance Agent'] },
  { id: 'PA-06', name: 'Bounded Production Execution Agent', originalName: 'Bounded Production Execution Agent', status: 'Disabled', subagents: ['Smoke Test & Health Verification Agent', 'Rollback Decision Support Agent'], responsibility: 'Executes approved deployment steps within policy controls and verifies health and rollback conditions.', mainOutput: 'Execution record; health report; rollback recommendation', capabilities: ['Deployment Gatekeeper', 'Canary/Blast-Radius Controller', 'Agent Permission Policy', 'Evidence Ledger', 'Contract-Test Generator', 'Runtime Evidence Collector', 'Explainability Panel', 'Decision/Dissent Capture'] },
  { id: 'PA-07', name: 'Business Case & Value Analyst Agent', originalName: 'Business Case & Value Analyst Agent', status: 'Disabled', subagents: ['Benefits Realization Agent'], responsibility: 'Synthesizes the business case, expected benefits, investment assumptions and success measures.', mainOutput: 'Value hypothesis; benefit model; KPI baseline', capabilities: ['Value Dashboard', 'SDLC Metrics Store', 'Evidence Ledger', 'AI Adoption Analytics', 'Feedback-to-Eval Pipeline'] },
  { id: 'PA-08', name: 'Functional Spec', originalName: 'Business Rule Validation Agent', status: 'Enabled', subagents: ['Process Change Impact Agent'], responsibility: 'Checks requirements, specifications and outputs against approved domain rules and terminology.', mainOutput: 'Rule-conformance findings; contradictions; process impacts', capabilities: ['Domain Rule Validator', 'Spec Linter', 'Requirement Quality Agent', 'Policy Gate', 'Change Impact Agent', 'Staleness Detector', 'Regeneration Orchestrator'] },
  { id: 'PA-09', name: 'CI/CD Pipeline Generation Agent', originalName: 'CI/CD Pipeline Generation Agent', status: 'Disabled', subagents: ['Build & Deployment Failure Analyst Agent'], responsibility: 'Generates delivery pipelines and diagnoses build and deployment failures.', mainOutput: 'Pipeline definitions; templates; validation and failure analysis', capabilities: ['Policy Gate', 'Conformance Agent', 'Spec Registry', 'Artifact Versioning Service', 'Runtime Evidence Collector', 'Artifact Graph', 'Change Impact Agent', 'Explainability Panel'] },
  { id: 'PA-10', name: 'Code & Dependency Security Analyzer Agent', originalName: 'Code & Dependency Security Analyzer Agent', status: 'Disabled', subagents: ['Security Remediation Support Agent'], responsibility: 'Correlates code, dependency, secret and cloud findings and proposes remediation.', mainOutput: 'Security findings; exploitability ranking; remediation guidance', capabilities: ['AST/Schema Validator', 'Conformance Agent', 'Policy Gate', 'AI Eval Harness', 'Human Review Workbench', 'Evidence Ledger', 'Feedback-to-Eval Pipeline'] },
  { id: 'PA-11', name: 'Code-Quality Analyzer Agent', originalName: 'Code-Quality Analyzer Agent', status: 'Disabled', subagents: ['Technical Debt & Engineering Health Agent'], responsibility: 'Detects maintainability, reliability, duplication and coding-standard issues and identifies engineering hotspots.', mainOutput: 'Code-quality findings; technical-debt register; engineering-health view', capabilities: ['Conformance Agent', 'AST/Schema Validator', 'Policy Gate', 'AI Eval Harness', 'SDLC Metrics Store', 'Artifact Graph', 'Staleness Detector', 'Value Dashboard'] },
  { id: 'PA-12', name: 'Connector & Integration Health Agent', originalName: 'Connector & Integration Health Agent', status: 'Disabled', subagents: ['Platform Operations & User Support Agent'], responsibility: 'Monitors SDLC connectors, semantic synchronization and platform operational health.', mainOutput: 'Connector health; sync failures; support and remediation guidance', capabilities: ['Connector Hub', 'Canonical Artifact Model', 'Event Bus', 'Permission-Aware RAG', 'Runtime Evidence Collector', 'Domain Knowledge Base', 'Feedback Loop', 'AI Eval Harness'] },
  { id: 'PA-13', name: 'Database Design', originalName: 'Data Model Generation Agent', status: 'Enabled', subagents: ['Metadata & Lineage Agent', 'Data Privacy & Retention Agent'], responsibility: 'Generates and refines conceptual, logical and physical data models with governance controls.', mainOutput: 'ERD; data model; lineage; privacy and retention mappings', capabilities: ['Spec Registry', 'Domain Rule Validator', 'Artifact Graph', 'Conformance Agent', 'Canonical Artifact Model', 'Connector Hub', 'Evidence Ledger', 'Data Classification & Redaction', 'Privacy/Compliance Agent'] },
  { id: 'PA-14', name: 'Debugging & Root-Cause Agent', originalName: 'Debugging & Root-Cause Agent', status: 'Disabled', subagents: ['PR Documentation & Review Remediation Agent'], responsibility: 'Correlates traces, logs, code changes and incidents and supports review remediation.', mainOutput: 'Root-cause hypotheses; diagnostic steps; PR response; remediation checklist', capabilities: ['Artifact Graph', 'Runtime Evidence Collector', 'Change Impact Agent', 'Explainability Panel', 'Evidence Ledger', 'Human Review Workbench', 'Feedback Loop'] },
  { id: 'PA-15', name: 'Delivery Performance & Release Safety Agent', originalName: 'Delivery Performance & Release Safety Agent', status: 'Disabled', subagents: [], responsibility: 'Analyzes delivery metrics and validates canary, rollback and release-safety controls.', mainOutput: 'DORA analysis; risk trend; release-safety readiness', capabilities: ['SDLC Metrics Store', 'Deployment Gatekeeper', 'Rollback Validator', 'Canary/Blast-Radius Controller'] },
  { id: 'PA-16', name: 'Deployment Evidence & Handover Agent', originalName: 'Deployment Evidence & Handover Agent', status: 'Disabled', subagents: [], responsibility: 'Captures deployment evidence and prepares support handover and monitoring guidance.', mainOutput: 'Deployment record; handover pack; support actions', capabilities: ['Evidence Ledger', 'Audit Export Service', 'Decision Log', 'Permission-Aware RAG'] },
  { id: 'PA-17', name: 'Domain Knowledge Curator Agent', originalName: 'Domain Knowledge Curator Agent', status: 'Disabled', subagents: ['Operational Exception Discovery Agent', 'Business Data Semantics Agent'], responsibility: 'Captures and structures domain terminology, processes, rules and operating scenarios from SME input.', mainOutput: 'Domain knowledge; glossary; business rules; exception catalogue', capabilities: ['Domain Knowledge Base', 'SME Validation Queue', 'Confidence/Escalation Service', 'Evidence Ledger', 'Exception Catalog', 'Clarification Agent', 'Artifact Graph', 'Canonical Artifact Model'] },
  { id: 'PA-18', name: 'Requirement to Spec', originalName: 'Elicitation & Workshop Agent', status: 'Enabled', subagents: [], responsibility: 'Prepares workshops, captures discussions and extracts requirements, decisions, actions and unresolved questions.', mainOutput: 'Workshop pack; candidate requirements; decisions; actions', capabilities: ['Domain Knowledge Base', 'Clarification Agent', 'Evidence Ledger', 'Decision Log'] },
  { id: 'PA-19', name: 'Environment Readiness Agent', originalName: 'Environment Readiness Agent', status: 'Disabled', subagents: ['Deployment Plan Validator Agent'], responsibility: 'Checks environment baselines, capacity, configuration and deployment prerequisites.', mainOutput: 'Environment readiness; deployment-plan validation', capabilities: ['Canonical Artifact Model', 'Runtime Evidence Collector', 'Policy Gate', 'Connector Hub', 'Deployment Gatekeeper', 'Rollback Validator', 'Approval Gate Engine', 'Conformance Agent'] },
  { id: 'PA-20', name: 'Evidence Collection & Authenticity Agent', originalName: 'Evidence Collection & Authenticity Agent', status: 'Disabled', subagents: ['Control Testing & Anomaly Agent'], responsibility: 'Collects traceable evidence, verifies authenticity and performs control analytics.', mainOutput: 'Evidence package; exceptions; control-test results', capabilities: ['Evidence Ledger', 'Audit Export Service', 'Prompt/Output Registry', 'Permission-Aware RAG', 'AI Eval Harness', 'Golden Dataset Manager', 'Drift/Regression Monitor'] },
  { id: 'PA-21', name: 'Flow & Delivery Health Agent', originalName: 'Flow & Delivery Health Agent', status: 'Disabled', subagents: ['Ceremony & Action Management Agent', 'Dependency & Impediment Agent'], responsibility: 'Monitors work-item aging, cycle time, blocked flow, forecast risk, dependencies and delivery health.', mainOutput: 'Flow health; dependency map; risk forecast; blocker actions', capabilities: ['SDLC Metrics Store', 'Value Dashboard', 'AI Adoption Analytics', 'Drift/Regression Monitor', 'Decision Log', 'Evidence Ledger', 'Event Bus', 'Artifact Graph', 'Change Impact Agent'] },
  { id: 'PA-22', name: 'Live Debate Boardroom', originalName: 'Gate Readiness Advisor Agent', status: 'Enabled', subagents: ['Executive Status & Evidence Synthesis Agent'], responsibility: 'Checks whether business, scope, risk and release evidence is complete before a sponsor gate.', mainOutput: 'Readiness score; missing evidence; approver pack', capabilities: ['Approval Gate Engine', 'Human Review Workbench', 'RBAC/SoD Service', 'Baseline Manager', 'Connector Hub', 'Evidence Ledger', 'Audit Export Service'] },
  { id: 'PA-23', name: 'Infrastructure-as-Code Agent', originalName: 'Infrastructure-as-Code Agent', status: 'Disabled', subagents: ['Configuration & Secret Security Agent'], responsibility: 'Generates and reviews IaC while checking configuration, secrets, permissions and drift.', mainOutput: 'IaC; plan analysis; configuration and secret findings', capabilities: ['Policy Engine', 'Change Impact Agent', 'Staleness Detector', 'Conformance Agent', 'Secret Vault', 'Agent Permission Policy', 'Data Classification & Redaction'] },
  { id: 'PA-24', name: 'Lifecycle Gate Coordination Agent', originalName: 'Lifecycle Gate Coordination Agent', status: 'Disabled', subagents: [], responsibility: 'Checks phase-entry and phase-exit criteria, routes approvals and tracks missing evidence.', mainOutput: 'Gate readiness; approval tasks; missing evidence', capabilities: ['Approval Gate Engine', 'RBAC/SoD Service', 'Human Review Workbench', 'Exception Manager'] },
  { id: 'PA-25', name: 'Migration & Reconciliation Agent', originalName: 'Migration & Reconciliation Agent', status: 'Disabled', subagents: [], responsibility: 'Generates mappings, migration validation and reconciliation checks and identifies high-risk transformations.', mainOutput: 'Migration plan; reconciliation report; rollback requirements', capabilities: ['Change Impact Agent', 'Contract-Test Generator', 'Rollback Validator', 'Runtime Evidence Collector'] },
  { id: 'PA-26', name: 'Portfolio Risk & Scenario Agent', originalName: 'Portfolio Risk & Scenario Agent', status: 'Disabled', subagents: ['Stakeholder Decision Support Agent'], responsibility: 'Compares scope, funding, dependency and risk scenarios and highlights portfolio trade-offs.', mainOutput: 'Scenario comparison; risk exposure; escalation paths', capabilities: ['Change Impact Agent', 'Artifact Graph', 'Explainability Panel', 'Decision/Dissent Capture', 'Decision Log', 'Human Review Workbench'] },
  { id: 'PA-27', name: 'Review Agent', originalName: 'PR Review & Spec Conformance Agent', status: 'Enabled', subagents: ['Security Analyzer Agent', 'Remediation Support Analyzer Agent'], responsibility: 'Reviews pull requests against approved specifications and consolidates quality, security and remediation findings.', mainOutput: 'PR summary; conformance findings; remediation checklist', capabilities: ['Conformance Agent', 'Spec Registry', 'Artifact Graph', 'Human Review Workbench', 'Policy Engine', 'Evidence Ledger', 'Contract-Test Generator', 'Feedback-to-Eval Pipeline'] },
  { id: 'PA-28', name: 'Product Discovery & Insight Agent', originalName: 'Product Discovery & Insight Agent', status: 'Disabled', subagents: ['Backlog Prioritization Agent'], responsibility: 'Synthesizes customer research, stakeholder requests and operational feedback into product opportunities.', mainOutput: 'Opportunity themes; evidence map; discovery questions', capabilities: ['Domain Knowledge Base', 'Permission-Aware RAG', 'Feedback Loop', 'Evidence Ledger', 'Artifact Graph', 'Change Impact Agent', 'Explainability Panel'] },
  { id: 'PA-29', name: 'Quality Gate & UAT Evidence Agent', originalName: 'Quality Gate & UAT Evidence Agent', status: 'Disabled', subagents: [], responsibility: 'Compiles test and UAT evidence and checks whether quality exit criteria are satisfied.', mainOutput: 'Quality summary; residual risk; gate evidence pack', capabilities: ['Approval Gate Engine', 'Human Review Workbench', 'Evidence Ledger', 'Conformance Agent'] },
  { id: 'PA-30', name: 'RAID & Status Reporting Agent', originalName: 'RAID & Status Reporting Agent', status: 'Disabled', subagents: ['Team Effectiveness Insight Agent'], responsibility: 'Extracts risks, assumptions, issues and decisions and produces evidence-based delivery status.', mainOutput: 'RAID register; status report; improvement themes', capabilities: ['Connector Hub', 'Canonical Artifact Model', 'Audit Export Service', 'Permission-Aware RAG', 'Feedback Loop', 'Decision/Dissent Capture', 'AI Eval Harness'] },
  { id: 'PA-31', name: 'Release Scope Assembly Agent', originalName: 'Release Scope Assembly Agent', status: 'Disabled', subagents: ['Change Risk Assessment Agent'], responsibility: 'Assembles release scope and assesses change, dependency and operational risk.', mainOutput: 'Release manifest; traceability; risk assessment', capabilities: ['Artifact Graph', 'Spec Registry', 'Evidence Ledger', 'Baseline Manager', 'Change Impact Agent', 'Explainability Panel', 'Decision/Dissent Capture', 'AI Eval Harness'] },
  { id: 'PA-32', name: 'Risk Exception & Approval Agent', originalName: 'Risk Exception & Approval Agent', status: 'Disabled', subagents: ['Compliance & AI Security Evidence Agent'], responsibility: 'Prepares risk exceptions, compensating controls, expiry and compliance evidence for approval.', mainOutput: 'Risk exception; residual-risk summary; evidence pack', capabilities: ['Exception Manager', 'Approval Gate Engine', 'RBAC/SoD Service', 'Decision Log', 'Evidence Ledger', 'Prompt/Output Registry', 'Agent Permission Policy', 'Model Gateway/Router'] },
  { id: 'PA-33', name: 'Risk-Based Audit Planning Agent', originalName: 'Risk-Based Audit Planning Agent', status: 'Disabled', subagents: [], responsibility: 'Proposes audit scope, control objectives and sampling based on systems, changes and risk.', mainOutput: 'Risk-based audit plan; evidence request', capabilities: ['Artifact Graph', 'AI Adoption Analytics', 'Model Gateway/Router', 'Explainability Panel'] },
  { id: 'PA-34', name: 'Risk-Based Test Strategy Agent', originalName: 'Risk-Based Test Strategy Agent', status: 'Disabled', subagents: [], responsibility: 'Maps specifications, architecture and risk to test types, coverage and exit criteria.', mainOutput: 'Test strategy; coverage model; entry/exit criteria', capabilities: ['Spec Registry', 'Artifact Graph', 'NFR Agent', 'Policy Engine'] },
  { id: 'PA-35', name: 'Rollback & Post-Release Learning Agent', originalName: 'Rollback & Post-Release Learning Agent', status: 'Disabled', subagents: [], responsibility: 'Validates rollback readiness and summarizes outcomes, incidents and improvement actions.', mainOutput: 'Rollback validation; post-release review; improvement backlog', capabilities: ['Rollback Validator', 'Runtime Evidence Collector', 'Feedback-to-Eval Pipeline', 'Value Dashboard'] },
  { id: 'PA-36', name: 'Schema & SQL Quality Agent', originalName: 'Schema & SQL Quality Agent', status: 'Disabled', subagents: ['Data Quality & Anomaly Agent'], responsibility: 'Reviews schema, SQL, indexes and data quality for correctness, performance and conformance.', mainOutput: 'Schema/SQL review; quality rules; anomaly findings', capabilities: ['AST/Schema Validator', 'Conformance Agent', 'Policy Gate', 'AI Eval Harness', 'Drift/Regression Monitor', 'Feedback Loop'] },
  { id: 'PA-37', name: 'Security Requirement Agent', originalName: 'Security Requirement Agent', status: 'Disabled', subagents: [], responsibility: 'Derives secure-SDLC, privacy and regulatory requirements from system context and policies.', mainOutput: 'Security requirements; control applicability', capabilities: ['Requirement Quality Agent', 'Policy Engine', 'Privacy/Compliance Agent', 'Spec Registry'] },
  { id: 'PA-38', name: 'Software Supply-Chain Assurance Agent', originalName: 'Software Supply-Chain Assurance Agent', status: 'Disabled', subagents: [], responsibility: 'Verifies artifact provenance, dependency risk, signing and security evidence before promotion.', mainOutput: 'Supply-chain assurance report; promotion decision evidence', capabilities: ['Evidence Ledger', 'Policy Engine', 'Approval Gate Engine', 'Prompt/Output Registry'] },
  { id: 'PA-39', name: 'Tech Architecture', originalName: 'Solution Option & Trade-off Agent', status: 'Enabled', subagents: ['ADR & Architecture Documentation Agent'], responsibility: 'Generates architecture options and compares cost, risk, operability, security and delivery impact.', mainOutput: 'Option matrix; recommendation; ADR; architecture documentation', capabilities: ['Explainability Panel', 'Decision/Dissent Capture', 'Change Impact Agent', 'AI Eval Harness', 'Decision Log', 'Evidence Ledger', 'Artifact Versioning Service'] },
  { id: 'PA-40', name: 'Code to Spec', originalName: 'Spec-to-Code Generation Agent', status: 'Enabled', subagents: ['Spec & Repository Context Agent', 'Refactoring & Code-Quality Agent'], responsibility: 'Generates implementation changes from approved specifications and governed repository context.', mainOutput: 'Code/configuration draft; implementation notes; refactoring suggestions', capabilities: ['Spec Registry', 'Permission-Aware RAG', 'Artifact Graph', 'Clarification Agent', 'Conformance Agent', 'AST/Schema Validator', 'Policy Gate', 'Prompt/Output Registry'] },
  { id: 'PA-41', name: 'Spec to Story', originalName: 'Story & Acceptance Criteria Agent', status: 'Enabled', subagents: ['Product Change Impact Agent', 'Product Decision Traceability Agent'], responsibility: 'Drafts well-formed stories, business rules, examples, acceptance criteria and NFR prompts.', mainOutput: 'Stories; examples; acceptance criteria; clarification questions', capabilities: ['Requirement Quality Agent', 'Clarification Agent', 'Spec Linter', 'Domain Rule Validator', 'Artifact Graph', 'Staleness Detector', 'Regeneration Orchestrator', 'Decision Log', 'Prompt/Output Registry', 'Baseline Manager'] },
  { id: 'PA-42', name: 'User Stories', originalName: 'Story-to-Spec Decomposition Agent', status: 'Enabled', subagents: ['Requirement Quality Analyzer Agent', 'Acceptance Criteria & Example Agent'], responsibility: 'Converts approved stories into machine-readable behaviour, rules, APIs, data fields and implementation-ready specifications.', mainOutput: 'Detailed specification; validation rules; interface and data requirements', capabilities: ['Spec Registry', 'Baseline Manager', 'Artifact Versioning Service', 'Conformance Agent', 'Requirement Quality Agent', 'Spec Linter', 'Domain Rule Validator', 'AI Eval Harness', 'Contract-Test Generator'] },
  { id: 'PA-43', name: 'Technical Task Decomposition Agent', originalName: 'Technical Task Decomposition Agent', status: 'Disabled', subagents: [], responsibility: 'Breaks approved specifications into implementation tasks, dependencies, estimates and technical risks.', mainOutput: 'Technical task plan; dependencies; risk flags', capabilities: ['Spec Registry', 'Artifact Graph', 'Change Impact Agent', 'Clarification Agent'] },
  { id: 'PA-44', name: 'Test Automation Agent', originalName: 'Test Automation Agent', status: 'Disabled', subagents: ['Failure & Defect Triage Agent'], responsibility: 'Creates and maintains automated tests and clusters failures into actionable defects.', mainOutput: 'Automation scripts; execution results; defect drafts; probable cause', capabilities: ['Contract-Test Generator', 'AI Eval Harness', 'Drift/Regression Monitor', 'Policy Gate', 'Artifact Graph', 'Change Impact Agent', 'Explainability Panel', 'Evidence Ledger'] },
  { id: 'PA-45', name: 'Test Cases', originalName: 'Test-Case Generation Agent', status: 'Enabled', subagents: ['Test Data & Environment Agent'], responsibility: 'Generates positive, negative, boundary, workflow and exception tests with governed test data.', mainOutput: 'Test cases; expected results; test data and environment readiness', capabilities: ['Contract-Test Generator', 'Domain Rule Validator', 'Spec Linter', 'Conformance Agent', 'Data Classification & Redaction', 'Runtime Evidence Collector', 'Connector Hub'] },
  { id: 'PA-46', name: 'Threat Modeling Agent', originalName: 'Threat Modeling Agent', status: 'Disabled', subagents: [], responsibility: 'Generates threats, attack paths, misuse cases and control recommendations from architecture and data flows.', mainOutput: 'Threat model; prioritized risks; recommended controls', capabilities: ['Threat Model Agent', 'Artifact Graph', 'Policy Engine', 'Explainability Panel'] },
  { id: 'PA-47', name: 'Traceability & Approval Audit Agent', originalName: 'Traceability & Approval Audit Agent', status: 'Disabled', subagents: ['Finding & Remediation Tracking Agent'], responsibility: 'Checks end-to-end lineage, approvals and segregation of duties and tracks corrective actions.', mainOutput: 'Broken-lineage findings; approval issues; remediation tracker', capabilities: ['Artifact Graph', 'RBAC/SoD Service', 'Approval Gate Engine', 'Conformance Agent', 'Decision Log', 'Human Review Workbench', 'Exception Manager', 'Feedback Loop'] },
  { id: 'PA-48', name: 'Traceability Matrix', originalName: 'Traceability & Change Impact Agent', status: 'Enabled', subagents: ['Spec Baseline & Clarification Agent'], responsibility: 'Maintains links from business need through specification, design, code, tests, release and deployment.', mainOutput: 'RTM links; change-impact report; stale-artifact alerts', capabilities: ['Artifact Graph', 'Change Impact Agent', 'Staleness Detector', 'Regeneration Orchestrator', 'Approval Gate Engine', 'Human Review Workbench', 'Decision/Dissent Capture'] },
  { id: 'PA-49', name: 'UAT & Business Readiness Agent', originalName: 'UAT & Business Readiness Agent', status: 'Disabled', subagents: [], responsibility: 'Generates UAT packs, traces scenarios to acceptance criteria and summarizes business-readiness gaps.', mainOutput: 'UAT scenarios; traceability; readiness report', capabilities: ['Conformance Agent', 'Contract-Test Generator', 'Approval Gate Engine', 'Human Review Workbench'] },
  { id: 'PA-50', name: 'UAT Scenario Agent', originalName: 'UAT Scenario Agent', status: 'Disabled', subagents: [], responsibility: 'Generates domain-realistic UAT scenarios including exceptions and expected business outcomes.', mainOutput: 'UAT scenarios; expected results; traceability', capabilities: ['Contract-Test Generator', 'Domain Rule Validator', 'Conformance Agent', 'Human Review Workbench'] },
  { id: 'PA-51', name: 'Unit & Integration Test Agent', originalName: 'Unit & Integration Test Agent', status: 'Disabled', subagents: [], responsibility: 'Generates unit and integration tests, mocks, fixtures and boundary cases from specification behaviour.', mainOutput: 'Unit/integration tests; mocks; fixtures; coverage report', capabilities: ['Contract-Test Generator', 'Conformance Agent', 'AI Eval Harness', 'Golden Dataset Manager'] },
  { id: 'PA-52', name: 'User Research Synthesis Agent', originalName: 'User Research Synthesis Agent', status: 'Disabled', subagents: ['Persona & Journey Modeling Agent'], responsibility: 'Synthesizes interviews and usability sessions into evidence-backed themes, personas and journeys.', mainOutput: 'Research synthesis; personas; journeys; opportunity map', capabilities: ['Domain Knowledge Base', 'Evidence Ledger', 'Confidence/Escalation Service', 'Feedback Loop', 'Artifact Graph'] },
  { id: 'PA-53', name: 'UX Implementation Review Agent', originalName: 'UX Implementation Review Agent', status: 'Disabled', subagents: ['Accessibility Review Agent', 'Design System Conformance Agent'], responsibility: 'Compares implemented UI with approved UX behaviour, accessibility requirements and design standards.', mainOutput: 'UX review; accessibility findings; design-system deviations', capabilities: ['Contract-Test Generator', 'Runtime Evidence Collector', 'NFR Agent', 'Policy Engine', 'Policy Gate', 'Staleness Detector', 'Conformance Agent'] },
  { id: 'PA-54', name: 'UX Wireframe', originalName: 'Wireframe & Prototype Generation Agent', status: 'Enabled', subagents: [], responsibility: 'Creates alternative screen layouts, states and prototypes from approved specifications.', mainOutput: 'Wireframes; screen-state inventory; prototype', capabilities: ['Spec Registry', 'Conformance Agent', 'Artifact Versioning Service', 'Human Review Workbench'] },
  { id: 'PA-55', name: 'Agent Registry & Security', originalName: 'Workflow & Gate Configuration Agent', status: 'Enabled', subagents: ['Access Provisioning Agent', 'RBAC & Segregation-of-Duties Analyzer Agent'], responsibility: 'Configures workflow states, approval gates, role access, evidence requirements and exception paths.', mainOutput: 'Workflow configuration; role model; gate rules; access findings', capabilities: ['Approval Gate Engine', 'Exception Manager', 'Human Review Workbench', 'Policy Gate', 'RBAC/SoD Service', 'Agent Permission Policy', 'Evidence Ledger', 'Policy Engine', 'Explainability Panel'] }
];

// 2. Secondary / Sub-agents (47 Total from SDD Matrix PDF - 16 Linked Enabled + 31 Reserve Disabled)
export const SUBAGENTS_47 = [
  { id: 'SA-01', name: 'Architecture Drift & Change Impact Agent', status: 'Disabled', parent: 'API & Integration Contract Agent', boundary: 'Monitors API contract drift and compatibility violations.' },
  { id: 'SA-02', name: 'Release Calendar & Collision Agent', status: 'Disabled', parent: 'Approval & Evidence Readiness Agent', boundary: 'Detects schedule collisions and release overlaps.' },
  { id: 'SA-03', name: 'Release Notes & Communication Agent', status: 'Disabled', parent: 'Approval & Evidence Readiness Agent', boundary: 'Prepares release summaries and stakeholder communications.' },
  { id: 'SA-04', name: 'NFR & Risk Conformance Agent', status: 'Disabled', parent: 'Architecture Driver Extraction Agent', boundary: 'Maps NFR drivers against risk controls.' },
  { id: 'SA-05', name: 'Smoke Test & Health Verification Agent', status: 'Disabled', parent: 'Bounded Production Execution Agent', boundary: 'Executes non-destructive deployment verification probes.' },
  { id: 'SA-06', name: 'Rollback Decision Support Agent', status: 'Disabled', parent: 'Bounded Production Execution Agent', boundary: 'Provides automated health decision metrics for rollbacks.' },
  { id: 'SA-07', name: 'Benefits Realization Agent', status: 'Disabled', parent: 'Business Case & Value Analyst Agent', boundary: 'Tracks post-release ROI metrics against business case.' },
  { id: 'SA-08', name: 'Process Change Impact Agent', status: 'Enabled', parent: 'Business Rule Validation Agent', boundary: 'Evaluates business process operational impact.' },
  { id: 'SA-09', name: 'Build & Deployment Failure Analyst Agent', status: 'Disabled', parent: 'CI/CD Pipeline Generation Agent', boundary: 'Diagnoses pipeline compilation and deployment failures.' },
  { id: 'SA-10', name: 'Security Remediation Support Agent', status: 'Disabled', parent: 'Code & Dependency Security Analyzer Agent', boundary: 'Generates security patch code fixes for dependencies.' },
  { id: 'SA-11', name: 'Technical Debt & Engineering Health Agent', status: 'Disabled', parent: 'Code-Quality Analyzer Agent', boundary: 'Maintains codebase technical debt register.' },
  { id: 'SA-12', name: 'Platform Operations & User Support Agent', status: 'Disabled', parent: 'Connector & Integration Health Agent', boundary: 'Monitors SDLC connector health and user support tickets.' },
  { id: 'SA-13', name: 'Metadata & Lineage Agent', status: 'Enabled', parent: 'Data Model Generation Agent', boundary: 'Tracks schema column origin and data lineage.' },
  { id: 'SA-14', name: 'Data Privacy & Retention Agent', status: 'Enabled', parent: 'Data Model Generation Agent', boundary: 'Enforces PII data retention and purging policies.' },
  { id: 'SA-15', name: 'PR Documentation & Review Remediation Agent', status: 'Disabled', parent: 'Debugging & Root-Cause Agent', boundary: 'Drafts PR descriptions and remediation checklists.' },
  { id: 'SA-16', name: 'Operational Exception Discovery Agent', status: 'Disabled', parent: 'Domain Knowledge Curator Agent', boundary: 'Identifies edge cases and domain exceptions from SME input.' },
  { id: 'SA-17', name: 'Business Data Semantics Agent', status: 'Disabled', parent: 'Domain Knowledge Curator Agent', boundary: 'Reconciles conflicting field definitions across teams.' },
  { id: 'SA-18', name: 'Deployment Plan Validator Agent', status: 'Disabled', parent: 'Environment Readiness Agent', boundary: 'Validates target environment capacity and pre-requisites.' },
  { id: 'SA-19', name: 'Control Testing & Anomaly Agent', status: 'Disabled', parent: 'Evidence Collection & Authenticity Agent', boundary: 'Detects control anomalies in evidence chains.' },
  { id: 'SA-20', name: 'Ceremony & Action Management Agent', status: 'Disabled', parent: 'Flow & Delivery Health Agent', boundary: 'Tracks agile retro action items and ceremony cadence.' },
  { id: 'SA-21', name: 'Dependency & Impediment Agent', status: 'Disabled', parent: 'Flow & Delivery Health Agent', boundary: 'Flags cross-team dependency blockers.' },
  { id: 'SA-22', name: 'Executive Status & Evidence Synthesis Agent', status: 'Enabled', parent: 'Gate Readiness Advisor Agent', boundary: 'Synthesizes executive milestone summaries.' },
  { id: 'SA-23', name: 'Configuration & Secret Security Agent', status: 'Disabled', parent: 'Infrastructure-as-Code Agent', boundary: 'Scans IaC templates for exposed credentials.' },
  { id: 'SA-24', name: 'Stakeholder Decision Support Agent', status: 'Disabled', parent: 'Portfolio Risk & Scenario Agent', boundary: 'Prepares trade-off briefs for sponsor decisions.' },
  { id: 'SA-25', name: 'Security Analyzer Agent', status: 'Enabled', parent: 'PR Review & Spec Conformance Agent', boundary: 'Checks pull requests against security baselines.' },
  { id: 'SA-26', name: 'Remediation Support Analyzer Agent', status: 'Enabled', parent: 'PR Review & Spec Conformance Agent', boundary: 'Suggests code edits for PR spec violations.' },
  { id: 'SA-27', name: 'Backlog Prioritization Agent', status: 'Disabled', parent: 'Product Discovery & Insight Agent', boundary: 'Ranks candidate backlog items by user value.' },
  { id: 'SA-28', name: 'Team Effectiveness Insight Agent', status: 'Disabled', parent: 'RAID & Status Reporting Agent', boundary: 'Analyzes team velocity and delivery bottlenecks.' },
  { id: 'SA-29', name: 'Change Risk Assessment Agent', status: 'Disabled', parent: 'Release Scope Assembly Agent', boundary: 'Calculates blast radius for release packages.' },
  { id: 'SA-30', name: 'Compliance & AI Security Evidence Agent', status: 'Disabled', parent: 'Risk Exception & Approval Agent', boundary: 'Gathers regulatory compliance evidence for risk gates.' },
  { id: 'SA-31', name: 'Data Quality & Anomaly Agent', status: 'Disabled', parent: 'Schema & SQL Quality Agent', boundary: 'Checks SQL scripts for performance anti-patterns.' },
  { id: 'SA-32', name: 'ADR & Architecture Documentation Agent', status: 'Enabled', parent: 'Solution Option & Trade-off Agent', boundary: 'Drafts Architecture Decision Records (ADRs).' },
  { id: 'SA-33', name: 'Spec & Repository Context Agent', status: 'Enabled', parent: 'Spec-to-Code Generation Agent', boundary: 'Injects repo context into code generators.' },
  { id: 'SA-34', name: 'Refactoring & Code-Quality Agent', status: 'Enabled', parent: 'Spec-to-Code Generation Agent', boundary: 'Refactors generated code to meet style guides.' },
  { id: 'SA-35', name: 'Product Change Impact Agent', status: 'Enabled', parent: 'Story & Acceptance Criteria Agent', boundary: 'Evaluates user story changes against active spec.' },
  { id: 'SA-36', name: 'Product Decision Traceability Agent', status: 'Enabled', parent: 'Story & Acceptance Criteria Agent', boundary: 'Links stories to original business requirement.' },
  { id: 'SA-37', name: 'Requirement Quality Analyzer Agent', status: 'Enabled', parent: 'Story-to-Spec Decomposition Agent', boundary: 'Checks generated specification completeness.' },
  { id: 'SA-38', name: 'Acceptance Criteria & Example Agent', status: 'Enabled', parent: 'Story-to-Spec Decomposition Agent', boundary: 'Generates concrete Gherkin examples.' },
  { id: 'SA-39', name: 'Failure & Defect Triage Agent', status: 'Disabled', parent: 'Test Automation Agent', boundary: 'Clusters test suite failures into defect tickets.' },
  { id: 'SA-40', name: 'Test Data & Environment Agent', status: 'Enabled', parent: 'Test-Case Generation Agent', boundary: 'Prepares synthetic test data fixtures.' },
  { id: 'SA-41', name: 'Finding & Remediation Tracking Agent', status: 'Disabled', parent: 'Traceability & Approval Audit Agent', boundary: 'Monitors audit finding remediation progress.' },
  { id: 'SA-42', name: 'Spec Baseline & Clarification Agent', status: 'Enabled', parent: 'Traceability & Change Impact Agent', boundary: 'Manages baseline version diffs and clarification notes.' },
  { id: 'SA-43', name: 'Persona & Journey Modeling Agent', status: 'Disabled', parent: 'User Research Synthesis Agent', boundary: 'Drafts user persona journey maps.' },
  { id: 'SA-44', name: 'Accessibility Review Agent', status: 'Disabled', parent: 'UX Implementation Review Agent', boundary: 'Checks rendered UI against WCAG 2.1 standards.' },
  { id: 'SA-45', name: 'Design System Conformance Agent', status: 'Disabled', parent: 'UX Implementation Review Agent', boundary: 'Audits UI component design token adherence.' },
  { id: 'SA-46', name: 'Access Provisioning Agent', status: 'Enabled', parent: 'Workflow & Gate Configuration Agent', boundary: 'Configures user access roles for gate workflows.' },
  { id: 'SA-47', name: 'RBAC & Segregation-of-Duties Analyzer Agent', status: 'Enabled', parent: 'Workflow & Gate Configuration Agent', boundary: 'Audits segregation of duty conflicts.' }
];

// 3. Shared SDD Capabilities (53 Total from SDD Matrix PDF)
export const SHARED_CAPABILITIES_53 = [
  { name: 'Model Gateway/Router', status: 'Enabled', category: 'Platform Service', desc: 'Central routing and model failover gateway.' },
  { name: 'Prompt/Output Registry', status: 'Enabled', category: 'Platform Service', desc: 'Central registry logging system prompts and completions.' },
  { name: 'Data Classification & Redaction', status: 'Enabled', category: 'Platform Service', desc: 'PII/Secret masking and data sensitivity redaction service.' },
  { name: 'Audit Export Service', status: 'Enabled', category: 'Platform Service', desc: 'Exports immutable audit evidence packages for compliance.' },
  { name: 'Agent Permission Policy', status: 'Enabled', category: 'Governance Control', desc: 'Enforces fine-grained tool and action permissions per agent.' },
  { name: 'AI Eval Harness', status: 'Enabled', category: 'Evaluation Control', desc: 'Automated evaluation framework for measuring agent quality.' },
  { name: 'Contract-Test Generator', status: 'Enabled', category: 'Platform Utility', desc: 'Generates API contract integration test suites.' },
  { name: 'Conformance Agent', status: 'Enabled', category: 'Shared Agent', desc: 'Reusable agent validating compliance against specs.' },
  { name: 'AST/Schema Validator', status: 'Enabled', category: 'Deterministic Validator', desc: 'Validates JSON schemas, OpenAPI specs, and ASTs.' },
  { name: 'Spec Registry', status: 'Enabled', category: 'Data Store', desc: 'Authoritative baseline specification storage.' },
  { name: 'Artifact Graph', status: 'Enabled', category: 'Graph Registry', desc: 'Bidirectional dependency lineage graph.' },
  { name: 'Change Impact Agent', status: 'Enabled', category: 'Shared Agent', desc: 'Reusable agent evaluating scope change blast radius.' },
  { name: 'Staleness Detector', status: 'Enabled', category: 'Deterministic Detector', desc: 'Identifies out-of-sync downstream artifacts.' },
  { name: 'Approval Gate Engine', status: 'Enabled', category: 'Deterministic Engine', desc: 'State machine for human-in-the-loop gate signoffs.' },
  { name: 'RBAC/SoD Service', status: 'Enabled', category: 'Security Service', desc: 'Role-based access and segregation of duties engine.' },
  { name: 'Human Review Workbench', status: 'Enabled', category: 'UI Workbench', desc: 'Human-in-the-loop approval and override interface.' },
  { name: 'Exception Manager', status: 'Enabled', category: 'Governance Service', desc: 'Tracks and manages policy exceptions and expirations.' },
  { name: 'Connector Hub', status: 'Enabled', category: 'Platform Service', desc: 'Integrations with JIRA, GitHub, GitLab, Jenkins, Azure DevOps.' },
  { name: 'Canonical Artifact Model', status: 'Enabled', category: 'Data Standard', desc: 'Unified JSON schema standard across all SDLC artifacts.' },
  { name: 'Event Bus', status: 'Disabled', category: 'Platform Service', desc: 'Asynchronous event streaming backbone.' },
  { name: 'Decision Log', status: 'Enabled', category: 'Audit Ledger', desc: 'Records architecture and governance decisions.' },
  { name: 'Permission-Aware RAG', status: 'Enabled', category: 'Platform Service', desc: 'Context retrieval engine respecting user access permissions.' },
  { name: 'Requirement Quality Agent', status: 'Enabled', category: 'Shared Agent', desc: 'Reusable agent scoring specification clarity and ambiguity.' },
  { name: 'NFR Agent', status: 'Disabled', category: 'Shared Agent', desc: 'Specialized agent evaluating non-functional requirement controls.' },
  { name: 'Domain Rule Validator', status: 'Enabled', category: 'Deterministic Validator', desc: 'Validates business rules against domain dictionary.' },
  { name: 'Policy Engine', status: 'Enabled', category: 'Governance Control', desc: 'Evaluates architectural policies and governance guardrails.' },
  { name: 'Threat Model Agent', status: 'Disabled', category: 'Shared Agent', desc: 'Reusable agent generating STRIDE threat vectors.' },
  { name: 'Privacy/Compliance Agent', status: 'Enabled', category: 'Shared Agent', desc: 'Verifies GDPR, HIPAA, and PCI-DSS compliance.' },
  { name: 'Deployment Gatekeeper', status: 'Disabled', category: 'Governance Control', desc: 'Enforces production deployment policy rules.' },
  { name: 'Canary/Blast-Radius Controller', status: 'Disabled', category: 'Execution Controller', desc: 'Controls progressive canary rollouts.' },
  { name: 'Evidence Ledger', status: 'Enabled', category: 'Audit Ledger', desc: 'Immutable SHA-256 evidence chain storage.' },
  { name: 'Runtime Evidence Collector', status: 'Enabled', category: 'Collector Service', desc: 'Gathers build, deployment, and test execution logs.' },
  { name: 'Explainability Panel', status: 'Enabled', category: 'UI Component', desc: 'Renders agent reasoning steps and dissent reports.' },
  { name: 'Decision/Dissent Capture', status: 'Enabled', category: 'Audit Control', desc: 'Captures dissenting opinions and approval rationale.' },
  { name: 'Value Dashboard', status: 'Disabled', category: 'UI Dashboard', desc: 'Displays business value metrics and DORA adoption.' },
  { name: 'SDLC Metrics Store', status: 'Disabled', category: 'Data Store', desc: 'TimeSeries metrics store for cycle time and velocity.' },
  { name: 'AI Adoption Analytics', status: 'Disabled', category: 'Analytics Engine', desc: 'Tracks agent token consumption and usage trends.' },
  { name: 'Feedback-to-Eval Pipeline', status: 'Enabled', category: 'Pipeline Service', desc: 'Feeds human correction feedback back into eval datasets.' },
  { name: 'Spec Linter', status: 'Enabled', category: 'Deterministic Linter', desc: 'Lints spec Markdown for formatting and completeness.' },
  { name: 'Policy Gate', status: 'Enabled', category: 'Governance Control', desc: 'Hard stop gate checking mandatory policy compliance.' },
  { name: 'Regeneration Orchestrator', status: 'Enabled', category: 'Orchestration Engine', desc: 'Triggers multi-artifact updates when upstream specs change.' },
  { name: 'Artifact Versioning Service', status: 'Enabled', category: 'Platform Service', desc: 'Manages semantic versioning of SDLC deliverables.' },
  { name: 'Domain Knowledge Base', status: 'Enabled', category: 'Knowledge Store', desc: 'Domain terms, glossary, and business context store.' },
  { name: 'Feedback Loop', status: 'Disabled', category: 'Telemetry Service', desc: 'Captures user edits to tune prompt templates.' },
  { name: 'Rollback Validator', status: 'Disabled', category: 'Deterministic Validator', desc: 'Validates environment state before executing rollbacks.' },
  { name: 'SME Validation Queue', status: 'Disabled', category: 'Workflow Queue', desc: 'Routes domain questions to human SMEs.' },
  { name: 'Confidence/Escalation Service', status: 'Disabled', category: 'Platform Service', desc: 'Escalates low-confidence AI decisions to human leads.' },
  { name: 'Exception Catalog', status: 'Disabled', category: 'Data Store', desc: 'Catalog of approved architecture and security exceptions.' },
  { name: 'Clarification Agent', status: 'Enabled', category: 'Shared Agent', desc: 'Reusable agent running targeted ambiguity Q&A.' },
  { name: 'Golden Dataset Manager', status: 'Disabled', category: 'Data Store', desc: 'Manages benchmark test datasets for quality evals.' },
  { name: 'Drift/Regression Monitor', status: 'Disabled', category: 'Monitoring Service', desc: 'Monitors code and architecture drift over time.' },
  { name: 'Baseline Manager', status: 'Enabled', category: 'Governance Control', desc: 'Locks and baselines spec versions.' },
  { name: 'Secret Vault', status: 'Disabled', category: 'Security Service', desc: 'Secure storage for API keys and environment secrets.' }
];

export const INITIAL_102_AGENTS = PRIMARY_AGENTS_55.concat(
  SUBAGENTS_47.map(s => ({
    id: s.id,
    name: s.name,
    persona: s.parent,
    autonomy: 'Sub-agent',
    model: 'Gemini / DeepSeek',
    boundary: s.boundary,
    priority: 'P1'
  }))
);

export default function AdminAgents() {
  const [primaryAgents, setPrimaryAgents] = useState(PRIMARY_AGENTS_55);
  const [subagents, setSubagents] = useState(SUBAGENTS_47);
  const [capabilities, setCapabilities] = useState(SHARED_CAPABILITIES_53);

  const [activeTab, setActiveTab] = useState('primary'); // 'primary' | 'subagents' | 'capabilities'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'Enabled' | 'Disabled'

  // Modal Editing State
  const [editingItem, setEditingItem] = useState(null); // { type: 'primary'|'subagent'|'capability', item: object }
  const [editFormData, setEditFormData] = useState({});

  const openEditModal = (type, item) => {
    setEditingItem({ type, item });
    setEditFormData({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const { type, item } = editingItem;

    if (type === 'primary') {
      setPrimaryAgents(prev => prev.map(a => a.id === item.id ? { ...a, ...editFormData } : a));
    } else if (type === 'subagent') {
      setSubagents(prev => prev.map(s => s.id === item.id ? { ...s, ...editFormData } : s));
    } else if (type === 'capability') {
      setCapabilities(prev => prev.map(c => c.name === item.name ? { ...c, ...editFormData } : c));
    }

    setEditingItem(null);
  };

  const filteredPrimary = primaryAgents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.responsibility.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.originalName && a.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredSubagents = subagents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.parent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.boundary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredCapabilities = capabilities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17181C] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-sm shrink-0">
              <i className="fas fa-robot"></i>
            </div>
            <span>Agent Registry & Capability Fleet</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Browse and govern 55 Primary Agents, 47 Sub-agents, and 53 Shared SDLC capabilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-[8px]">
            102 Total Governed Agents
          </span>
        </div>
      </div>

      {/* TOP CONTROL CONTAINER */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-4 space-y-3 shadow-2xs">
        
        {/* ROW 1: EQUAL 3-COLUMN TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F8F8F7] p-1.5 rounded-[12px] border border-[#ECEEF1] w-full">
          <button
            onClick={() => setActiveTab('primary')}
            className={`py-2 px-3 rounded-[10px] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'primary' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C] hover:bg-white/50'
            }`}
          >
            <i className="fas fa-user-gear"></i>
            <span>Primary Agents ({primaryAgents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subagents')}
            className={`py-2 px-3 rounded-[10px] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'subagents' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C] hover:bg-white/50'
            }`}
          >
            <i className="fas fa-sitemap"></i>
            <span>Sub-agents ({subagents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('capabilities')}
            className={`py-2 px-3 rounded-[10px] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'capabilities' ? 'bg-[#7157F5] text-white shadow-2xs' : 'text-[#667085] hover:text-[#17181C] hover:bg-white/50'
            }`}
          >
            <i className="fas fa-cubes"></i>
            <span>Shared Capabilities ({capabilities.length})</span>
          </button>
        </div>

        {/* ROW 2: SEARCH & STATUS FILTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
          {/* Search Bar */}
          <div className="w-full sm:flex-1 relative">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] text-xs"></i>
            <input 
              type="text" 
              placeholder="Search agents by name, ID, parent, or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] py-2 pl-9 pr-4 text-xs text-[#17181C] placeholder-[#98A2B3] focus:outline-none focus:border-[#7157F5] focus:bg-white transition"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] hidden sm:inline">Filter Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto bg-[#F8F8F7] border border-[#ECEEF1] text-xs font-semibold rounded-[10px] px-3 py-2 text-[#17181C] focus:outline-none focus:border-[#7157F5] cursor-pointer min-w-[160px]"
            >
              {activeTab === 'primary' && (
                <>
                  <option value="ALL">All Statuses ({primaryAgents.length})</option>
                  <option value="Enabled">Enabled Only ({primaryAgents.filter(a => a.status === 'Enabled').length})</option>
                  <option value="Disabled">Disabled Only ({primaryAgents.filter(a => a.status === 'Disabled').length})</option>
                </>
              )}
              {activeTab === 'subagents' && (
                <>
                  <option value="ALL">All Statuses ({subagents.length})</option>
                  <option value="Enabled">Enabled Only ({subagents.filter(a => a.status === 'Enabled').length})</option>
                  <option value="Disabled">Disabled Only ({subagents.filter(a => a.status === 'Disabled').length})</option>
                </>
              )}
              {activeTab === 'capabilities' && (
                <>
                  <option value="ALL">All Statuses ({capabilities.length})</option>
                  <option value="Enabled">Enabled Only ({capabilities.filter(c => c.status === 'Enabled').length})</option>
                  <option value="Disabled">Disabled Only ({capabilities.filter(c => c.status === 'Disabled').length})</option>
                </>
              )}
            </select>
          </div>
        </div>

      </div>

      {/* TAB 1: PRIMARY AGENTS (55) */}
      {activeTab === 'primary' && (
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-bold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Agent ID & Primary Agent Name</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Primary Responsibility</th>
                  <th className="p-3.5">Main Output</th>
                  <th className="p-3.5">Related Sub-agents</th>
                  <th className="p-3.5">Shared SDD Capabilities</th>
                  <th className="p-3.5 text-right sticky right-0 bg-[#F8F8F7] z-30 shadow-2xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1] text-[#344054] font-sans">
                {filteredPrimary.map((agent) => (
                  <tr key={agent.id} className="hover:bg-[#F8F8F7]/80 transition">
                    <td className="p-3.5 font-bold text-[#17181C] min-w-[200px]">
                      <span className="text-[#17181C] block">{agent.name}</span>
                      <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 inline-block mt-0.5">{agent.id}</span>
                      {agent.originalName && agent.originalName !== agent.name && (
                        <span className="text-[10px] text-[#98A2B3] block italic mt-0.5">({agent.originalName})</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        agent.status === 'Enabled'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#475467] max-w-[260px] leading-relaxed">
                      {agent.responsibility}
                    </td>
                    <td className="p-3.5 text-[#667085] text-[11px] max-w-[200px]">
                      {agent.mainOutput}
                    </td>
                    <td className="p-3.5 min-w-[180px]">
                      {agent.subagents.length === 0 ? (
                        <span className="text-[#98A2B3] text-[11px] italic">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {agent.subagents.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 min-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-[6px] bg-[#F8F8F7] text-[#344054] border border-[#ECEEF1] text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right sticky right-0 bg-white z-10 border-l border-[#ECEEF1]">
                      <button
                        onClick={() => openEditModal('primary', agent)}
                        title="Edit Agent"
                        className="w-7 h-7 rounded-[8px] bg-white hover:bg-purple-50 text-[#7157F5] border border-[#ECEEF1] hover:border-purple-300 transition cursor-pointer flex items-center justify-center ml-auto shadow-2xs"
                      >
                        <i className="fas fa-pen-to-square text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUB-AGENTS (47) */}
      {activeTab === 'subagents' && (
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-bold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Sub-agent ID & Name</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Parent Primary Agent Binding</th>
                  <th className="p-3.5">Specialized Functional Boundary</th>
                  <th className="p-3.5 text-right sticky right-0 bg-[#F8F8F7] z-30 shadow-2xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1] text-[#344054] font-sans">
                {filteredSubagents.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F8F8F7]/80 transition">
                    <td className="p-3.5 font-bold text-[#17181C] min-w-[220px]">
                      <span className="text-[#17181C] block">{sub.name}</span>
                      <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 inline-block mt-0.5">{sub.id}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        sub.status === 'Enabled'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {sub.status || 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-[8px] bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold inline-block">
                        <i className="fas fa-link text-[10px] mr-1.5 text-purple-500"></i>
                        {sub.parent}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#475467] leading-relaxed max-w-[400px]">
                      {sub.boundary}
                    </td>
                    <td className="p-3.5 text-right sticky right-0 bg-white z-10 border-l border-[#ECEEF1]">
                      <button
                        onClick={() => openEditModal('subagent', sub)}
                        title="Edit Sub-agent"
                        className="w-7 h-7 rounded-[8px] bg-white hover:bg-purple-50 text-[#7157F5] border border-[#ECEEF1] hover:border-purple-300 transition cursor-pointer flex items-center justify-center ml-auto shadow-2xs"
                      >
                        <i className="fas fa-pen-to-square text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SHARED CAPABILITIES (53) */}
      {activeTab === 'capabilities' && (
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8F8F7] border-b border-[#ECEEF1] text-[#667085] uppercase tracking-wider font-bold text-[10px] sticky top-0 z-20">
                <tr>
                  <th className="p-3.5">Capability Name</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Category Type</th>
                  <th className="p-3.5">Capability Purpose & Description</th>
                  <th className="p-3.5 text-right sticky right-0 bg-[#F8F8F7] z-30 shadow-2xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1] text-[#344054] font-sans">
                {filteredCapabilities.map((cap, i) => (
                  <tr key={i} className="hover:bg-[#F8F8F7]/80 transition">
                    <td className="p-3.5 font-bold text-[#17181C] min-w-[220px]">
                      {cap.name}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        cap.status === 'Enabled'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {cap.status || 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold border ${
                        cap.category === 'Shared Agent' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        cap.category === 'Governance Control' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-[#F8F8F7] text-[#475467] border-[#ECEEF1]'
                      }`}>
                        {cap.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#475467] leading-relaxed">
                      {cap.desc}
                    </td>
                    <td className="p-3.5 text-right sticky right-0 bg-white z-10 border-l border-[#ECEEF1]">
                      <button
                        onClick={() => openEditModal('capability', cap)}
                        title="Edit Capability"
                        className="w-7 h-7 rounded-[8px] bg-white hover:bg-purple-50 text-[#7157F5] border border-[#ECEEF1] hover:border-purple-300 transition cursor-pointer flex items-center justify-center ml-auto shadow-2xs"
                      >
                        <i className="fas fa-pen-to-square text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] w-full max-w-lg overflow-hidden shadow-2xl p-5 space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-[#F2F4F7] pb-3">
              <h3 className="text-sm font-bold text-[#17181C] flex items-center gap-2">
                <i className="fas fa-pen-to-square text-[#7157F5]"></i>
                <span>Edit {editingItem.type.toUpperCase()} Record</span>
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-[#98A2B3] hover:text-[#17181C] transition cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#344054] mb-1">Name</label>
                <input 
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">Status</label>
                <select
                  value={editFormData.status || 'Disabled'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] cursor-pointer"
                >
                  <option value="Enabled">Enabled</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              {editingItem.type === 'primary' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Primary Responsibility</label>
                    <textarea 
                      rows="3"
                      value={editFormData.responsibility || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, responsibility: e.target.value })}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Main Output</label>
                    <input 
                      type="text"
                      value={editFormData.mainOutput || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mainOutput: e.target.value })}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'subagent' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Parent Primary Agent Binding</label>
                    <input 
                      type="text"
                      value={editFormData.parent || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, parent: e.target.value })}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Specialized Functional Boundary</label>
                    <textarea 
                      rows="3"
                      value={editFormData.boundary || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, boundary: e.target.value })}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white resize-none"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'capability' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Category Type</label>
                    <input 
                      type="text"
                      value={editFormData.category || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">Capability Description</label>
                    <textarea 
                      rows="3"
                      value={editFormData.desc || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, desc: e.target.value })}
                      className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#ECEEF1] flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-[#7157F5] hover:bg-[#5F46D8] text-white px-4 py-2 rounded-[10px] text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


