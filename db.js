import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEmbedding, cosineSimilarity } from './embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'frugalforge.db');

const db = new Database(dbPath);

// Enable foreign key constraints & WAL mode for high performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// 1. Initial Table Migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    decisions TEXT,
    approvals TEXT,
    status TEXT DEFAULT 'Active',
    agent_count INTEGER DEFAULT 6,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'Green Field',
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_super_admin INTEGER DEFAULT 0,
    project_access_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bounded_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    persona_name TEXT NOT NULL,
    autonomy_level TEXT NOT NULL,
    model TEXT NOT NULL,
    priority TEXT DEFAULT 'P0',
    human_boundary TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agent_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL DEFAULT 'sdd-enterprise-dev',
    persona_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_workflows (
    project_id TEXT PRIMARY KEY,
    nodes_json TEXT NOT NULL,
    edges_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artefact_embeddings (
    id TEXT PRIMARY KEY,
    artefact_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artefact_type TEXT NOT NULL,
    content TEXT NOT NULL,
    vector_json TEXT NOT NULL,
    dimension INTEGER DEFAULT 384,
    metadata_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS layer0_ideas (
    idea_id TEXT PRIMARY KEY,
    version INTEGER DEFAULT 1,
    original_input TEXT,
    input_type TEXT,
    submitter TEXT,
    title TEXT,
    state_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS imported_signals (
    import_id TEXT PRIMARY KEY,
    publication_id TEXT,
    source_application TEXT,
    candidate_title TEXT,
    source_system TEXT,
    source_type TEXT,
    connector_mode TEXT,
    source_object_id TEXT,
    source_deep_link TEXT,
    content_hash TEXT,
    status TEXT DEFAULT 'READY_TO_IMPORT',
    sensitivity TEXT DEFAULT 'INTERNAL',
    contains_pii INTEGER DEFAULT 0,
    signal_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS spec_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL DEFAULT 'sdd-enterprise-dev',
    spec_id TEXT NOT NULL,
    requirement_id TEXT,
    title TEXT NOT NULL,
    spec_type TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT 'v1.0.0',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    content_markdown TEXT NOT NULL DEFAULT '',
    metadata_json TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requirements (
    requirement_id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    project_id TEXT NOT NULL DEFAULT 'sdd-enterprise-dev',
    title TEXT NOT NULL,
    submitter TEXT,
    status TEXT DEFAULT 'DRAFT',
    readiness_score INTEGER DEFAULT 0,
    requirement_markdown TEXT NOT NULL DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS generated_artefacts (
    id TEXT PRIMARY KEY,
    artefact_id TEXT NOT NULL,
    project_id TEXT NOT NULL DEFAULT 'sdd-enterprise-dev',
    stage_key TEXT NOT NULL,
    title TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT 'v1.0.0',
    status TEXT DEFAULT 'LATEST',
    content_json TEXT NOT NULL,
    metadata_json TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS spec_drifts (
    id TEXT PRIMARY KEY,
    parent_artefact_id TEXT NOT NULL,
    project_id TEXT NOT NULL DEFAULT 'Vendor Management',
    drift_description TEXT NOT NULL,
    raised_by TEXT NOT NULL DEFAULT 'Delivery Manager',
    status TEXT NOT NULL DEFAULT 'DRIFTED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe column migration for existing DBs
try { db.exec("ALTER TABLE agent_mappings ADD COLUMN notes TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE spec_drifts ADD COLUMN reviewer_comments TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE spec_drifts ADD COLUMN reviewed_by TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE spec_drifts ADD COLUMN reviewed_at DATETIME"); } catch (e) {}

// 2. Baseline 17 Personas Seed Data
const BASELINE_17_PERSONAS = [
  { id: 'per-01', name: 'Business Sponsor', role: 'Own business outcome, funding, scope boundary and priority trade-offs.', status: 'Active', decisions: 'Go/no-go, funding, scope acceptance', approvals: 'Business case and release business readiness', agent_count: 6 },
  { id: 'per-02', name: 'Product Owner', role: 'Own product vision, backlog priority, value and acceptance intent.', status: 'Active', decisions: 'Backlog ordering, MVP scope, business-side release readiness', approvals: 'User stories, acceptance criteria and UAT outcome', agent_count: 6 },
  { id: 'per-03', name: 'Business SME', role: 'Provide domain rules, operational scenarios, exceptions and data meaning.', status: 'Active', decisions: 'Domain correctness and business-rule interpretation', approvals: 'Requirements, specs and UAT scenarios', agent_count: 6 },
  { id: 'per-04', name: 'Business Analyst', role: 'Elicit, model, document, decompose and baseline requirements.', status: 'Active', decisions: 'Requirement completeness, story decomposition and acceptance-criteria readiness', approvals: 'Seeks PO/SME approval and reviews downstream traceability', agent_count: 6 },
  { id: 'per-05', name: 'Delivery Manager', role: 'Orchestrate ceremonies, remove blockers, manage flow and coordinate gates.', status: 'Active', decisions: 'Sprint readiness, workflow governance and impediment escalation', approvals: 'Sprint plan and delivery cadence review', agent_count: 6 },
  { id: 'per-06', name: 'UX Designer', role: 'Create journeys, wireframes, prototypes, usability flows and accessibility considerations.', status: 'Active', decisions: 'Interaction model and screen behavior proposal', approvals: 'Reviewed by PO, SMEs, Architect and QA', agent_count: 6 },
  { id: 'per-07', name: 'Solution Architect', role: 'Define solution structure, NFR fit, integration model, APIs and architecture decisions.', status: 'Active', decisions: 'HLD/LLD direction, ADRs, integration contracts and major technical trade-offs', approvals: 'Architecture baseline; reviewed with Security, Data and Tech Lead', agent_count: 6 },
  { id: 'per-08', name: 'Data Architect', role: 'Own conceptual/logical/physical data model, dictionary, quality and migration approach.', status: 'Active', decisions: 'Data model, schema design, retention and data dependencies', approvals: 'Specs, DB scripts and migration plan', agent_count: 6 },
  { id: 'per-09', name: 'Security Reviewer', role: 'Embed secure SDLC, privacy, regulatory, threat model and policy checks.', status: 'Active', decisions: 'Security acceptance, exception handling and risk rating', approvals: 'Security gate, threat model and risk exceptions', agent_count: 6 },
  { id: 'per-10', name: 'Technical Lead', role: 'Translate specs into implementation plan, standards, task breakdown and code-review ownership.', status: 'Active', decisions: 'Implementation approach, code-quality standards and technical acceptance', approvals: 'PR readiness and technical Definition of Done', agent_count: 6 },
  { id: 'per-11', name: 'Developer', role: 'Build code/configuration from approved specs, write unit tests and raise clarifications.', status: 'Active', decisions: 'Component-level implementation choices within approved architecture', approvals: 'Peer/Tech Lead reviews and Security/QA checks', agent_count: 6 },
  { id: 'per-12', name: 'QA Engineer', role: 'Create test strategy, cases, automation, defect evidence, summary and UAT support.', status: 'Active', decisions: 'Test coverage adequacy and defect severity recommendation', approvals: 'Test completion; UAT by PO/SME', agent_count: 6 },
  { id: 'per-13', name: 'DevOps Engineer', role: 'Manage pipelines, build automation, variables, deployment scripts, IaC and validation.', status: 'Active', decisions: 'Pipeline design and build/deploy automation controls', approvals: 'Reviewed by Release/Change, Security and Deployment Manager', agent_count: 6 },
  { id: 'per-14', name: 'Release Manager', role: 'Package release, coordinate approvals, schedule, risk/impact, rollback and release notes.', status: 'Active', decisions: 'Release readiness, change-approval workflow and calendar', approvals: 'CAB/change gate where required', agent_count: 6 },
  { id: 'per-15', name: 'Deployment Manager', role: 'Execute controlled deployment, environment readiness, smoke test, records and rollback coordination.', status: 'Active', decisions: 'Environment readiness and execution within approved window', approvals: 'Requires release/change approval before production', agent_count: 6 },
  { id: 'per-16', name: 'Platform Admin', role: 'Manage tenants/projects, RBAC, templates, workflows, integrations and audit retention.', status: 'Active', decisions: 'Platform configuration and access model', approvals: 'Reviewed by governance/security', agent_count: 15 },
  { id: 'per-17', name: 'Auditor', role: 'Independently inspect traceability, approvals, exceptions, test and deployment evidence.', status: 'Active', decisions: 'Audit finding classification', approvals: 'Does not approve delivery artifacts; audits evidence', agent_count: 6 },
  { id: 'per-18', name: 'Project Admin', role: 'Manage project-level governance, agent workflows, RBAC assignments and sprint boundaries.', status: 'Active', decisions: 'Project settings and workflow policies', approvals: 'Project configuration and agent mapping changes', agent_count: 15 }
];

const NON_ADMIN_PERSONAS = [
  'Business Sponsor', 'Product Owner', 'Business SME', 'Business Analyst', 'Delivery Manager', 
  'UX Designer', 'Solution Architect', 'Data Architect', 'Security Reviewer', 'Technical Lead', 
  'Developer', 'QA Engineer', 'DevOps Engineer', 'Release Manager', 'Deployment Manager', 'Auditor'
];

// Baseline Persona-Agent Mappings for 15 Enabled Primary Agents
export const BASELINE_AGENT_MAPPINGS = [
  { agentName: 'Requirement to Spec', personas: ['Product Owner'], notes: 'Elicitation & workshop synthesis' },
  { agentName: 'Spec to Story', personas: ['Business Analyst'], notes: 'Story drafting & acceptance criteria' },
  { agentName: 'User Stories', personas: ['Business Analyst'], notes: 'Story-to-spec decomposition' },
  { agentName: 'UX Wireframe', personas: ['UX Designer'], notes: 'Screen layout wireframes & prototypes' },
  { agentName: 'Functional Spec', personas: ['Business Analyst'], notes: 'Domain & business rule validation' },
  { agentName: 'Tech Architecture', personas: ['Solution Architect'], notes: 'Solution trade-offs & ADRs' },
  { agentName: 'Database Design', personas: ['Data Architect'], notes: 'ERD data model & retention design' },
  { agentName: 'Test Cases', personas: ['QA Engineer'], notes: 'Risk-based test suite & fixture generation' },
  { agentName: 'Traceability Matrix', personas: NON_ADMIN_PERSONAS, notes: 'End-to-end artifact lineage' },
  { agentName: 'Review Agent', personas: ['Technical Lead', 'QA Engineer', 'Product Owner'], notes: 'Multi-disciplinary PR & spec reviews' },
  { agentName: 'Live Debate Boardroom', personas: NON_ADMIN_PERSONAS, notes: 'Interactive multi-agent ARB debate' },
  { agentName: 'Enterprise Discovery', personas: NON_ADMIN_PERSONAS, notes: 'Pre-SDD requirement formation & signal intake workbench' },
  { agentName: 'Code to Spec', personas: ['Product Owner'], notes: 'Brownfield project scope focus' },
  { agentName: 'Global Traceability', personas: NON_ADMIN_PERSONAS, notes: 'Cross-functional evidence tracking' },
  { agentName: 'Agent Registry & Security', personas: ['Platform Admin', 'Project Admin'], notes: 'Super admin tenant governance & gate policies' },
  { agentName: 'Trust, Eval & Quality', personas: ['Platform Admin', 'Project Admin'], notes: 'Super admin AI evaluation & benchmark harness' }
];

// Baseline Projects Seed Data
const BASELINE_PROJECTS = [
  { id: 'proj-01', name: 'sdd-enterprise-dev', description: 'Enterprise Spec-Driven Development Platform', type: 'Green Field', status: 'Active' },
  { id: 'proj-02', name: 'mobile-app-v2', description: 'Mobile Customer Portal Revamp', type: 'Green Field', status: 'Active' },
  { id: 'proj-03', name: 'legacy-migration', description: 'Migration from legacy systems to cloud', type: 'Brown Field', status: 'Planning' }
];

// Baseline Users Seed Data (18 Users - One per SDLC Baseline Persona)
const BASELINE_USERS = [
  {
    id: 'user-01',
    name: 'Prasanna',
    email: 'prasanna@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Platform Admin'] },
      { projectId: 'mobile-app-v2', personas: ['Platform Admin'] },
      { projectId: 'legacy-migration', personas: ['Platform Admin'] }
    ]
  },
  {
    id: 'user-02',
    name: 'Prakash',
    email: 'prakash@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Project Admin'] },
      { projectId: 'mobile-app-v2', personas: ['Project Admin'] }
    ]
  },
  {
    id: 'user-03',
    name: 'Vignesh',
    email: 'vignesh@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Business Analyst'] },
      { projectId: 'legacy-migration', personas: ['Business Analyst'] }
    ]
  },
  {
    id: 'user-04',
    name: 'Mithra',
    email: 'mithra@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Product Owner'] },
      { projectId: 'mobile-app-v2', personas: ['Product Owner'] }
    ]
  },
  {
    id: 'user-05',
    name: 'Karthik',
    email: 'karthik@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Solution Architect'] },
      { projectId: 'legacy-migration', personas: ['Solution Architect'] }
    ]
  },
  {
    id: 'user-06',
    name: 'Saravanan',
    email: 'saravanan@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['QA Engineer'] }
    ]
  },
  {
    id: 'user-07',
    name: 'Rajesh Sharma',
    email: 'sponsor@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Business Sponsor'] }
    ]
  },
  {
    id: 'user-08',
    name: 'Deepa Venkat',
    email: 'sme@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Business SME'] }
    ]
  },
  {
    id: 'user-09',
    name: 'Anand Kumar',
    email: 'dm@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Delivery Manager'] }
    ]
  },
  {
    id: 'user-10',
    name: 'Ananya Sundaram',
    email: 'ux@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['UX Designer'] },
      { projectId: 'mobile-app-v2', personas: ['UX Designer'] }
    ]
  },
  {
    id: 'user-11',
    name: 'Siddharth Rao',
    email: 'data.architect@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Data Architect'] }
    ]
  },
  {
    id: 'user-12',
    name: 'Suresh Iyer',
    email: 'security@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Security Reviewer'] }
    ]
  },
  {
    id: 'user-13',
    name: 'Vikram Patel',
    email: 'techlead@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Technical Lead'] }
    ]
  },
  {
    id: 'user-14',
    name: 'Arjun Nair',
    email: 'developer@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Developer'] }
    ]
  },
  {
    id: 'user-15',
    name: 'Rohan Gupta',
    email: 'devops@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['DevOps Engineer'] }
    ]
  },
  {
    id: 'user-16',
    name: 'Priya Natarajan',
    email: 'releasemanager@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Release Manager'] }
    ]
  },
  {
    id: 'user-17',
    name: 'Ganesh Raman',
    email: 'deploymentmanager@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Deployment Manager'] }
    ]
  },
  {
    id: 'user-18',
    name: 'Lakshmi Narayanan',
    email: 'auditor@frugalforge.io',
    isSuperAdmin: 0,
    projectAccess: [
      { projectId: 'sdd-enterprise-dev', personas: ['Auditor'] }
    ]
  }
];

