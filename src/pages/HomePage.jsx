import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageContext } from '../context/PageContext';
import { userService } from '../services/userService';

// Dedicated workspace configurations by persona / role
const ROLE_WORKSPACES = {
  'Platform Admin': {
    primaryRoute: '/admin/dashboard',
    primaryLabel: 'Enter Platform Admin Control Plane',
    icon: 'fas fa-user-shield',
    description: 'Manage AI models, user persona mappings, debate circles, vector databases, and system workflows.',
    recommendedSections: [
      { label: 'Admin Dashboard', path: '/admin/dashboard', icon: 'fas fa-chart-pie', desc: 'System overview & model metrics', badge: 'Admin' },
      { label: 'Spec & Control Plane', path: '/spec-control', icon: 'fas fa-sitemap', desc: 'Authoritative baseline specs & AST graph', badge: 'Layer 4' },
      { label: 'AI Debate Boardroom', path: '/validator', icon: 'fas fa-balance-scale', desc: 'Multi-model consensus review', badge: 'AI-SRB' },
      { label: 'Trust & Eval Harness', path: '/knowledge-fabric', icon: 'fas fa-brain', desc: 'RAG grounding & policy conformance', badge: 'Layer 3' }
    ]
  },
  'Super Admin': {
    primaryRoute: '/admin/dashboard',
    primaryLabel: 'Enter Super Admin Governance Suite',
    icon: 'fas fa-user-shield',
    description: 'Full administrative access across models, users, projects, and autonomous agent registries.',
    recommendedSections: [
      { label: 'Admin Dashboard', path: '/admin/dashboard', icon: 'fas fa-chart-pie', desc: 'System overview & model metrics', badge: 'Admin' },
      { label: 'Agent Mapping Plane', path: '/admin/agent-mapping', icon: 'fas fa-network-wired', desc: 'Map agents to user personas', badge: 'Config' },
      { label: 'Spec & Control Plane', path: '/spec-control', icon: 'fas fa-sitemap', desc: 'Authoritative spec registry', badge: 'Layer 4' },
      { label: 'Evidence Ledger', path: '/global-traceability', icon: 'fas fa-history', desc: 'Audit compliance history', badge: 'Layer 1' }
    ]
  },
  'Project Admin': {
    primaryRoute: '/layer0',
    primaryLabel: 'Enter Project Admin Workspace',
    icon: 'fas fa-tasks',
    description: 'Lead end-to-end SDLC workflows, enterprise discovery, requirement generation, and compliance.',
    recommendedSections: [
      { label: 'Enterprise Discovery', path: '/layer0', icon: 'fas fa-lightbulb', desc: 'Pre-SDD signal intake & idea briefs', badge: 'Layer 0' },
      { label: 'Requirement to Spec', path: '/requirement-to-spec', icon: 'fas fa-file-signature', desc: 'SpeckIt package generator', badge: 'Layer 2' },
      { label: 'Spec to Story', path: '/spec-to-story', icon: 'fas fa-exchange-alt', desc: 'Agile story decomposition', badge: 'Backlog' },
      { label: 'Evidence Ledger', path: '/global-traceability', icon: 'fas fa-history', desc: 'Cryptographic audit ledger', badge: 'Layer 1' }
    ]
  },
  'Product Owner': {
    primaryRoute: '/layer0',
    primaryLabel: 'Enter Product Owner Workspace',
    icon: 'fas fa-clipboard-list',
    description: 'Shape business requirements, decompose user stories, and oversee product feature baselines.',
    recommendedSections: [
      { label: 'Enterprise Discovery', path: '/layer0', icon: 'fas fa-lightbulb', desc: 'Signal intake & business briefs', badge: 'Layer 0' },
      { label: 'Requirement to Spec', path: '/requirement-to-spec', icon: 'fas fa-file-signature', desc: 'SpeckIt requirement packages', badge: 'Layer 2' },
      { label: 'Agile User Stories', path: '/user-stories', icon: 'fas fa-list-check', desc: 'Sprint backlog & epics', badge: 'Backlog' },
      { label: 'Evidence Ledger', path: '/global-traceability', icon: 'fas fa-history', desc: 'Audit compliance history', badge: 'Layer 1' }
    ]
  },
  'Business Analyst': {
    primaryRoute: '/requirement-to-spec',
    primaryLabel: 'Enter Business Analyst Workspace',
    icon: 'fas fa-file-invoice',
    description: 'Convert business requirements into structured SpeckIt specs, functional specifications, and user stories.',
    recommendedSections: [
      { label: 'Requirement to Spec', path: '/requirement-to-spec', icon: 'fas fa-file-signature', desc: 'SpeckIt specification generator', badge: 'Layer 2' },
      { label: 'Spec to Story', path: '/spec-to-story', icon: 'fas fa-exchange-alt', desc: 'Agile user story generator', badge: 'Layer 2' },
      { label: 'Functional Spec', path: '/functional-spec', icon: 'fas fa-file-alt', desc: 'FSD compilation & API contracts', badge: 'Spec' },
      { label: 'UX Wireframes', path: '/ux-wireframe', icon: 'fas fa-desktop', desc: 'Tailwind interactive prototypes', badge: 'UX' }
    ]
  },
  'Solution Architect': {
    primaryRoute: '/tech-architecture',
    primaryLabel: 'Enter Solution Architect Workspace',
    icon: 'fas fa-sitemap',
    description: 'Design system blueprints, tech stacks, ERD database schemas, and reverse-engineer legacy code.',
    recommendedSections: [
      { label: 'Tech Architecture', path: '/tech-architecture', icon: 'fas fa-sitemap', desc: 'Blueprints & stack specs', badge: 'Arch' },
      { label: 'Database Design', path: '/database-design', icon: 'fas fa-database', desc: 'ERD diagrams & DDL creations', badge: 'DB' },
      { label: 'Code to Spec (Brownfield)', path: '/code-to-spec', icon: 'fas fa-microchip', desc: 'Reverse-engineer codebase baseline', badge: 'Reverse' },
      { label: 'Impact & Gap Specs', path: '/impact-analysis', icon: 'fas fa-search-minus', desc: 'System impact analysis', badge: 'Delta' }
    ]
  },
  'Technical Lead': {
    primaryRoute: '/tech-architecture',
    primaryLabel: 'Enter Tech Lead Engineering Workspace',
    icon: 'fas fa-code-branch',
    description: 'Oversee technical architecture, spec control baselines, and sprint story execution.',
    recommendedSections: [
      { label: 'Tech Architecture', path: '/tech-architecture', icon: 'fas fa-sitemap', desc: 'Blueprints & tech stack spec', badge: 'Arch' },
      { label: 'Spec to Story', path: '/spec-to-story', icon: 'fas fa-exchange-alt', desc: 'Sprint story decomposition', badge: 'Agile' },
      { label: 'Code to Spec', path: '/code-to-spec', icon: 'fas fa-microchip', desc: 'Reverse-engineer code baseline', badge: 'Baseline' },
      { label: 'Spec Control Plane', path: '/spec-control', icon: 'fas fa-sitemap', desc: 'Authoritative spec graph plane', badge: 'Layer 4' }
    ]
  },
  'Developer': {
    primaryRoute: '/spec-to-story',
    primaryLabel: 'Enter Developer Implementation Workspace',
    icon: 'fas fa-code',
    description: 'Implement sprint user stories, inspect Tailwind UX wireframes, and view database DDL schemas.',
    recommendedSections: [
      { label: 'Spec to Story', path: '/spec-to-story', icon: 'fas fa-exchange-alt', desc: 'Agile story generator', badge: 'Agile' },
      { label: 'User Stories', path: '/user-stories', icon: 'fas fa-tasks', desc: 'Backlog implementation stories', badge: 'Backlog' },
      { label: 'UX Wireframes', path: '/ux-wireframe', icon: 'fas fa-desktop', desc: 'Interactive prototypes', badge: 'UI' },
      { label: 'Database Design', path: '/database-design', icon: 'fas fa-database', desc: 'SQL DDL & ERD schemas', badge: 'DB' }
    ]
  },
  'QA Engineer': {
    primaryRoute: '/test-cases',
    primaryLabel: 'Enter QA Test & Compliance Workspace',
    icon: 'fas fa-vial',
    description: 'Generate Gherkin integration test suites, security scans, and AI boardroom compliance reviews.',
    recommendedSections: [
      { label: 'Test Cases & Gherkin', path: '/test-cases', icon: 'fas fa-vial', desc: 'QA test matrices & Gherkin suites', badge: 'QA' },
      { label: 'Review & Security Agent', path: '/review-agent', icon: 'fas fa-shield-alt', desc: 'Security scans & breaking change scans', badge: 'Security' },
      { label: 'AI Debate Boardroom', path: '/validator', icon: 'fas fa-balance-scale', desc: 'AI-SRB validation review', badge: 'AI-SRB' },
      { label: 'Evidence Ledger', path: '/global-traceability', icon: 'fas fa-history', desc: 'Audit log verification', badge: 'Layer 1' }
    ]
  },
  'UX Designer': {
    primaryRoute: '/ux-wireframe',
    primaryLabel: 'Enter UX Prototyping Workspace',
    icon: 'fas fa-desktop',
    description: 'Create and preview responsive HTML/Tailwind interactive wireframes connected to specifications.',
    recommendedSections: [
      { label: 'UX Wireframes', path: '/ux-wireframe', icon: 'fas fa-desktop', desc: 'Tailwind interactive prototypes', badge: 'UX' },
      { label: 'Requirement to Spec', path: '/requirement-to-spec', icon: 'fas fa-file-signature', desc: 'Spec requirements', badge: 'Spec' },
      { label: 'User Stories', path: '/user-stories', icon: 'fas fa-list-check', desc: 'UI feature backlogs', badge: 'Agile' }
    ]
  },
  'Security Reviewer': {
    primaryRoute: '/review-agent',
    primaryLabel: 'Enter Security & Governance Workspace',
    icon: 'fas fa-shield-alt',
    description: 'Run security code scans, compliance checks, and AI Boardroom governance validations.',
    recommendedSections: [
      { label: 'Review & Security Agent', path: '/review-agent', icon: 'fas fa-shield-alt', desc: 'Security scans & vulnerability checks', badge: 'Security' },
      { label: 'AI Debate Boardroom', path: '/validator', icon: 'fas fa-balance-scale', desc: 'AI-SRB Governance review', badge: 'AI-SRB' },
      { label: 'Evidence Ledger', path: '/global-traceability', icon: 'fas fa-history', desc: 'Cryptographic audit ledger', badge: 'Layer 1' }
    ]
  },
  'Auditor': {
    primaryRoute: '/global-traceability',
    primaryLabel: 'Enter Auditor Compliance Workspace',
    icon: 'fas fa-history',
    description: 'Inspect SHA-256 cryptographic audit logs, evaluation benchmarks, and authoritative spec planes.',
    recommendedSections: [
      { label: 'Evidence Ledger', path: '/global-traceability', icon: 'fas fa-history', desc: 'Cryptographic SHA-256 audit ledger', badge: 'Layer 1' },
      { label: 'Trust & Eval Harness', path: '/knowledge-fabric', icon: 'fas fa-brain', desc: 'Grounding docs & policy conformance', badge: 'Layer 3' },
      { label: 'Spec & Control Plane', path: '/spec-control', icon: 'fas fa-sitemap', desc: 'Authoritative spec registry', badge: 'Layer 4' }
    ]
  }
};

