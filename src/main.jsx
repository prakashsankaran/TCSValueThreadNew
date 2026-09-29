import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { PageProvider, usePageContext } from './context/PageContext';

import RequirementToSpec from './pages/RequirementToSpec';
import SpecToStory from './pages/SpecToStory';
import UserStories from './pages/UserStories';
import FunctionalSpec from './pages/FunctionalSpec';
import TechArchitecture from './pages/TechArchitecture';
import DatabaseDesign from './pages/DatabaseDesign';
import UXWireframe from './pages/UXWireframe';
import TestCases from './pages/TestCases';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import ReviewAgent from './pages/ReviewAgent';
import Repository from './pages/Repository';
import RequirementAgent from './pages/RequirementAgent';
import ValidatorAgent from './pages/ValidatorAgent';
import AgentOrchestrator from './pages/AgentOrchestrator';
import BrownfieldContextView from './pages/BrownfieldContextView';
import CodeToSpecView from './pages/CodeToSpecView';
import ImpactAnalysisView from './pages/ImpactAnalysisView';
import TraceabilityLogView from './pages/TraceabilityLogView';
import AgentRegistryView from './pages/AgentRegistryView';
import EvalHarnessView from './pages/EvalHarnessView';
import SpecControlView from './pages/SpecControlView';
import KnowledgeFabricView from './pages/KnowledgeFabricView';
import Layer0IdeaDiscovery from './pages/Layer0IdeaDiscovery';
import HomePage from './pages/HomePage';
import WipPlaceholder from './components/WipPlaceholder';
import ChatbotWidget from './components/ChatbotWidget';
import { AiOrchestratorModal } from './components/AiOrchestratorModal';

import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminModels from './pages/admin/AdminModels';
import AdminPersonas from './pages/admin/AdminPersonas';
import AdminAgents from './pages/admin/AdminAgents';
import AdminAgentMapping from './pages/admin/AdminAgentMapping';
import AdminWorkflows from './pages/admin/AdminWorkflows';
import AdminProjects from './pages/admin/AdminProjects';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDebateCircles from './pages/admin/AdminDebateCircles';
import AdminVectorDb from './pages/admin/AdminVectorDb';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { agentMappingService } from './services/agentMappingService';
import { Outlet } from 'react-router-dom';

import HeaderTokenBadge from './components/HeaderTokenBadge';
import TokenTrackerWidget from './components/TokenTrackerWidget';
import TokenThresholdAlert from './components/TokenThresholdAlert';
import WorkflowStatusTracker from './components/WorkflowStatusTracker';
import MissingDependencyView from './components/MissingDependencyView';

import './index.css';

const greenfieldNavigationItems = [
  { path: '/', label: 'Framework Home', icon: 'fas fa-home', desc: 'Overview, architecture & launchpad', badge: 'Home' },
  { path: '/layer0', label: 'Enterprise Discovery', icon: 'fas fa-lightbulb', desc: 'Pre-SDD requirement formation & signal intake' },
  { path: '/requirement-to-spec', label: 'Requirement to Spec', icon: 'fas fa-file-signature', desc: 'SpeckIt package generator' },
  { path: '/spec-to-story', label: 'Spec to Story', icon: 'fas fa-exchange-alt', desc: 'Agile story generator' },
  { path: '/functional-spec', label: 'Functional Spec', icon: 'fas fa-file-invoice', desc: 'FSD compilation' },
  { path: '/user-stories', label: 'User Stories', icon: 'fas fa-clipboard-list', desc: 'Backlog decomposition' },
  { path: '/ux-wireframe', label: 'UX Wireframe', icon: 'fas fa-desktop', desc: 'Tailwind prototypes' },
  { path: '/tech-architecture', label: 'Tech Architecture', icon: 'fas fa-sitemap', desc: 'Blueprints & stack spec' },
  { path: '/database-design', label: 'Database Design', icon: 'fas fa-database', desc: 'ERD & DDL creations' },
  { path: '/test-cases', label: 'Test Cases', icon: 'fas fa-tasks', desc: 'QA & Gherkin suites' },
  { path: '/review-agent', label: 'Review Agent', icon: 'fas fa-shield-alt', desc: 'Compliance & code scans' },
  { path: '/global-traceability', label: 'Evidence Ledger', icon: 'fas fa-history', desc: 'Audit Ledger Layer 1', badge: 'Layer 1' },
  { path: '/knowledge-fabric', label: 'Trust, Eval & Quality', icon: 'fas fa-brain', desc: 'Grounding docs & policy conformance', badge: 'Layer 3' },
  { path: '/spec-control', label: 'Spec & Artifact Ctrl', icon: 'fas fa-sitemap', desc: 'Authoritative spec & graph plane', badge: 'Layer 4' },
  { path: '/validator', label: 'Live Debate Boardroom', icon: 'fas fa-balance-scale', desc: 'AI-SRB Validation' }
];