// Baseline Artifacts Seed Data
const BASELINE_ARTIFACTS = [
  {
    id: 'vec-art-01',
    artefact_id: 'art-spec-001',
    title: 'Return Request Tracker System Specification',
    artefact_type: 'Specification',
    content: 'Return Request Tracker system empowers customers to submit return requests, track RMA statuses, and receive refund vouchers. Includes POST /api/v1/returns and approval gates.'
  },
  {
    id: 'vec-art-02',
    artefact_id: 'art-adr-002',
    title: 'ADR-004: SQLite Embedded Vector Store Architecture',
    artefact_type: 'Architecture ADR',
    content: 'Decision to use SQLite embedded database with 384-dimensional dense vector embeddings and Cosine Similarity math for local zero-dependency artifact search.'
  },
  {
    id: 'vec-art-03',
    artefact_id: 'art-story-101',
    title: 'US-101: Initiate Merchandise Return Request',
    artefact_type: 'User Story',
    content: 'As an E-commerce Customer, I want to submit a return request within 30 days of item delivery so that I can receive a replacement or full refund. Criteria: Return button visible within 30-day window, Dropdown menu for return reason, Instant confirmation screen.'
  },
  {
    id: 'vec-art-04',
    artefact_id: 'art-story-102',
    title: 'US-102: Automated Refund Approval & Trigger',
    artefact_type: 'User Story',
    content: 'As a Warehouse Auditor, I want to scan incoming return packages to trigger automatic refunds so that customer refund processing time is minimized. Criteria: Barcode scanner input validates RMA code, Refunds under $500 processed automatically within 2 minutes.'
  },
  {
    id: 'vec-art-05',
    artefact_id: 'art-story-103',
    title: 'US-103: Real-time SMS & Email Notification Dispatch',
    artefact_type: 'User Story',
    content: 'As a Customer Service Lead, I want to automatically notify customers when return status changes so that support ticket volume is reduced. Criteria: SMS sent via Twilio when scanned at warehouse, Email sent with detailed refund receipt.'
  }
];

