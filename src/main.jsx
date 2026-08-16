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
    const proj = allProjects.find(p => p.name === activeProject);
    if (proj && proj.type === 'Brown Field') {
      setProjectMode('brownfield');
    } else {
      setProjectMode('greenfield');
    }
    localStorage.setItem('activeProject', activeProject);
  }, [activeProject, allProjects, setProjectMode]);
  
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

  return (
    <div className={`flex h-screen overflow-hidden bg-[#070a13] text-[#f3f4f6] ${theme}`}>
      <aside 
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } border-r border-slate-800 bg-[#0b0f19] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
          <Link 
            to="/requirements" 
            className={`px-4 py-4 border-b border-slate-800 flex items-center bg-slate-950/20 hover:bg-slate-950/40 transition cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}
            title="TCS ValueThread"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h1 className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TCS ValueThread</h1>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Intelligent Requirements Framework</p>
              </div>
            )}
          </Link>

          <nav className="p-2 space-y-1">
            {activeNavigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isWip = projectMode === 'brownfield' && item.wip;

              if (isWip) {
                return (
                  <div
                    key={item.path}
                    title={isSidebarCollapsed ? `${item.label} (Work In Progress)` : 'Work In Progress'}
                    className={`flex items-center rounded-xl border border-transparent opacity-40 cursor-not-allowed select-none ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-950/60 text-slate-600 border border-slate-900">
                      <i className={`${item.icon} text-xs`}></i>
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs truncate text-slate-500">{item.label}</p>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded border border-slate-800/80 bg-slate-950 text-slate-500 font-mono">
                            WIP
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-600 truncate">{item.desc}</p>
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
                  className={`flex items-center rounded-xl transition duration-200 group ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? theme === 'light'
                        ? projectMode === 'brownfield' 
                          ? 'bg-amber-50 border border-amber-200 text-amber-700 font-semibold'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold'
                        : projectMode === 'brownfield'
                          ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 text-white font-semibold'
                          : 'bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 text-white font-semibold'
                      : theme === 'light'
                        ? 'border border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                        : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition duration-200 shrink-0 ${
                    isActive 
                      ? theme === 'light'
                        ? projectMode === 'brownfield' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                        : projectMode === 'brownfield' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400' 
                      : theme === 'light'
                        ? 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                        : 'bg-slate-900/50 text-slate-500 group-hover:bg-slate-900 group-hover:text-slate-300'
                  }`}>
                    <i className={`${item.icon} text-xs`}></i>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate">{item.label}</p>
                        {item.badge && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ml-1 shrink-0 ${
                            isActive 
                              ? projectMode === 'brownfield' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition truncate">{item.desc}</p>
                    </div>
                  )}
                </Link>
              );
            })}
            
            {isAdminPersona && (
              <div className="pt-2 border-t border-slate-800/80 mt-2">
                <Link
                  to="/admin/dashboard"
                  title={isSidebarCollapsed ? 'Admin Control Plane' : undefined}
                  className={`flex items-center rounded-xl transition duration-200 group font-semibold ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'
                  } ${
                    theme === 'light' 
                      ? 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'
                      : 'bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 text-purple-300 hover:text-white'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${theme === 'light' ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/10 text-purple-400'}`}>
                    <i className="fas fa-user-shield text-xs"></i>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="truncate flex-1 min-w-0">
                      <p className="text-xs truncate font-bold">Admin Control Plane</p>
                      <p className="text-[9px] text-purple-400/80 truncate">Personas, Workflows & Users</p>
                    </div>
                  )}
                </Link>
              </div>
            )}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/20 space-y-2">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Workspace:</span>
                <span 
                  className="text-indigo-400 font-semibold font-mono truncate max-w-[120px] capitalize" 
                  title={activeSpec}
                >
                  {activeSpec.replace(/^\d+-/, '').replace(/-/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">API Server:</span>
                <span className="text-green-400 font-semibold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span> Port 7001
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-center" title="API Server: Port 7001">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
          )}

          <button
            onClick={() => navigate('/login')}
            className="w-full py-1.5 mt-2 mb-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs flex items-center justify-center transition cursor-pointer gap-2"
            title="Sign Out"
          >
            <i className="fas fa-sign-out-alt"></i>
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center justify-center transition cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <i className={`fas ${isSidebarCollapsed ? 'fa-angle-double-right' : 'fa-angle-double-left'}`}></i>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#070a13] relative">
        <header className="h-14 border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur flex justify-between items-center px-4 md:px-6 shrink-0 min-w-0 gap-4">
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-center text-slate-400 hover:text-white transition duration-200 cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <i className={`fas ${isSidebarCollapsed ? 'fa-bars text-indigo-400' : 'fa-outdent'} text-xs`}></i>
            </button>

            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest hidden 2xl:block shrink-0">
              {projectMode === 'brownfield' ? 'Brownfield Spec Board' : 'Workspace Spec Board'}
            </h2>

            <div className="h-5 w-px bg-slate-800 mx-1.5 hidden 2xl:block"></div>
            
            <div className="hidden sm:flex relative items-center shrink-0">
              <div className="absolute left-3 pointer-events-none">
                <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </div>
              <select 
                value={activeProject}
                onChange={(e) => {
                  const newProj = e.target.value;
                  setActiveProject(newProj);
                  localStorage.setItem('activeProject', newProj);
                  window.dispatchEvent(new CustomEvent('activeProjectChanged', { detail: { projectId: newProj } }));
                }}
                className="bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-300 transition-colors focus:outline-none cursor-pointer appearance-none h-[34px] max-w-[170px] font-semibold"
              >
                {userProjects.map(up => (
                  <option key={up.projectId} value={up.projectId}>{up.projectId}</option>
                ))}
                {userProjects.length === 0 && <option value="">No Projects Assigned</option>}
              </select>
              <div className="absolute right-3 pointer-events-none">
                <svg className="w-3 h-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] shrink-0">
            <HeaderTokenBadge onClick={() => setIsTokenModalOpen(true)} />

            <button
              onClick={() => setIsAiOrchestratorModalOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1.5 cursor-pointer"
              title="Configure AI Orchestrator & Google Gemini API Key"
            >
              <i className="fas fa-brain text-indigo-400"></i>
              <span className="hidden xl:inline">AI Router</span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-900/60 hover:border-indigo-500 flex items-center justify-center text-slate-400 hover:text-white transition duration-200 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <i className={`fas ${theme === 'dark' ? 'fa-lightbulb text-amber-400 animate-pulse' : 'fa-moon text-indigo-500'} text-xs`}></i>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800 ml-1">
              <div 
                className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow shrink-0" 
                title={`${activeUser?.name || 'User'} (${activePersona})`}
              >
                {activeUser?.name ? activeUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer flex items-center space-x-1 shrink-0"
                title="Sign Out of Workspace"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {!isAdminPersona && (
          <WorkflowStatusTracker activeProject={activeProject} />
        )}

        <div className="flex-1 p-6 overflow-y-auto custom-scroll">
          {activeNavigationItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <i className="fas fa-robot text-5xl mb-4 opacity-50"></i>
              <h2 className="text-xl font-semibold text-slate-400">No Agents Mapped</h2>
              <p className="text-sm mt-2 max-w-md text-center">
                Your assigned persona (<span className="text-indigo-400">{activePersona}</span>) for project <span className="text-indigo-400">{activeProject}</span> has not been mapped to any agents yet. This will be configured by the Super Administrator.
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
            <Route path="/" element={null} />
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
