import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const [allProjects, setAllProjects] = useState([]);
  const [dbMappings, setDbMappings] = useState([]);

  useEffect(() => {
    userService.getUsers().then(data => {
      if (Array.isArray(data)) setUsers(data);
    });
  }, []);

  const activeUserId = localStorage.getItem('activeUserId');
  const activeUser = users.find(u => String(u.id) === String(activeUserId)) || users[0];
  const userInitials = activeUser?.name ? activeUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PA';

  const activeProject = localStorage.getItem('activeProject') || 'Vendor Management';
  const userProjects = React.useMemo(() => {
    if (!allProjects || allProjects.length === 0) return [];

    const validProjectNames = new Set(allProjects.map(p => p.name || p.id || p.projectId));
    const projectMap = new Map();

    if (activeUser && Array.isArray(activeUser.projectAccess)) {
      activeUser.projectAccess.forEach(p => {
        if (p && p.projectId && validProjectNames.has(p.projectId)) {
          projectMap.set(p.projectId, { projectId: p.projectId, personas: p.personas || ['Platform Admin'] });
        }
      });
    }

    if (Array.isArray(dbMappings)) {
      dbMappings.forEach(m => {
        if (m && m.projectId && validProjectNames.has(m.projectId)) {
          if (!projectMap.has(m.projectId)) {
            projectMap.set(m.projectId, { projectId: m.projectId, personas: [m.personaName || 'Platform Admin'] });
          }
        }
      });
    }

    allProjects.forEach(p => {
      const pname = p.name || p.id || p.projectId;
      if (pname && validProjectNames.has(pname) && !projectMap.has(pname)) {
        projectMap.set(pname, { projectId: pname, personas: ['Platform Admin'] });
      }
    });

    return Array.from(projectMap.values());
  }, [activeUser, dbMappings, allProjects]);
  const activeUserAccess = userProjects.find(p => p.projectId === activeProject);
  const activePersona = activeUserAccess && activeUserAccess.personas.length > 0 ? activeUserAccess.personas[0] : (activeUser?.isSuperAdmin ? 'Platform Admin' : 'Platform Admin');
  const isLayer0Persona = activePersona === 'Project Admin' || activePersona === 'Product Owner';

  const rawNavigationItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', desc: 'System Metrics' },
    { path: '/layer0', label: 'Enterprise Discovery', icon: 'fas fa-lightbulb text-amber-400', desc: 'Pre-SDD Discovery' },
    { path: '/admin/personas', label: 'Persona Management', icon: 'fas fa-users-cog', desc: 'Manage Roles', badge: 'Layer 6' },
    { path: '/admin/projects', label: 'Project Management', icon: 'fas fa-briefcase', desc: 'Manage Projects' },
    { path: '/admin/users', label: 'User Management', icon: 'fas fa-user-shield', desc: 'Provision Users' },
    { path: '/admin/agents', label: 'Agent Registry', icon: 'fas fa-robot', desc: 'Configure Agents' },
    { path: '/admin/agent-mapping', label: 'Agent Mapping', icon: 'fas fa-project-diagram', desc: 'Map Agents' },
    { path: '/admin/workflows', label: 'Agent Orchestration', icon: 'fas fa-network-wired', desc: 'Pipeline Setup', badge: 'Layer 5' },
    { path: '/admin/global-traceability', label: 'Evidence Ledger', icon: 'fas fa-history text-indigo-400', desc: 'Audit Ledger Layer 1' },
    { path: '/admin/vector-db', label: 'Vector DB Explorer', icon: 'fas fa-database text-purple-400', desc: 'ChromaDB Embeddings' },
    { path: '/admin/debate-circles', label: 'Debate Circles', icon: 'fas fa-balance-scale', desc: 'Configure Debates' }
  ];

  let navigationItems = isLayer0Persona ? rawNavigationItems : rawNavigationItems.filter(item => item.path !== '/layer0');
  if (activePersona !== 'Project Admin' && activePersona !== 'Product Owner') {
    navigationItems = navigationItems.filter(item => 
      item.path !== '/admin/global-traceability' &&
      item.path !== '/admin/vector-db'
    );
  }

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAFAF9] text-[#17181C]">
      {/* 1. TOP ADMIN STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ECEEF1] px-4 sm:px-6 py-2.5 flex items-center justify-between select-none shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <img
            src="/branding/tcs-valuethread-header-logo.png"
            alt="TCS ValueThread"
            className="h-8 sm:h-9 w-auto object-contain cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => navigate('/')}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/branding/tcs-valuethread-full-logo-tagline.png";
            }}
          />
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 border border-purple-200">
            Admin Control Plane
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/layer0')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white hover:bg-[#F8F8F7] text-[#344054] border border-[#ECEEF1] hover:border-[#D0D5DD] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <i className="fas fa-arrow-left text-[#7157F5] text-xs"></i>
            <span>Return to Workspace</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-[#ECEEF1]">
            <div 
              className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0 cursor-default" 
              title={activeUser?.name || 'Platform Admin'}
            >
              {userInitials}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#98A2B3] hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
              title="Sign Out of Admin Control Plane"
            >
              <i className="fas fa-sign-out-alt text-xs"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY FRAME: ADMIN SIDEBAR + MAIN VIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside 
          className={`${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          } border-r border-[#ECEEF1] bg-white flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-20`}
        >
          <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3 space-y-1">
            <span className={`block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] ${isSidebarCollapsed ? 'text-center' : ''}`}>
              {isSidebarCollapsed ? 'CFG' : 'Administration'}
            </span>
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-[10px] transition-all duration-150 ${
                    isSidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs'
                      : 'text-[#667085] hover:text-[#17181C] hover:bg-[#F8F8F7] border border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 transition-colors ${
                    isActive 
                      ? 'bg-purple-600 text-white' 
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
                              ? 'bg-white text-purple-700 border-purple-200'
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
          </div>

          {/* Footer Collapse Toggle */}
          <div className="p-3 border-t border-[#ECEEF1] bg-[#F8F8F7]">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full py-1.5 rounded-[8px] bg-white border border-[#ECEEF1] hover:bg-[#F8F8F7] text-[#667085] hover:text-[#17181C] text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <i className={`fas ${isSidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-[10px]`}></i>
            </button>
          </div>
        </aside>

        {/* Dynamic page contents wrapper */}
        <div className="flex-1 p-6 overflow-y-auto custom-scroll bg-[#FAFAF9]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
