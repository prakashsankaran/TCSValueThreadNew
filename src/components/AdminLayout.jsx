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
    <div className={`flex h-screen overflow-hidden bg-[#070a13] text-[#f3f4f6] ${theme}`}>
      {/* Sidebar Navigation */}
      <aside 
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } border-r border-slate-800 bg-[#0b0f19] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
          {/* Brand header */}
          <div className={`px-4 py-4 border-b border-slate-800 flex items-center bg-slate-950/20 ${
              isSidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 text-white">
              <i className="fas fa-gem text-xs"></i>
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h1 className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TCS ValueThread</h1>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Platform Admin Control Center</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1 mt-4">
            <span className={`block px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${isSidebarCollapsed ? 'text-center' : ''}`}>
              {isSidebarCollapsed ? 'CFG' : 'Configuration'}
            </span>
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
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
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold'
                        : 'bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 text-white font-semibold'
                      : theme === 'light'
                        ? 'border border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                        : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition duration-200 shrink-0 ${
                    isActive 
                      ? theme === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400' 
                      : theme === 'light' ? 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500' : 'bg-slate-900/50 text-slate-500 group-hover:bg-slate-900 group-hover:text-slate-300'
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
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
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
          </nav>
        </div>

        {/* Footer System Status & Collapse Toggle */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/20 space-y-2">
          {!isSidebarCollapsed && (
            <div className="mb-4 px-2 py-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-shrink-0 items-center justify-center font-bold text-white text-xs">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{activeUser?.name || 'Platform Admin'}</p>
                <p className="text-[10px] text-indigo-400 truncate">{activeUser?.email || 'prasanna@frugalforge.io'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2 mb-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs flex items-center justify-center transition cursor-pointer gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            {!isSidebarCollapsed && <span>Log Out</span>}
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

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070a13] relative">
        {/* Top bar header */}
        <header className="h-14 border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur flex justify-between items-center px-6 shrink-0 min-w-0">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-center text-slate-400 hover:text-white transition duration-200 cursor-pointer shrink-0"
            >
              <i className={`fas ${isSidebarCollapsed ? 'fa-bars text-indigo-400' : 'fa-outdent'} text-xs`}></i>
            </button>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest hidden lg:block shrink-0">
              Platform Admin Control Center
            </h2>

            <div className="h-5 w-px bg-slate-800 mx-3 hidden lg:block"></div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-900/60 hover:border-indigo-500 flex items-center justify-center text-slate-400 hover:text-white transition duration-200 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <i className={`fas ${theme === 'dark' ? 'fa-lightbulb text-amber-400 animate-pulse' : 'fa-moon text-indigo-500'} text-xs`}></i>
            </button>
            <div className="flex items-center space-x-2 pl-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow shrink-0" title={activeUser?.name || 'Platform Admin'}>
                {userInitials}
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer flex items-center space-x-1 shrink-0"
                title="Sign Out of Admin Control Center"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic page contents wrapper */}
        <div className="flex-1 p-6 overflow-y-auto custom-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