const DEFAULT_WORKSPACE = {
  primaryRoute: '/layer0',
  primaryLabel: 'Enter SDLC Workspace',
  icon: 'fas fa-cubes',
  description: 'Access specification lifecycle tools, signal intake, and multi-agent AI generation.',
  recommendedSections: [
    { label: 'Enterprise Discovery', path: '/layer0', icon: 'fas fa-lightbulb', desc: 'Pre-SDD requirement formation & signal intake', badge: 'Layer 0' },
    { label: 'Requirement to Spec', path: '/requirement-to-spec', icon: 'fas fa-file-signature', desc: 'SpeckIt package generator', badge: 'Layer 2' },
    { label: 'Spec to Story', path: '/spec-to-story', icon: 'fas fa-exchange-alt', desc: 'Agile story generator', badge: 'Agile' },
    { label: 'Tech Architecture', path: '/tech-architecture', icon: 'fas fa-sitemap', desc: 'System blueprints & tech specs', badge: 'Arch' }
  ]
};

export default function HomePage() {
  const navigate = useNavigate();
  const { projectMode, setProjectMode } = usePageContext();

  const [activeUser, setActiveUser] = useState(null);
  const [activePersona, setActivePersona] = useState('Platform Admin');

  useEffect(() => {
    userService.getUsers().then(users => {
      if (Array.isArray(users) && users.length > 0) {
        const savedUserId = localStorage.getItem('activeUserId');
        const user = users.find(u => String(u.id) === String(savedUserId)) || users[0];
        setActiveUser(user);

        let persona = user.displayRole || 'Platform Admin';
        if (user.isSuperAdmin) persona = 'Platform Admin';
        else if (user.projectAccess && user.projectAccess.length > 0 && user.projectAccess[0].personas && user.projectAccess[0].personas.length > 0) {
          persona = user.projectAccess[0].personas[0];
        }
        setActivePersona(persona);
      }
    });
  }, []);

  const currentWorkspace = ROLE_WORKSPACES[activePersona] || DEFAULT_WORKSPACE;

  const handleNavigateToSection = (path) => {
    navigate(path);
  };

  const layersList = [
    {
      id: 'layer0',
      number: 'Layer 0',
      title: 'Enterprise Discovery & Signal Intake',
      icon: 'fas fa-lightbulb',
      badge: 'Signal Intake',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      path: '/layer0',
      description: 'Continuous ingestion of raw business signals, Gmail threads, Google Meet transcripts, and executive briefs into structured pre-SDD requirements.',
      features: [
        'Automated Gmail & Google Meet Signal Parser',
        'Intelligence Tier Routing (T0 Auto to T4 Deep Analysis)',
        'Financial ROI & Business Case Matrix',
        'Pre-SDD Idea Brief & Executive Summary'
      ]
    },
    {
      id: 'layer1',
      number: 'Layer 1',
      title: 'Evidence Ledger & Immutable Audit Trail',
      icon: 'fas fa-history',
      badge: 'Audit Ledger',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      path: '/global-traceability',
      description: 'Cryptographic SHA-256 state tracking for every requirement edit, AI prompt modification, spec generation, and review validation.',
      features: [
        '100% Cryptographic Traceability',
        'Regulatory Compliance Audit Logs',
        'Prompt & Agent Decision History',
        'Immutability Verification Engine'
      ]
    },
    {
      id: 'layer2',
      number: 'Layer 2',
      title: 'Multi-Agent Specification Lifecycle',
      icon: 'fas fa-cogs',
      badge: 'AI Pipeline',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      path: '/requirement-to-spec',
      description: 'Autonomous multi-agent orchestration converting specs into Agile stories, Tailwind UX wireframes, system architectures, ERDs, and Gherkin tests.',
      features: [
        'SpeckIt Requirement-to-Spec Engine',
        'Agile Spec-to-Story & Backlog Decomposition',
        'Interactive Tailwind UX Wireframe Generator',
        'Database Schema & Gherkin QA Suite'
      ]
    },
    {
      id: 'layer3',
      number: 'Layer 3',
      title: 'Knowledge Fabric & Grounding RAG',
      icon: 'fas fa-brain',
      badge: 'RAG & Policy',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      path: '/knowledge-fabric',
      description: 'ChromaDB vector embedding store and evaluation harness enforcing enterprise policy conformance, anti-hallucination checks, and benchmark scoring.',
      features: [
        'ChromaDB Vector Store Integration',
        'Grounding Document Ingestion & Chunking',
        'Trust & Reliability Benchmark Eval Harness',
        'Policy Conformance Enforcement'
      ]
    },
    {
      id: 'layer4',
      number: 'Layer 4',
      title: 'Spec & Graph Control Plane',
      icon: 'fas fa-sitemap',
      badge: 'Control Plane',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      path: '/spec-control',
      description: 'Authoritative baseline specification registry and AST code dependency graph for managing breaking changes and delta impact analysis.',
      features: [
        'Authoritative Active Spec Baseline Management',
        'AST Dependency Graph Mapping',
        'Code-to-Spec Reverse Engineering (Brownfield)',
        'AST Impact Analysis & Breaking Change Scan'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#17181C] p-4 sm:p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* ========================================== */}
      {/* 1. HERO BANNER & ROLE WORKSPACE LAUNCHPAD  */}
      {/* ========================================== */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#311B92] text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              TCS ValueThread Specification Framework
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              AI-Native Software <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                Specification & Governance
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Transform business signals, raw requirements, and legacy codebases into structured, audit-proof specs and Agile user stories.
            </p>

            {/* DYNAMIC ROLE WORKSPACE LAUNCHER BOX */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-300/40 text-purple-200 flex items-center justify-center text-lg shrink-0">
                    <i className={currentWorkspace.icon}></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">
                      Role: <span className="text-cyan-300">{activePersona}</span>
                    </h2>
                  </div>
                </div>

                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Ready to Launch
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-snug">
                {currentWorkspace.description}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleNavigateToSection(currentWorkspace.primaryRoute)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-900/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fas fa-right-to-bracket text-amber-300"></i>
                  <span>{currentWorkspace.primaryLabel}</span>
                  <i className="fas fa-arrow-right text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Banner */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative group w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative bg-slate-900/90 rounded-2xl border border-slate-700/80 p-5 backdrop-blur-xl shadow-2xl space-y-4">
                <img
                  src="/branding/tcs-valuethread-dark-banner.png"
                  alt="TCS ValueThread Banner"
                  className="w-full h-auto object-contain rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/branding/tcs-valuethread-full-logo-tagline.png";
                  }}
                />

                <div className="space-y-2 border-t border-slate-800 pt-3 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Operational Mode:</span>
                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                      <button
                        onClick={() => setProjectMode('greenfield')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                          projectMode === 'greenfield' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Greenfield
                      </button>
                      <button
                        onClick={() => setProjectMode('brownfield')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                          projectMode === 'brownfield' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Brownfield
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Active API Server:</span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Port 7001
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. RECOMMENDED WORKSPACE SECTIONS FOR ROLE */}
      {/* ========================================== */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#ECEEF1] shadow-xs space-y-6">
        <div className="border-b border-[#ECEEF1] pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5F46D8] uppercase tracking-wider mb-1">
            <i className="fas fa-th-large"></i> Workstation Shortcuts
          </div>
          <h2 className="text-xl font-extrabold text-[#17181C]">
            Recommended Sections for <span className="text-[#5F46D8]">{activePersona}</span>
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Select any section to launch its tool.
          </p>
        </div>

        {/* Recommended Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentWorkspace.recommendedSections.map((sec, idx) => (
            <div
              key={idx}
              onClick={() => handleNavigateToSection(sec.path)}
              className="group p-5 rounded-xl border border-[#ECEEF1] bg-[#FAFAF9] hover:bg-white hover:border-[#5F46D8] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#5F46D8] flex items-center justify-center text-sm font-bold border border-purple-100 group-hover:bg-[#5F46D8] group-hover:text-white transition-colors">
                    <i className={sec.icon}></i>
                  </div>
                  {sec.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#5F46D8] border border-[#E4DCFF]">
                      {sec.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#17181C] group-hover:text-[#5F46D8] transition-colors">
                    {sec.label}
                  </h3>
                  <p className="text-xs text-[#667085] mt-1 leading-relaxed">{sec.desc}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#ECEEF1] flex items-center justify-between text-xs font-bold text-[#5F46D8] opacity-90 group-hover:opacity-100">
                <span>Open Section</span>
                <i className="fas fa-arrow-right text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. THE 5-LAYER ARCHITECTURE STACK          */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#5F46D8] text-xs font-bold border border-[#E4DCFF]">
            <i className="fas fa-layer-group"></i> Architectural Foundation
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17181C]">The 5-Layer TCS ValueThread Engine</h2>
          <p className="text-sm text-[#667085]">
            Built with end-to-end auditability, policy compliance, vector-grounded RAG, and AST control planes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layersList.map((layer) => (
            <div
              key={layer.id}
              className="bg-white rounded-2xl p-6 border border-[#ECEEF1] shadow-xs hover:shadow-lg hover:border-[#5F46D8]/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5F46D8] flex items-center justify-center text-lg shadow-2xs border border-purple-100">
                    <i className={layer.icon}></i>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${layer.badgeColor}`}>
                    {layer.number} • {layer.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#17181C] mb-1.5">{layer.title}</h3>
                  <p className="text-xs text-[#667085] leading-relaxed">{layer.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#ECEEF1]">
                  <span className="text-[11px] font-semibold text-[#344054] uppercase tracking-wider block">Key Capabilities:</span>
                  <ul className="space-y-1.5">
                    {layer.features.map((feat, i) => (
                      <li key={i} className="text-xs text-[#475467] flex items-start gap-2">
                        <i className="fas fa-check text-emerald-500 text-[10px] mt-0.5 shrink-0"></i>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => handleNavigateToSection(layer.path)}
                className="mt-6 w-full py-2.5 rounded-xl bg-[#F8F8F7] hover:bg-[#F0EBFF] text-[#344054] hover:text-[#5F46D8] border border-[#ECEEF1] hover:border-[#E4DCFF] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore {layer.number}</span>
                <i className="fas fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          ))}

          {/* Quick Spec Controls & Telemetry Overview Card */}
          <div className="bg-gradient-to-br from-[#1E1B4B] to-[#4C1D95] rounded-2xl p-6 text-white shadow-xl border border-purple-900 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <img
                  src="/branding/tcs-valuethread-symbol-only.png"
                  alt="TCS Emblem"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/branding/tcs-valuethread-mark-256.png";
                  }}
                />
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-cyan-300 border border-white/20">
                  Telemetry & Controls
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1.5">AI Telemetry & Model Tiering</h3>
                <p className="text-xs text-purple-200 leading-relaxed">
                  Real-time monitoring of LLM token consumption, cost optimization, and intelligent model tiering (T0 auto to T4 deep models).
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-purple-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300">Active API Port:</span>
                  <span className="font-mono text-emerald-400 font-bold">7001 (Node Express)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300">Vector Store:</span>
                  <span className="font-mono text-cyan-300 font-bold">ChromaDB / Local JSON</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300">Database Engine:</span>
                  <span className="font-mono text-indigo-300 font-bold">Better-SQLite3</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleNavigateToSection('/admin/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fas fa-user-shield text-purple-300"></i>
              Open Governance Admin Panel
            </button>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. RICH FRAMEWORK FOOTER                   */}
      {/* ========================================== */}
      <footer className="mt-12 rounded-3xl bg-[#0F172A] text-white p-8 sm:p-12 border border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
          {/* Logo & Info */}
          <div className="md:col-span-4 space-y-4">
            <img
              src="/branding/tcs-valuethread-full-logo-tagline.png"
              alt="TCS ValueThread"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/branding/tcs-valuethread-header-logo.png";
              }}
            />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              TCS ValueThread (FrugalForge SDD) is an autonomous software specification, reverse-engineering, and multi-agent governance platform.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Port 7001 Active
              </span>
              <span>•</span>
              <span>v2.4 Enterprise</span>
            </div>
          </div>

          {/* Links Column 1: Core Layers */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Architecture Layers</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => handleNavigateToSection('/layer0')} className="hover:text-white transition-colors cursor-pointer">
                  Layer 0: Enterprise Discovery
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/global-traceability')} className="hover:text-white transition-colors cursor-pointer">
                  Layer 1: Evidence Ledger
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/requirement-to-spec')} className="hover:text-white transition-colors cursor-pointer">
                  Layer 2: Multi-Agent Engines
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/knowledge-fabric')} className="hover:text-white transition-colors cursor-pointer">
                  Layer 3: Knowledge Fabric (RAG)
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/spec-control')} className="hover:text-white transition-colors cursor-pointer">
                  Layer 4: Spec & Graph Control Plane
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Specification Agents */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Specification Engines</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => handleNavigateToSection('/requirement-to-spec')} className="hover:text-white transition-colors cursor-pointer">
                  Requirement to Spec
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/spec-to-story')} className="hover:text-white transition-colors cursor-pointer">
                  Spec to User Stories
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/ux-wireframe')} className="hover:text-white transition-colors cursor-pointer">
                  UX Wireframe Generator
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/tech-architecture')} className="hover:text-white transition-colors cursor-pointer">
                  Technical Architecture
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/database-design')} className="hover:text-white transition-colors cursor-pointer">
                  Database & ERD Design
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/code-to-spec')} className="hover:text-white transition-colors cursor-pointer">
                  Code-to-Spec (Brownfield)
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Governance & Admin */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Governance</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => handleNavigateToSection('/validator')} className="hover:text-white transition-colors cursor-pointer">
                  AI Debate Boardroom
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/admin/dashboard')} className="hover:text-white transition-colors cursor-pointer">
                  Admin Control Plane
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/eval-harness')} className="hover:text-white transition-colors cursor-pointer">
                  Trust & Eval Harness
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToSection('/agent-registry')} className="hover:text-white transition-colors cursor-pointer">
                  Agent Registry
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/branding/tcs-valuethread-mark-128.png"
              alt="TCS Mark"
              className="h-6 w-auto object-contain opacity-70"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>© 2026 Tata Consultancy Services (TCS). TCS ValueThread Specification Framework.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-slate-400 cursor-pointer">Privacy & Security</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">SpeckIt Specification License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