const brownfieldNavigationItems = [
  { path: '/', label: 'Framework Home', icon: 'fas fa-home', desc: 'Overview, architecture & launchpad', badge: 'Home' },
  { path: '/layer0', label: 'Enterprise Discovery', icon: 'fas fa-lightbulb', desc: 'Pre-SDD requirement formation & signal intake' },
  { path: '/brownfield-context', label: '1. Project Context', icon: 'fas fa-folder-plus', desc: 'Code, DDL & legacy docs', badge: 'Context' },
  { path: '/code-to-spec', label: 'Code to Spec', icon: 'fas fa-microchip', desc: 'Reverse-engineer v1 baseline', badge: 'Baseline' },
  { path: '/impact-analysis', label: 'Impact & Gap Specs', icon: 'fas fa-search-minus', desc: 'System impact analysis', badge: 'Impact' },
  { path: '/functional-spec', label: 'Functional Spec (Delta)', icon: 'fas fa-file-invoice', desc: 'Modified FSD & API specs', badge: 'WIP', wip: true },
  { path: '/user-stories', label: 'Delta Stories', icon: 'fas fa-tasks', desc: 'Refactoring & new backlog', badge: 'WIP', wip: true },
  { path: '/ux-wireframe', label: 'UX Wireframe (Delta)', icon: 'fas fa-desktop', desc: 'Integrated UI prototypes', badge: 'WIP', wip: true },
  { path: '/tech-architecture', label: 'Tech Arch & Migration', icon: 'fas fa-sitemap', desc: 'Blueprints & legacy rules', badge: 'WIP', wip: true },
  { path: '/database-design', label: 'DB Migration & DDL', icon: 'fas fa-database', desc: 'ALTER TABLE & backfills', badge: 'WIP', wip: true },
  { path: '/test-cases', label: 'Regression Suite', icon: 'fas fa-vial', desc: 'Integration & QA matrix', badge: 'WIP', wip: true },
  { path: '/review-agent', label: 'Review & Security', icon: 'fas fa-shield-alt', desc: 'Breaking change scans', badge: 'WIP', wip: true },
  { path: '/global-traceability', label: 'Evidence Ledger', icon: 'fas fa-history', desc: 'Audit Ledger Layer 1', badge: 'Layer 1' },
  { path: '/knowledge-fabric', label: 'Trust, Eval & Quality', icon: 'fas fa-brain', desc: 'Grounding docs & policy conformance', badge: 'Layer 3' },
  { path: '/spec-control', label: 'Spec & Artifact Ctrl', icon: 'fas fa-sitemap', desc: 'Authoritative spec & graph plane', badge: 'Layer 4' },
  { path: '/validator', label: 'Live Debate Boardroom', icon: 'fas fa-balance-scale', desc: 'AI-SRB Validation' }
];

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectMode, setProjectMode, pages } = usePageContext();

  const [users, setUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [dbMappings, setDbMappings] = useState([]);

  useEffect(() => {
    userService.getUsers().then(data => {
      if (Array.isArray(data)) setUsers(data);
    });
    projectService.getProjects().then(projs => {
      if (Array.isArray(projs)) setAllProjects(projs);
    });
  }, []);

  useEffect(() => {
    agentMappingService.getAgentMappings().then(data => {
      if (Array.isArray(data)) setDbMappings(data);
    });
  }, []);
  
  const activeUserId = localStorage.getItem('activeUserId');
  const activeUser = users.find(u => String(u.id) === String(activeUserId)) || users[0];
  
  const userProjects = React.useMemo(() => {
    if (!allProjects || allProjects.length === 0) return [];

    const validProjectNames = new Set(allProjects.map(p => p.name || p.id || p.projectId));
    const projectMap = new Map();

    // 1. Explicit user project access
    if (activeUser && Array.isArray(activeUser.projectAccess)) {
      activeUser.projectAccess.forEach(p => {
        if (p && p.projectId) {
          if (validProjectNames.has(p.projectId)) {
            projectMap.set(p.projectId, { projectId: p.projectId, personas: p.personas || ['Platform Admin'] });
          }
          if (p.projectId === 'sdd-enterprise-dev') {
            projectMap.set('Vendor Management', { projectId: 'Vendor Management', personas: p.personas || ['Platform Admin'] });
          }
        }
      });
    }

    // 2. Persona agent mappings projects
    if (Array.isArray(dbMappings)) {
      dbMappings.forEach(m => {
        if (m && m.projectId) {
          if (validProjectNames.has(m.projectId)) {
            if (!projectMap.has(m.projectId)) {
              projectMap.set(m.projectId, { projectId: m.projectId, personas: [m.personaName || 'Platform Admin'] });
            }
          }
          if (m.projectId === 'sdd-enterprise-dev') {
            if (!projectMap.has('Vendor Management')) {
              projectMap.set('Vendor Management', { projectId: 'Vendor Management', personas: [m.personaName || 'Platform Admin'] });
            }
          }
        }
      });
    }

    // 3. All system projects registered in DB
    allProjects.forEach(p => {
      const pname = p.name || p.id || p.projectId;
      if (pname && validProjectNames.has(pname) && !projectMap.has(pname)) {
        projectMap.set(pname, { projectId: pname, personas: ['Platform Admin'] });
      }
    });

    return Array.from(projectMap.values());
  }, [activeUser, dbMappings, allProjects]);

  const [activeProject, setActiveProject] = useState(() => {
    const saved = localStorage.getItem('activeProject');
    if (saved === 'sdd-enterprise-dev' || saved === 'mobile-app-v2' || saved === 'legacy-migration') {
      return 'Vendor Management';
    }
    return saved || 'Vendor Management';
  });

  useEffect(() => {
    if (userProjects.length > 0 && (!activeProject || !userProjects.some(p => p.projectId === activeProject))) {
      setActiveProject(userProjects[0].projectId);
    }
  }, [userProjects]);

  const activeUserAccess = userProjects.find(p => p.projectId === activeProject);
  const activePersona = activeUserAccess && activeUserAccess.personas.length > 0 
    ? activeUserAccess.personas[0] 
    : (activeUser?.isSuperAdmin ? 'Platform Admin' : 'Platform Admin');

  useEffect(() => {
    localStorage.setItem('activeProject', activeProject);
  }, [activeProject]);
  
  const baseNavigationItems = projectMode === 'brownfield' ? brownfieldNavigationItems : greenfieldNavigationItems;
  
  const isAdminPersona = activePersona === 'Admin' || activePersona === 'Super Admin' || activePersona === 'Platform Admin' || activePersona === 'Project Admin' || activeUser?.isSuperAdmin;

  const projectAdminPaths = [
    '/layer0',
    '/requirement-to-spec', '/code-to-spec',
    '/spec-to-story',
    '/functional-spec',
    '/user-stories',
    '/ux-wireframe',
    '/tech-architecture',
    '/database-design',
    '/test-cases',
    '/traceability-matrix',
    '/global-traceability',
    '/knowledge-fabric',
    '/eval-harness',
    '/spec-control'
  ];

  const productOwnerPaths = [
    '/layer0',
    '/requirement-to-spec', '/code-to-spec',
    '/spec-to-story',
    '/functional-spec',
    '/user-stories',
    '/global-traceability',
    '/knowledge-fabric',
    '/eval-harness',
    '/spec-control'
  ];

  let activeNavigationItems = [];
  if (activePersona === 'Project Admin') {
    activeNavigationItems = baseNavigationItems.filter(item => projectAdminPaths.includes(item.path));
    if (!activeNavigationItems.some(item => item.path === '/global-traceability')) {
      activeNavigationItems.push({
        path: '/global-traceability',
        label: 'Evidence Ledger',
        icon: 'fas fa-history',
        desc: 'Audit Ledger Layer 1',
        badge: 'Layer 1'
      });
    }
  } else if (activePersona === 'Product Owner') {
    activeNavigationItems = baseNavigationItems.filter(item => productOwnerPaths.includes(item.path));
    if (!activeNavigationItems.some(item => item.path === '/global-traceability')) {
      activeNavigationItems.push({
        path: '/global-traceability',
        label: 'Evidence Ledger',
        icon: 'fas fa-history',
        desc: 'Audit Ledger Layer 1',
        badge: 'Layer 1'
      });
    }
  } else {
    // Platform Admin / Admin gets ALL 15 enabled primary agents
    if (isAdminPersona) {
      activeNavigationItems = baseNavigationItems;
    } else {
      // Non-admin personas get ONLY agents mapped to their persona in SQLite agent_mappings!
      const assignedAgentNames = dbMappings
        .filter(m => m.personaName === activePersona && m.projectId === activeProject)
        .map(m => m.agentName);

      const fallbackAgentNames = assignedAgentNames.length > 0 
        ? assignedAgentNames 
        : dbMappings.filter(m => m.personaName === activePersona).map(m => m.agentName);

      if (fallbackAgentNames.length > 0) {
        activeNavigationItems = baseNavigationItems.filter(item => fallbackAgentNames.includes(item.label));
      } else {
        activeNavigationItems = [];
      }
    }

    // Enterprise Discovery (/layer0) is strictly restricted to Project Admin and Product Owner Personas
    const isLayer0Persona = activePersona === 'Project Admin' || activePersona === 'Product Owner';

    if (!isLayer0Persona) {
      activeNavigationItems = activeNavigationItems.filter(item => item.path !== '/layer0');
    } else {
      const layer0Item = baseNavigationItems.find(item => item.path === '/layer0');
      if (layer0Item) {
        activeNavigationItems = [
          layer0Item,
          ...activeNavigationItems.filter(item => item.path !== '/layer0')
        ];
      }
    }

    if (activePersona === 'Project Admin') {
      if (!activeNavigationItems.find(item => item.path === '/global-traceability')) {
        activeNavigationItems.push({
          path: '/global-traceability',
          label: 'Evidence Ledger',
          icon: 'fas fa-history',
          desc: 'Document generation logs',
          badge: 'Global'
        });
      }
    } else {
      activeNavigationItems = activeNavigationItems.filter(item => 
        item.path !== '/global-traceability' &&
        item.path !== '/vector-db'
      );
    }

    // Ensure Spec & Artifact Registry (/spec-control) is available in ALL persona views (including Project Admin)
    if (!activeNavigationItems.find(item => item.path === '/spec-control')) {
      const specControlItem = baseNavigationItems.find(item => item.path === '/spec-control') || {
        path: '/spec-control',
        label: 'Spec & Artifact Registry',
        icon: 'fas fa-sitemap',
        desc: 'Authoritative spec & graph plane',
        badge: 'Registry'
      };
      activeNavigationItems.push(specControlItem);
    }

    if (!activeNavigationItems.find(item => item.path === '/knowledge-fabric')) {
      activeNavigationItems.push({
        path: '/knowledge-fabric',
        label: 'Trust, Eval & Quality',
        icon: 'fas fa-brain',
        desc: 'Grounding docs & policy conformance',
        badge: 'Layer 3'
      });
    }
  }

  // Always include Framework Home ('/') at the start of activeNavigationItems for ALL personas
  const homeItem = baseNavigationItems.find(item => item.path === '/') || {
    path: '/',
    label: 'Framework Home',
    icon: 'fas fa-home',
    desc: 'Overview, architecture & launchpad',
    badge: 'Home'
  };
  if (!activeNavigationItems.some(item => item.path === '/')) {
    activeNavigationItems.unshift(homeItem);
  }

  const DEFAULT_SPECS = [
    { name: '001-return-request-tracker' },
    { name: '002-multi-factor-authentication' },
    { name: '003-confluence-exporter' },
    { name: '004-mermaid-diagram-renderer' },
    { name: '005-browser-wireframe-sandbox' }
  ];

  const [specs, setSpecs] = useState(() => {
    const savedSpecs = localStorage.getItem('sdd_specs');
    if (savedSpecs) {
      try {
        const parsed = JSON.parse(savedSpecs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_SPECS;
  });

  const [activeSpec, setActiveSpec] = useState(() => {
    return localStorage.getItem('activeSpec') || '001-return-request-tracker';
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isAiOrchestratorModalOpen, setIsAiOrchestratorModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    if (location.pathname === '/') {
      if (activeNavigationItems.length > 0) {
        navigate(activeNavigationItems[0].path, { replace: true });
      } else {
        navigate('/requirements', { replace: true });
      }
    }
  }, [location.pathname]);

  const handleModeToggle = (mode) => {
    setProjectMode(mode);
    if (mode === 'brownfield') {
      if (location.pathname !== '/brownfield-context') {
        navigate('/brownfield-context');
      }
    } else if (mode === 'greenfield') {
      if (location.pathname === '/brownfield-context') {
        navigate('/spec-to-story');
      }
    }
  };

  useEffect(() => {
    const handleSpecSync = (e) => {
      const newSpec = e?.detail?.specName || localStorage.getItem('activeSpec');
      if (newSpec) {
        setActiveSpec(newSpec);
      }
      const savedSpecsRaw = localStorage.getItem('sdd_specs');
      if (savedSpecsRaw) {
        try {
          const parsed = JSON.parse(savedSpecsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) setSpecs(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('activeSpecChanged', handleSpecSync);
    window.addEventListener('storage', handleSpecSync);

    fetch('http://localhost:7001/api/specs/active')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.activeSpec) {
          setActiveSpec(data.activeSpec);
          localStorage.setItem('activeSpec', data.activeSpec);
        }
      })
      .catch(() => {});

    fetch('http://localhost:7001/api/specs/list')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.specs) && data.specs.length > 0) {
          setSpecs(data.specs);
          localStorage.setItem('sdd_specs', JSON.stringify(data.specs));
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('activeSpecChanged', handleSpecSync);
      window.removeEventListener('storage', handleSpecSync);
    };
  }, []);

  const handleSpecChange = async (newSpec) => {
    setActiveSpec(newSpec);
    localStorage.setItem('activeSpec', newSpec);
    try {
      await fetch('http://localhost:7001/api/specs/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSpec: newSpec })
      });
      localStorage.removeItem('orchestrator_thread_id');
    } catch (err) {
      console.log('Spec change stored locally.');
    }
  };

  const getMissingDependencies = () => {
    if (isAdminPersona) return null;
    
    const isAgentRoute = greenfieldNavigationItems.some(i => i.path === location.pathname) || 
                         brownfieldNavigationItems.some(i => i.path === location.pathname);
    if (!isAgentRoute) return null;

    const currentAgentId = location.pathname.substring(1);

    try {
      const saved = localStorage.getItem('sdd_project_workflows');
      if (!saved) return null;
      
      const mappings = JSON.parse(saved);
      const workflowData = mappings[activeProject];
      if (!workflowData || !workflowData.nodes) return null;

      const { nodes, edges } = workflowData;
      
      const targetNode = nodes.find(n => n.data.id === currentAgentId);
      if (!targetNode) return null;

      const incomingEdges = edges.filter(e => e.target === targetNode.id);
      
      const missing = [];
      incomingEdges.forEach(edge => {
         const sourceNode = nodes.find(n => n.id === edge.source);
         if (sourceNode) {
           const sourceAgentId = sourceNode.data.id;
           const isSourceGenerated = pages[sourceAgentId] && pages[sourceAgentId].output !== null;
           
           if (!isSourceGenerated) {
             const artifactName = edge.sourceHandle ? edge.sourceHandle.replace('out-', '') : 'Data';
             missing.push({
               sourceAgent: sourceNode.data.label,
               artifact: artifactName
             });
           }
         }
      });
      
      if (missing.length > 0) return missing;
    } catch (e) {
      console.error(e);
    }
    
    return null;
  };

  const missingDependencies = getMissingDependencies();

  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAFAF9] text-[#17181C]">
      {/* 1. TOP STICKY NAVBAR (SignalForge Style with TCS ValueThread Branding) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ECEEF1] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between select-none shrink-0 shadow-2xs">
        {/* Left: Official TCS ValueThread Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => navigate('/')}
          title="TCS ValueThread Home"
        >
          <img
            src="/branding/tcs-valuethread-header-logo.png"
            alt="TCS ValueThread"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/branding/tcs-valuethread-full-logo-tagline.png";
            }}
          />
        </div>

        {/* Right: Project Selector, Active Spec Status, AI Router & Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAdminPersona && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                location.pathname.startsWith('/admin')
                  ? 'text-purple-900 bg-purple-100 font-bold border border-purple-200 shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 border border-[#E4DCFF]'
              }`}
              title="Admin Control Center"
            >
              <i className="fas fa-user-shield text-xs text-purple-600"></i>
              <span className="hidden sm:inline">Admin Plane</span>
            </button>
          )}
          {/* Project Selector Dropdown */}
          <div className="hidden sm:flex relative items-center">
            <select 
              value={activeProject}
              onChange={(e) => {
                const newProj = e.target.value;
                setActiveProject(newProj);
                localStorage.setItem('activeProject', newProj);
                window.dispatchEvent(new CustomEvent('activeProjectChanged', { detail: { projectId: newProj } }));
              }}
              className="bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#D0D5DD] rounded-[10px] pl-3 pr-7 py-1.5 text-xs text-[#344054] font-semibold transition-colors focus:outline-none cursor-pointer appearance-none shadow-2xs"
            >
              {userProjects.map(up => (
                <option key={up.projectId} value={up.projectId}>{up.projectId}</option>
              ))}
              {userProjects.length === 0 && <option value="">Vendor Management</option>}
            </select>
            <i className="fas fa-chevron-down absolute right-2.5 text-[9px] text-[#98A2B3] pointer-events-none"></i>
          </div>

          {/* Active Spec Envelope Badge */}
          {activeSpec ? (
            <div 
              onClick={() => navigate('/spec-control')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F1FF] border border-[#E4DCFF] rounded-[10px] text-xs font-semibold text-[#5F46D8] cursor-pointer hover:bg-[#ECE6FF] transition"
              title={`Active Spec Baseline: ${activeSpec}`}
            >
              <i className="fas fa-layer-group text-[11px]"></i>
              <span className="max-w-[110px] truncate">{activeSpec}</span>
            </div>
          ) : null}

          {/* Active Persona Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] text-xs font-semibold text-[#344054]">
            <i className="fas fa-user-circle text-[#7157F5]"></i>
            <span className="hidden md:inline text-[#667085]">Role:</span>
            <span className="text-[#17181C]">{activePersona}</span>
          </div>

          {/* AI Orchestrator Shortcut Button */}
          <button
            onClick={() => setIsAiOrchestratorModalOpen(true)}
            className="px-3 py-1.5 rounded-[10px] bg-gradient-to-r from-[#7157F5] to-[#5F46D8] hover:from-[#5F46D8] hover:to-[#4C35C2] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Open Autonomous AI Multi-Agent Orchestrator"
          >
            <i className="fas fa-wand-magic-sparkles text-amber-300 text-xs"></i>
            <span className="hidden sm:inline">AI Router</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => {
              localStorage.removeItem('activeUserId');
              navigate('/login');
            }}
            className="p-1.5 rounded-[8px] text-[#667085] hover:text-red-600 hover:bg-red-50 border border-[#ECEEF1] hover:border-red-200 transition cursor-pointer"
            title="Sign Out of ValueThread"
          >
            <i className="fas fa-sign-out-alt text-xs"></i>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT: COLLAPSIBLE SDLC SIDEBAR + MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sleek Light SDLC Sidebar - Hidden when on Home Page */}
        {!isHomePage && (
          <aside 
            className={`${
              isSidebarCollapsed ? 'w-16' : 'w-64'
            } border-r border-[#ECEEF1] bg-white flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-20`}
          >
            <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3 space-y-3">
              {/* Mode Selector (Greenfield / Brownfield) */}
              {!isSidebarCollapsed ? (
                <div className="bg-[#F8F8F7] p-1 rounded-[12px] border border-[#ECEEF1] flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleModeToggle('greenfield')}
                    className={`flex-1 py-1.5 px-2 rounded-[8px] text-[11px] font-bold transition cursor-pointer text-center ${
                      projectMode === 'greenfield'
                        ? 'bg-white text-[#17181C] shadow-2xs border border-[#ECEEF1]'
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    Greenfield
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeToggle('brownfield')}
                    className={`flex-1 py-1.5 px-2 rounded-[8px] text-[11px] font-bold transition cursor-pointer text-center ${
                      projectMode === 'brownfield'
                        ? 'bg-white text-[#17181C] shadow-2xs border border-[#ECEEF1]'
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    Brownfield
                  </button>
                </div>
              ) : (
                <div className="flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => handleModeToggle(projectMode === 'greenfield' ? 'brownfield' : 'greenfield')}
                    className="text-[10px] font-bold text-[#7157F5] bg-[#F4F1FF] px-1.5 py-0.5 rounded-[6px] cursor-pointer hover:bg-[#ECE6FF] transition"
                    title="Toggle Greenfield / Brownfield"
                  >
                    {projectMode === 'greenfield' ? 'GF' : 'BF'}
                  </button>
                </div>
              )}

              {/* SDLC Agents Navigation List */}
              <nav className="space-y-1">
                {activeNavigationItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isWip = projectMode === 'brownfield' && item.wip;

                  if (isWip) {
                    return (
                      <div
                        key={item.path}
                        title={isSidebarCollapsed ? `${item.label} (Work In Progress)` : 'Work In Progress'}
                        className={`flex items-center rounded-[10px] border border-transparent opacity-40 cursor-not-allowed select-none ${
                          isSidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 bg-[#F8F8F7] text-[#98A2B3] border border-[#ECEEF1]">
                          <i className={`${item.icon} text-[11px]`}></i>
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="truncate flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs truncate text-[#98A2B3]">{item.label}</p>
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded border border-[#ECEEF1] bg-[#F8F8F7] text-[#98A2B3] font-mono">
                                WIP
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`flex items-center rounded-[10px] transition-all duration-150 ${
                        isSidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
                      } ${
                        isActive
                          ? 'bg-[#F4F1FF] text-[#17181C] font-bold border border-[#E4DCFF] shadow-2xs'
                          : 'text-[#667085] hover:text-[#17181C] hover:bg-[#F8F8F7] border border-transparent'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-[#7157F5] text-white' 
                          : 'bg-[#F8F8F7] text-[#98A2B3] group-hover:text-[#17181C]'
                      }`}>
                        <i className={`${item.icon} text-[11px]`}></i>
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="truncate flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs truncate">{item.label}</p>
                            {item.badge && (
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ml-1 shrink-0 ${
                                isActive 
                                  ? 'bg-white text-[#5F46D8] border-[#E4DCFF]'
                                  : 'bg-[#F8F8F7] text-[#667085] border-[#ECEEF1]'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-[#98A2B3] truncate">{item.desc}</p>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer: Spec Selector & Collapse Toggle */}
            <div className="p-3 border-t border-[#ECEEF1] bg-[#F8F8F7] space-y-2">
              {!isSidebarCollapsed ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#667085] font-semibold">Active Spec:</span>
                    <select
                      value={activeSpec}
                      onChange={(e) => handleSpecChange(e.target.value)}
                      className="bg-white border border-[#ECEEF1] rounded-[6px] text-[10px] text-[#17181C] font-semibold px-1.5 py-0.5 max-w-[125px] truncate focus:outline-none cursor-pointer"
                    >
                      {specs.map(s => {
                        const sName = typeof s === 'string' ? s : s.name;
                        return <option key={sName} value={sName}>{sName}</option>;
                      })}
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#667085] font-semibold">API Server:</span>
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> 7001
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center" title={`API Server: 7001 | Spec: ${activeSpec}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              )}

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full py-1.5 rounded-[8px] bg-white border border-[#ECEEF1] hover:bg-[#F8F8F7] text-[#667085] hover:text-[#17181C] text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <i className={`fas ${isSidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-[10px]`}></i>
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAF9] relative overflow-hidden">
          {!isHomePage && !isAdminPersona && (
            <WorkflowStatusTracker activeProject={activeProject} />
          )}

          <div className={`flex-1 overflow-y-auto custom-scroll ${isHomePage ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
            {isHomePage ? (
              children
            ) : activeNavigationItems.length <= 1 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#667085]">
                <i className="fas fa-robot text-5xl mb-4 text-[#98A2B3]"></i>
                <h2 className="text-xl font-bold text-[#17181C]">No Agents Mapped</h2>
                <p className="text-sm mt-2 max-w-md text-center text-[#667085]">
                  Your assigned persona (<span className="text-[#7157F5] font-semibold">{activePersona}</span>) for project <span className="text-[#7157F5] font-semibold">{activeProject}</span> has not been mapped to any agents yet. This will be configured by the Super Administrator.
                </p>
              </div>
            ) : missingDependencies ? (
              <MissingDependencyView missing={missingDependencies} />
            ) : projectMode === 'brownfield' && brownfieldNavigationItems.find(item => item.path === location.pathname && item.wip) ? (
              (() => {
                const item = brownfieldNavigationItems.find(i => i.path === location.pathname);
                return (
                  <WipPlaceholder
                    title={item.label}
                    description={`The Brownfield capability for "${item.label}" (${item.desc}) is currently under active development.`}
                    icon={item.icon}
                    badge="WIP"
                  />
                );
              })()
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      <ChatbotWidget />
      <TokenThresholdAlert onOpenWidget={() => setIsTokenModalOpen(true)} />
      <TokenTrackerWidget 
        isOpen={isTokenModalOpen} 
        onClose={() => setIsTokenModalOpen(false)} 
      />
      <AiOrchestratorModal 
        isOpen={isAiOrchestratorModalOpen}
        onClose={() => setIsAiOrchestratorModalOpen(false)}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="models" element={<AdminModels />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="personas" element={<AdminPersonas />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="agent-mapping" element={<AdminAgentMapping />} />
            <Route path="workflows" element={<AdminWorkflows />} />
            <Route path="debate-circles" element={<AdminDebateCircles />} />
            <Route path="agent-registry" element={<AgentRegistryView />} />
            <Route path="global-traceability" element={<TraceabilityLogView />} />
            <Route path="knowledge-fabric" element={<KnowledgeFabricView />} />
            <Route path="eval-harness" element={<EvalHarnessView />} />
            <Route path="spec-control" element={<SpecControlView />} />
            <Route path="vector-db" element={<AdminVectorDb />} />
          </Route>

          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/layer0" element={<Layer0IdeaDiscovery />} />
            <Route path="/orchestrator" element={<AgentOrchestrator />} />
            <Route path="/requirements" element={<RequirementAgent />} />
            <Route path="/requirement-to-spec" element={<RequirementToSpec />} />
            <Route path="/validator" element={<ValidatorAgent />} />
            <Route path="/spec-to-story" element={<SpecToStory />} />
            <Route path="/user-stories" element={<UserStories />} />
            <Route path="/ux-wireframe" element={<UXWireframe />} />
            <Route path="/functional-spec" element={<FunctionalSpec />} />
            <Route path="/tech-architecture" element={<TechArchitecture />} />
            <Route path="/database-design" element={<DatabaseDesign />} />
            <Route path="/test-cases" element={<TestCases />} />
            <Route path="/traceability-matrix" element={<TraceabilityMatrix />} />
            <Route path="/review-agent" element={<ReviewAgent />} />
            <Route path="/brownfield-context" element={<BrownfieldContextView />} />
            <Route path="/code-to-spec" element={<CodeToSpecView />} />
            <Route path="/impact-analysis" element={<ImpactAnalysisView />} />
            <Route path="/global-traceability" element={<TraceabilityLogView />} />
            <Route path="/knowledge-fabric" element={<KnowledgeFabricView />} />
            <Route path="/agent-registry" element={<AgentRegistryView />} />
            <Route path="/eval-harness" element={<EvalHarnessView />} />
            <Route path="/spec-control" element={<SpecControlView />} />
            <Route path="/repo" element={<Repository />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PageProvider>
  </React.StrictMode>
);