// Seed 17 Personas if database is empty
const personaCount = db.prepare('SELECT COUNT(*) as count FROM personas').get().count;
if (personaCount === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO personas (id, name, role, decisions, approvals, status, agent_count)
    VALUES (@id, @name, @role, @decisions, @approvals, @status, @agent_count)
  `);
  const insertMany = db.transaction((personas) => {
    for (const p of personas) insertStmt.run(p);
  });
  insertMany(BASELINE_17_PERSONAS);
  console.log('✅ SQLite DB initialized & seeded with 17 SDLC Baseline Personas');
}

// Seed Projects if database is empty
const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
if (projectCount === 0) {
  const insertProjectStmt = db.prepare(`
    INSERT INTO projects (id, name, description, type, status)
    VALUES (@id, @name, @description, @type, @status)
  `);
  const insertManyProjects = db.transaction((projects) => {
    for (const p of projects) insertProjectStmt.run(p);
  });
  insertManyProjects(BASELINE_PROJECTS);
  console.log('✅ SQLite DB seeded with Baseline Projects');
}

// Seed Users for all 18 SDLC Baseline Personas
db.prepare('DELETE FROM users').run();
const insertUserStmt = db.prepare(`
  INSERT INTO users (id, name, email, is_super_admin, project_access_json)
  VALUES (?, ?, ?, ?, ?)
`);
const insertManyUsers = db.transaction((usersList) => {
  for (const u of usersList) {
    insertUserStmt.run(
      u.id,
      u.name,
      u.email,
      u.isSuperAdmin ? 1 : 0,
      JSON.stringify(u.projectAccess || [])
    );
  }
});
insertManyUsers(BASELINE_USERS);
console.log('✅ SQLite DB seeded with Baseline Persona Users');

// Seed Agent Mappings if database is empty
function seedBaselineAgentMappings() {
  const insertStmt = db.prepare(`
    INSERT INTO agent_mappings (project_id, persona_name, agent_name, notes)
    VALUES (?, ?, ?, ?)
  `);
  const insertMany = db.transaction((mappingsList) => {
    for (const m of mappingsList) {
      for (const persona of m.personas) {
        insertStmt.run('sdd-enterprise-dev', persona, m.agentName, m.notes || '');
      }
    }
  });
  insertMany(BASELINE_AGENT_MAPPINGS);
}

const mappingCount = db.prepare('SELECT COUNT(*) as count FROM agent_mappings').get().count;
if (mappingCount === 0) {
  seedBaselineAgentMappings();
  console.log('✅ SQLite DB seeded with 15 Primary Agent Persona Mappings');
}

// Vector DB initialized empty for fresh start

// Format SQLite User Row into Object
function formatUserRow(row) {
  if (!row) return null;
  let projectAccess = [];
  try { projectAccess = JSON.parse(row.project_access_json || '[]'); } catch (e) {}
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isSuperAdmin: Boolean(row.is_super_admin),
    projectAccess
  };
}

// Export DB Handlers
export const dbService = {
  // Agent Mappings CRUD
  getAllAgentMappings: () => {
    return db.prepare(`
      SELECT id, project_id as projectId, persona_name as personaName, agent_name as agentName, notes, created_at as createdAt 
      FROM agent_mappings 
      ORDER BY id ASC
    `).all();
  },

  createAgentMapping: (m) => {
    const info = db.prepare(`
      INSERT INTO agent_mappings (project_id, persona_name, agent_name, notes)
      VALUES (?, ?, ?, ?)
    `).run(m.projectId || m.project || 'sdd-enterprise-dev', m.personaName || m.persona, m.agentName || m.agent, m.notes || '');
    return db.prepare('SELECT id, project_id as projectId, persona_name as personaName, agent_name as agentName, notes, created_at as createdAt FROM agent_mappings WHERE id = ?').get(info.lastInsertRowid);
  },

  deleteAgentMapping: (id) => {
    db.prepare('DELETE FROM agent_mappings WHERE id = ?').run(id);
    return { success: true };
  },

  resetAgentMappings: () => {
    db.prepare('DELETE FROM agent_mappings').run();
    seedBaselineAgentMappings();
    return dbService.getAllAgentMappings();
  },

  // Personas CRUD
  getAllPersonas: () => {
    return db.prepare('SELECT id, name, role, decisions, approvals, status, agent_count as agentCount FROM personas ORDER BY created_at ASC').all();
  },

  createPersona: (p) => {
    const id = p.id || 'per-' + Date.now();
    db.prepare(`
      INSERT INTO personas (id, name, role, decisions, approvals, status, agent_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, p.name, p.role || '', p.decisions || '', p.approvals || '', p.status || 'Active', p.agentCount || 6);
    return db.prepare('SELECT id, name, role, decisions, approvals, status, agent_count as agentCount FROM personas WHERE id = ?').get(id);
  },

  updatePersona: (id, p) => {
    db.prepare(`
      UPDATE personas 
      SET name = ?, role = ?, decisions = ?, approvals = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(p.name, p.role || '', p.decisions || '', p.approvals || '', p.status || 'Active', id);
    return db.prepare('SELECT id, name, role, decisions, approvals, status, agent_count as agentCount FROM personas WHERE id = ?').get(id);
  },

  deletePersona: (id) => {
    db.prepare('DELETE FROM personas WHERE id = ?').run(id);
    return { success: true };
  },

  resetPersonas: () => {
    db.prepare('DELETE FROM personas').run();
    const insertStmt = db.prepare(`
      INSERT INTO personas (id, name, role, decisions, approvals, status, agent_count)
      VALUES (@id, @name, @role, @decisions, @approvals, @status, @agent_count)
    `);
    const insertMany = db.transaction((personas) => {
      for (const p of personas) insertStmt.run(p);
    });
    insertMany(BASELINE_17_PERSONAS);
    return dbService.getAllPersonas();
  },

  // Projects CRUD
  getAllProjects: () => {
    return db.prepare('SELECT id, name, description, type, status, created_at as createdAt FROM projects ORDER BY created_at ASC').all();
  },

  createProject: (p) => {
    const id = p.id || 'proj-' + Date.now();
    db.prepare(`
      INSERT INTO projects (id, name, description, type, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, p.name, p.description || '', p.type || 'Green Field', p.status || 'Active');
    return db.prepare('SELECT id, name, description, type, status, created_at as createdAt FROM projects WHERE id = ?').get(id);
  },

  updateProject: (id, p) => {
    db.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(p.name, p.description || '', p.type || 'Green Field', p.status || 'Active', id);
    return db.prepare('SELECT id, name, description, type, status, created_at as createdAt FROM projects WHERE id = ?').get(id);
  },

  deleteProject: (id) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return { success: true };
  },

  // Users CRUD
  getAllUsers: () => {
    let rows = db.prepare('SELECT id, name, email, is_super_admin, project_access_json FROM users ORDER BY created_at ASC').all();
    if (rows.length < 17) {
      db.prepare('DELETE FROM users').run();
      const insertUserStmt = db.prepare(`
        INSERT INTO users (id, name, email, is_super_admin, project_access_json)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertManyUsers = db.transaction((usersList) => {
        for (const u of usersList) {
          insertUserStmt.run(
            u.id,
            u.name,
            u.email,
            u.isSuperAdmin ? 1 : 0,
            JSON.stringify(u.projectAccess || [])
          );
        }
      });
      insertManyUsers(BASELINE_USERS);
      rows = db.prepare('SELECT id, name, email, is_super_admin, project_access_json FROM users ORDER BY created_at ASC').all();
    }
    return rows.map(formatUserRow);
  },

  resetUsers: () => {
    db.prepare('DELETE FROM users').run();
    const insertUserStmt = db.prepare(`
      INSERT INTO users (id, name, email, is_super_admin, project_access_json)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertManyUsers = db.transaction((usersList) => {
      for (const u of usersList) {
        insertUserStmt.run(
          u.id,
          u.name,
          u.email,
          u.isSuperAdmin ? 1 : 0,
          JSON.stringify(u.projectAccess || [])
        );
      }
    });
    insertManyUsers(BASELINE_USERS);
    return dbService.getAllUsers();
  },

  createUser: (u) => {
    const id = u.id || 'user-' + Date.now();
    db.prepare(`
      INSERT INTO users (id, name, email, is_super_admin, project_access_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      u.name,
      u.email,
      u.isSuperAdmin ? 1 : 0,
      JSON.stringify(u.projectAccess || [])
    );
    return formatUserRow(db.prepare('SELECT id, name, email, is_super_admin, project_access_json FROM users WHERE id = ?').get(id));
  },

  updateUser: (id, u) => {
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, is_super_admin = ?, project_access_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      u.name,
      u.email,
      u.isSuperAdmin ? 1 : 0,
      JSON.stringify(u.projectAccess || []),
      id
    );
    return formatUserRow(db.prepare('SELECT id, name, email, is_super_admin, project_access_json FROM users WHERE id = ?').get(id));
  },

  deleteUser: (id) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return { success: true };
  },

  // Vector Database Operations
  storeArtefactVector: (item) => {
    const id = item.id || 'vec-' + Date.now();
    const artefactId = item.artefactId || 'art-' + Date.now();
    const title = item.title || 'Untitled Artifact';
    const artefactType = item.artefactType || item.type || 'Specification';
    const content = item.content || '';
    
    // Auto-generate vector embedding if not explicitly provided
    const vector = item.vector || generateEmbedding(`${title} ${content}`);
    const metadata = item.metadata || {};

    db.prepare(`
      INSERT OR REPLACE INTO artefact_embeddings (id, artefact_id, title, artefact_type, content, vector_json, dimension, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      artefactId,
      title,
      artefactType,
      content,
      JSON.stringify(vector),
      vector.length,
      JSON.stringify(metadata)
    );

    return { id, artefactId, title, artefactType, content, dimension: vector.length };
  },

  getAllArtefactVectors: () => {
    const rows = db.prepare('SELECT id, artefact_id as artefactId, title, artefact_type as artefactType, content, vector_json, dimension, metadata_json, created_at as createdAt FROM artefact_embeddings ORDER BY created_at DESC').all();
    return rows.map(r => {
      let vector = [];
      let metadata = {};
      try { vector = JSON.parse(r.vector_json); } catch (e) {}
      try { metadata = JSON.parse(r.metadata_json); } catch (e) {}
      return { ...r, vector, metadata };
    });
  },

  searchArtefactVectors: (queryText, topK = 5) => {
    const queryVector = generateEmbedding(queryText);
    const allVectors = dbService.getAllArtefactVectors();

    const scored = allVectors.map(item => {
      const score = cosineSimilarity(queryVector, item.vector);
      return {
        id: item.id,
        artefactId: item.artefactId,
        title: item.title,
        artefactType: item.artefactType,
        content: item.content,
        similarityScore: Number(score.toFixed(4)),
        createdAt: item.createdAt
      };
    });

    // Sort descending by similarity score
    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    return scored.slice(0, topK);
  },

  deleteArtefactVector: (id) => {
    db.prepare('DELETE FROM artefact_embeddings WHERE id = ? OR artefact_id = ?').run(id, id);
    return { success: true };
  },

  // ----------------------------------------------------
  // Layer 0 Ideas & Signals SQLite Persistence Operations
  // ----------------------------------------------------
  getAllLayer0Ideas: () => {
    const rows = db.prepare('SELECT state_json FROM layer0_ideas ORDER BY created_at DESC').all();
    return rows.map(r => {
      try { return JSON.parse(r.state_json); } catch (e) { return null; }
    }).filter(Boolean);
  },

  getLayer0IdeaById: (ideaId) => {
    const row = db.prepare('SELECT state_json FROM layer0_ideas WHERE idea_id = ?').get(ideaId);
    if (!row) return null;
    try { return JSON.parse(row.state_json); } catch (e) { return null; }
  },

  upsertLayer0Idea: (idea) => {
    if (!idea || !idea.ideaId) return null;
    idea.projectId = idea.projectId || 'sdd-enterprise-dev';
    const ideaId = idea.ideaId;
    const version = idea.version || 1;
    const originalInput = idea.originalInput || '';
    const inputType = idea.inputType || 'IDEA';
    const submitter = idea.submitter || 'Delivery Manager';
    const title = idea.title || '';
    const stateJson = JSON.stringify(idea);

    db.prepare(`
      INSERT INTO layer0_ideas (idea_id, version, original_input, input_type, submitter, title, state_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(idea_id) DO UPDATE SET
        version = excluded.version,
        original_input = excluded.original_input,
        input_type = excluded.input_type,
        submitter = excluded.submitter,
        title = excluded.title,
        state_json = excluded.state_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(ideaId, version, originalInput, inputType, submitter, title, stateJson);

    // Sync to dedicated requirements table
    const reqId = idea.compiledRequirement?.requirementId || ideaId;
    const reqStatus = idea.humanDecision?.status || 'DRAFT';
    const readinessScore = idea.readinessScore || 0;
    const reqMarkdown = idea.compiledRequirement?.markdown || originalInput || '';
    const reqTitle = title || idea.ideaBrief?.title || 'Untitled Requirement';

    try {
      db.prepare(`
        INSERT INTO requirements (requirement_id, idea_id, project_id, title, submitter, status, readiness_score, requirement_markdown, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(requirement_id) DO UPDATE SET
          idea_id = excluded.idea_id,
          project_id = excluded.project_id,
          title = excluded.title,
          submitter = excluded.submitter,
          status = excluded.status,
          readiness_score = excluded.readiness_score,
          requirement_markdown = excluded.requirement_markdown,
          updated_at = CURRENT_TIMESTAMP
      `).run(reqId, ideaId, idea.projectId, reqTitle, submitter, reqStatus, readinessScore, reqMarkdown);

      db.prepare(`
        INSERT INTO generated_artefacts (id, artefact_id, project_id, stage_key, title, version, status, content_json, metadata_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          status = excluded.status,
          content_json = excluded.content_json,
          metadata_json = excluded.metadata_json,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        `${reqId}-v1.0.0`,
        reqId,
        idea.projectId || 'Vendor Management',
        'requirement-to-spec',
        `Requirement Specification (${reqTitle})`,
        'v1.0.0',
        'LATEST',
        JSON.stringify({ title: reqTitle, requirementId: reqId, markdown: reqMarkdown }),
        JSON.stringify({ parentArtefactId: 'INTAKE-SIGNAL', parentArtefactVersion: 'v1.0.0' })
      );
    } catch (e) {
      console.error('Failed to sync requirements/generated_artefacts table:', e);
    }

    return idea;
  },

  updateRequirementStatus: (ideaId, newStatus = 'APPROVED') => {
    if (!ideaId) return null;
    const idea = dbService.getLayer0IdeaById(ideaId);
    if (idea) {
      if (!idea.humanDecision) idea.humanDecision = {};
      idea.humanDecision.status = newStatus;
      idea.humanDecision.decidedAt = new Date().toISOString();
      dbService.upsertLayer0Idea(idea);
    }
    db.prepare('UPDATE requirements SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE idea_id = ? OR requirement_id = ?').run(newStatus, ideaId, ideaId);
    return { success: true, ideaId, status: newStatus };
  },

  getAllRequirements: (projectId) => {
    let sql = 'SELECT * FROM requirements ORDER BY updated_at DESC';
    let params = [];
    if (projectId) {
      sql = "SELECT * FROM requirements WHERE (project_id = ? OR project_id = 'sdd-enterprise-dev' OR ? = 'sdd-enterprise-dev') ORDER BY updated_at DESC";
      params = [projectId, projectId];
    }
    return db.prepare(sql).all(...params);
  },

  deleteLayer0Idea: (ideaId) => {
    db.prepare('DELETE FROM layer0_ideas WHERE idea_id = ?').run(ideaId);
    db.prepare('DELETE FROM requirements WHERE idea_id = ? OR requirement_id = ?').run(ideaId, ideaId);
    return { success: true };
  },

  clearAllLayer0Ideas: () => {
    db.prepare('DELETE FROM layer0_ideas').run();
    db.prepare('DELETE FROM requirements').run();
    return { success: true };
  },

  clearAllEvidenceLedger: () => {
    const rows = db.prepare('SELECT idea_id, state_json FROM layer0_ideas').all();
    for (const r of rows) {
      try {
        const idea = JSON.parse(r.state_json);
        idea.evidence = [];
        db.prepare('UPDATE layer0_ideas SET state_json = ?, updated_at = CURRENT_TIMESTAMP WHERE idea_id = ?')
          .run(JSON.stringify(idea), r.idea_id);
      } catch (e) {}
    }
    try {
      db.prepare('DELETE FROM artefact_embeddings').run();
    } catch (e) {}
    return { success: true };
  },

  getAllSignals: () => {
    const rows = db.prepare('SELECT signal_json FROM imported_signals ORDER BY created_at DESC').all();
    return rows.map(r => {
      try { return JSON.parse(r.signal_json); } catch (e) { return null; }
    }).filter(Boolean);
  },

  getSignalById: (importId) => {
    if (!importId) return null;
    const row = db.prepare('SELECT signal_json FROM imported_signals WHERE import_id = ?').get(importId);
    if (row) {
      try { return JSON.parse(row.signal_json); } catch (e) {}
    }
    const allRows = db.prepare('SELECT signal_json FROM imported_signals').all();
    for (const r of allRows) {
      try {
        const parsed = JSON.parse(r.signal_json);
        if (parsed.importId === importId || parsed.signalId === importId || parsed.publicationId === importId) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  },

  upsertSignal: (signal) => {
    if (!signal || !signal.importId) return null;
    const importId = signal.importId;
    const publicationId = signal.publicationId || '';
    const sourceApplication = signal.sourceApplication || '';
    const candidateTitle = signal.candidateTitle || '';
    const sourceSystem = signal.source?.sourceSystem || '';
    const sourceType = signal.source?.sourceType || '';
    const connectorMode = signal.source?.connectorMode || '';
    const sourceObjectId = signal.source?.sourceObjectId || '';
    const sourceDeepLink = signal.source?.sourceDeepLink || '';
    const contentHash = signal.provenance?.contentHash || '';
    const status = signal.status || 'READY_TO_IMPORT';
    const sensitivity = signal.governance?.sensitivity || 'INTERNAL';
    const containsPii = signal.governance?.containsPotentialPII ? 1 : 0;
    const signalJson = JSON.stringify(signal);

    db.prepare(`
      INSERT INTO imported_signals (import_id, publication_id, source_application, candidate_title, source_system, source_type, connector_mode, source_object_id, source_deep_link, content_hash, status, sensitivity, contains_pii, signal_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(import_id) DO UPDATE SET
        publication_id = excluded.publication_id,
        source_application = excluded.source_application,
        candidate_title = excluded.candidate_title,
        source_system = excluded.source_system,
        source_type = excluded.source_type,
        connector_mode = excluded.connector_mode,
        source_object_id = excluded.source_object_id,
        source_deep_link = excluded.source_deep_link,
        content_hash = excluded.content_hash,
        status = excluded.status,
        sensitivity = excluded.sensitivity,
        contains_pii = excluded.contains_pii,
        signal_json = excluded.signal_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(importId, publicationId, sourceApplication, candidateTitle, sourceSystem, sourceType, connectorMode, sourceObjectId, sourceDeepLink, contentHash, status, sensitivity, containsPii, signalJson);

    return signal;
  },

  deleteSignal: (importId) => {
    db.prepare('DELETE FROM imported_signals WHERE import_id = ?').run(importId);
    return { success: true };
  },

  clearAllSignals: () => {
    db.prepare('DELETE FROM imported_signals').run();
    return { success: true };
  },

  // ----------------------------------------------------
  // Spec Documents SQLite Persistence Operations
  // ----------------------------------------------------
  getAllSpecDocuments: (projectId) => {
    let rows;
    if (projectId) {
      rows = db.prepare('SELECT * FROM spec_documents WHERE project_id = ? ORDER BY updated_at DESC').all(projectId);
    } else {
      rows = db.prepare('SELECT * FROM spec_documents ORDER BY updated_at DESC').all();
    }
    return rows.map(r => ({
      id: r.id,
      projectId: r.project_id,
      specId: r.spec_id,
      requirementId: r.requirement_id,
      title: r.title,
      specType: r.spec_type,
      version: r.version,
      status: r.status,
      contentMarkdown: r.content_markdown,
      metadata: JSON.parse(r.metadata_json || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  },

  getSpecDocumentById: (id) => {
    const r = db.prepare('SELECT * FROM spec_documents WHERE id = ? OR spec_id = ?').get(id, id);
    if (!r) return null;
    return {
      id: r.id,
      projectId: r.project_id,
      specId: r.spec_id,
      requirementId: r.requirement_id,
      title: r.title,
      specType: r.spec_type,
      version: r.version,
      status: r.status,
      contentMarkdown: r.content_markdown,
      metadata: JSON.parse(r.metadata_json || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  },

  upsertSpecDocument: (doc) => {
    const id = doc.id || doc.specId || `SPEC-DOC-${Date.now()}`;
    const projectId = doc.projectId || 'sdd-enterprise-dev';
    const specId = doc.specId || id;
    const requirementId = doc.requirementId || '';
    const title = doc.title || 'Untitled Spec';
    const specType = doc.specType || 'REQUIREMENT_SPEC';
    const version = doc.version || 'v1.0.0';
    const status = doc.status || 'DRAFT';
    const contentMarkdown = doc.contentMarkdown || doc.content || '';
    const metadataJson = JSON.stringify(doc.metadata || doc.metadataJson || {});

    db.prepare(`
      INSERT INTO spec_documents (id, project_id, spec_id, requirement_id, title, spec_type, version, status, content_markdown, metadata_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        spec_id = excluded.spec_id,
        requirement_id = excluded.requirement_id,
        title = excluded.title,
        spec_type = excluded.spec_type,
        version = excluded.version,
        status = excluded.status,
        content_markdown = excluded.content_markdown,
        metadata_json = excluded.metadata_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, projectId, specId, requirementId, title, specType, version, status, contentMarkdown, metadataJson);

    if (status === 'BASELINED_APPROVED' || status === 'APPROVED') {
      try {
        db.prepare(`
          UPDATE spec_documents
          SET status = 'SUPERSEDED'
          WHERE (spec_id = ? OR (requirement_id = ? AND requirement_id != ''))
            AND id != ?
            AND (project_id = ? OR project_id = 'sdd-enterprise-dev')
        `).run(specId, requirementId, id, projectId);
      } catch (e) {}
    }

    return dbService.getSpecDocumentById(id);
  },

  deleteSpecDocument: (id) => {
    db.prepare('DELETE FROM spec_documents WHERE id = ? OR spec_id = ?').run(id, id);
    return { success: true };
  },

  clearAllSpecDocuments: () => {
    db.prepare('DELETE FROM spec_documents').run();
    return { success: true };
  },

  // ----------------------------------------------------
  // Generated SDLC Artefacts Operations (Versioned)
  // ----------------------------------------------------
  getGeneratedArtefacts: (projectId, stageKey) => {
    let sql = 'SELECT * FROM generated_artefacts WHERE 1=1';
    const params = [];
    if (stageKey) {
      sql += ' AND stage_key = ?';
      params.push(stageKey);
    }
    if (projectId) {
      sql += " AND (project_id = ? OR project_id = 'Vendor Management' OR project_id = 'sdd-enterprise-dev' OR ? = 'sdd-enterprise-dev' OR ? = 'Vendor Management')";
      params.push(projectId, projectId, projectId);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);
    const resultList = rows.map(r => {
      let content = r.content_json;
      let metadata = {};
      try { content = JSON.parse(r.content_json); } catch (e) {}
      try { metadata = JSON.parse(r.metadata_json); } catch (e) {}
      return {
        id: r.id,
        artefactId: r.artefact_id,
        projectId: r.project_id,
        stageKey: r.stage_key,
        title: r.title,
        version: r.version,
        status: r.status,
        content,
        metadata,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });

    if (!stageKey || stageKey === 'requirement-to-spec' || stageKey === 'spec') {
      try {
        let reqSql = 'SELECT * FROM requirements ORDER BY updated_at DESC';
        let reqParams = [];
        if (projectId) {
          reqSql = "SELECT * FROM requirements WHERE (project_id = ? OR project_id = 'Vendor Management' OR project_id = 'sdd-enterprise-dev' OR ? = 'sdd-enterprise-dev' OR ? = 'Vendor Management') ORDER BY updated_at DESC";
          reqParams = [projectId, projectId, projectId];
        }
        const reqRows = db.prepare(reqSql).all(...reqParams);
        for (const req of reqRows) {
          const reqId = req.requirement_id || req.idea_id;
          const exists = resultList.some(a => a.artefactId === reqId || (a.id && a.id.includes(reqId)));
          if (!exists) {
            resultList.push({
              id: `${reqId}-v1.0.0`,
              artefactId: reqId,
              projectId: req.project_id || 'Vendor Management',
              stageKey: 'requirement-to-spec',
              title: `Requirement Specification (${req.title})`,
              version: 'v1.0.0',
              status: 'LATEST',
              content: {
                title: req.title,
                requirementId: reqId,
                markdown: req.requirement_markdown
              },
              metadata: {
                parentArtefactId: reqId,
                parentArtefactVersion: 'v1.0.0'
              },
              createdAt: req.created_at,
              updatedAt: req.updated_at
            });
          }
        }
      } catch (e) {
        console.warn('Error merging requirements into generated_artefacts:', e);
      }
    }

    return resultList;
  },

  getGeneratedArtefactById: (id) => {
    const r = db.prepare('SELECT * FROM generated_artefacts WHERE id = ?').get(id);
    if (!r) return null;
    let content = r.content_json;
    let metadata = {};
    try { content = JSON.parse(r.content_json); } catch (e) {}
    try { metadata = JSON.parse(r.metadata_json); } catch (e) {}
    return {
      id: r.id,
      artefactId: r.artefact_id,
      projectId: r.project_id,
      stageKey: r.stage_key,
      title: r.title,
      version: r.version,
      status: r.status,
      content,
      metadata,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  },

  saveNextArtefactVersion: (item) => {
    if (!item) return null;
    const projectId = item.projectId || 'Vendor Management';
    const stageKey = item.stageKey || 'general';
    const artefactId = item.artefactId || `ART-${Date.now().toString().slice(-4)}`;
    const title = item.title || 'SDLC Artefact';
    const content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content || {});
    const metadata = item.metadata || {};

    // 1. Calculate next version (e.g. v1.0.0, v2.0.0...)
    const existingRows = db.prepare(
      'SELECT version FROM generated_artefacts WHERE project_id = ? AND artefact_id = ?'
    ).all(projectId, artefactId);

    let maxNum = 0;
    existingRows.forEach(r => {
      const match = r.version.match(/^v(\d+)\./);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextVersion = `v${maxNum + 1}.0.0`;
    const docId = `${artefactId}-${nextVersion}`;

    // 2. Mark previous versions for this artefactId as SUPERSEDED
    db.prepare(`
      UPDATE generated_artefacts 
      SET status = 'SUPERSEDED', updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND artefact_id = ?
    `).run(projectId, artefactId);

    // 3. Upsert new version with status = 'LATEST'
    db.prepare(`
      INSERT INTO generated_artefacts (id, artefact_id, project_id, stage_key, title, version, status, content_json, metadata_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        stage_key = excluded.stage_key,
        title = excluded.title,
        status = excluded.status,
        content_json = excluded.content_json,
        metadata_json = excluded.metadata_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      docId,
      artefactId,
      projectId,
      stageKey,
      title,
      nextVersion,
      'LATEST',
      content,
      JSON.stringify({ ...metadata, version: nextVersion })
    );

    // 4. Vectorize & store into artefact_embeddings
    dbService.storeArtefactVector({
      id: docId,
      artefactId,
      title: `${title} (${nextVersion})`,
      artefactType: stageKey,
      content,
      metadata: { ...metadata, projectId, stageKey, version: nextVersion, isLatest: true }
    });

    return dbService.getGeneratedArtefactById(docId);
  },

  clearAllGeneratedArtefacts: () => {
    db.prepare('DELETE FROM generated_artefacts').run();
    return { success: true };
  },

  // ----------------------------------------------------
  // Spec Drifts Persistence Operations
  // ----------------------------------------------------
  saveSpecDrift: (drift) => {
    if (!drift) return null;
    const id = drift.id || `DRIFT-${Date.now()}`;
    const parentArtefactId = drift.parentArtefactId || drift.specId || 'SPEC-001';
    const projectId = drift.projectId || 'Vendor Management';
    const driftDescription = drift.driftDescription || drift.changeDetails || 'Specification modification requested.';
    const raisedBy = drift.raisedBy || drift.submitter || 'Delivery Manager';
    const status = drift.status || 'DRIFTED';

    db.prepare(`
      INSERT INTO spec_drifts (id, parent_artefact_id, project_id, drift_description, raised_by, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        parent_artefact_id = excluded.parent_artefact_id,
        project_id = excluded.project_id,
        drift_description = excluded.drift_description,
        raised_by = excluded.raised_by,
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, parentArtefactId, projectId, driftDescription, raisedBy, status);

    return dbService.getSpecDriftById(id);
  },

  getSpecDriftById: (id) => {
    if (!id) return null;
    const cleanId = String(id).trim();
    const row = db.prepare(`
      SELECT * FROM spec_drifts 
      WHERE id = ? OR parent_artefact_id = ? 
      OR id LIKE ? OR parent_artefact_id LIKE ?
      ORDER BY updated_at DESC
    `).get(cleanId, cleanId, `%${cleanId}%`, `%${cleanId}%`) || db.prepare('SELECT * FROM spec_drifts ORDER BY updated_at DESC LIMIT 1').get();

    if (!row) return null;
    return {
      id: row.id,
      parentArtefactId: row.parent_artefact_id,
      projectId: row.project_id,
      driftDescription: row.drift_description,
      raisedBy: row.raised_by,
      status: row.status,
      reviewerComments: row.reviewer_comments || '',
      reviewedBy: row.reviewed_by || '',
      reviewedAt: row.reviewed_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  updateSpecDriftStatus: ({ id, parentArtefactId, status, reviewerComments, reviewedBy }) => {
    const targetId = String(id || parentArtefactId || '').trim();
    const newStatus = status || 'ACCEPTED';
    const revComments = reviewerComments || '';
    const revBy = reviewedBy || 'Product Owner';

    if (targetId) {
      db.prepare(`
        UPDATE spec_drifts
        SET status = ?,
            reviewer_comments = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR parent_artefact_id = ? OR id LIKE ? OR parent_artefact_id LIKE ?
      `).run(newStatus, revComments, revBy, targetId, targetId, `%${targetId}%`, `%${targetId}%`);
    } else {
      db.prepare(`
        UPDATE spec_drifts
        SET status = ?,
            reviewer_comments = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'DRIFTED'
      `).run(newStatus, revComments, revBy);
    }

    const updatedRow = dbService.getSpecDriftById(targetId) || {
      id: targetId || 'DRIFT-001',
      parentArtefactId: targetId || 'SPEC-REQ001',
      status: newStatus,
      reviewerComments: revComments,
      reviewedBy: revBy
    };

    return updatedRow;
  },

  getSpecDrifts: (projectId) => {
    let sql = 'SELECT * FROM spec_drifts ORDER BY created_at DESC';
    const rows = db.prepare(sql).all();
    return rows.map(r => ({
      id: r.id,
      parentArtefactId: r.parent_artefact_id,
      projectId: r.project_id,
      driftDescription: r.drift_description,
      raisedBy: r.raised_by,
      status: r.status,
      reviewerComments: r.reviewer_comments || '',
      reviewedBy: r.reviewed_by || '',
      reviewedAt: r.reviewed_at || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  },

  updateSpecDriftStatus: ({ id, status, reviewerComments, reviewedBy }) => {
    if (!id || !status) return null;
    const revComments = reviewerComments || '';
    const revBy = reviewedBy || 'Product Owner';

    db.prepare(`
      UPDATE spec_drifts
      SET status = ?,
          reviewer_comments = ?,
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR parent_artefact_id = ?
    `).run(status, revComments, revBy, id, id);

    return dbService.getSpecDriftById(id);
  }
};

// Migrate existing layer0_ideas to ensure every idea has a valid projectId
try {
  const rows = db.prepare('SELECT idea_id, state_json FROM layer0_ideas').all();
  for (const r of rows) {
    try {
      const idea = JSON.parse(r.state_json);
      if (!idea.projectId) {
        if (r.idea_id.includes('2427') || r.idea_id.includes('1238')) {
          idea.projectId = 'mobile-app-v2';
        } else if (r.idea_id.includes('2261') || r.idea_id.includes('8158')) {
          idea.projectId = 'legacy-migration';
        } else {
          idea.projectId = 'sdd-enterprise-dev';
        }
        db.prepare('UPDATE layer0_ideas SET state_json = ? WHERE idea_id = ?').run(JSON.stringify(idea), r.idea_id);
      }

      // Backfill into requirements table
      const reqId = idea.compiledRequirement?.requirementId || idea.ideaId || r.idea_id;
      const reqStatus = idea.humanDecision?.status || 'DRAFT';
      const readinessScore = idea.readinessScore || 0;
      const reqMarkdown = idea.compiledRequirement?.markdown || idea.originalInput || '';
      const reqTitle = idea.title || idea.ideaBrief?.title || 'Untitled Requirement';

      db.prepare(`
        INSERT INTO requirements (requirement_id, idea_id, project_id, title, submitter, status, readiness_score, requirement_markdown, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(requirement_id) DO UPDATE SET
          idea_id = excluded.idea_id,
          project_id = excluded.project_id,
          title = excluded.title,
          submitter = excluded.submitter,
          status = excluded.status,
          readiness_score = excluded.readiness_score,
          requirement_markdown = excluded.requirement_markdown,
          updated_at = CURRENT_TIMESTAMP
      `).run(reqId, r.idea_id, idea.projectId || 'sdd-enterprise-dev', reqTitle, idea.submitter || 'Delivery Manager', reqStatus, readinessScore, reqMarkdown);

      // Backfill into spec_documents table for every requirement
      const specId = `SPEC-${reqId.replace(/^REQ-/, '').replace(/^IDEA-/, '')}`;
      db.prepare(`
        INSERT INTO spec_documents (id, project_id, spec_id, requirement_id, title, spec_type, version, status, content_markdown, metadata_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          project_id = excluded.project_id,
          spec_id = excluded.spec_id,
          requirement_id = excluded.requirement_id,
          title = excluded.title,
          spec_type = excluded.spec_type,
          version = excluded.version,
          status = excluded.status,
          content_markdown = excluded.content_markdown,
          metadata_json = excluded.metadata_json,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        specId,
        idea.projectId || 'sdd-enterprise-dev',
        specId,
        reqId,
        reqTitle,
        'REQUIREMENT_SPEC',
        'v1.0.0',
        'BASELINED_APPROVED',
        reqMarkdown,
        JSON.stringify({ owner: idea.submitter || 'Requirements AI Agent', qualityScore: 99.0 })
      );
    } catch (e) {}
  }
} catch (err) {}

export default db;
