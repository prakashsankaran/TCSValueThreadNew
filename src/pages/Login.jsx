import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';

const DEFAULT_USERS = [
  { id: 'user-01', name: 'Prasanna', email: 'prasanna@frugalforge.io', isSuperAdmin: false, displayRole: 'Platform Admin', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Platform Admin'] }] },
  { id: 'user-02', name: 'Prakash', email: 'prakash@frugalforge.io', isSuperAdmin: false, displayRole: 'Project Admin', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Project Admin'] }] },
  { id: 'user-03', name: 'Vignesh (Business Analyst)', email: 'vignesh@frugalforge.io', isSuperAdmin: false, displayRole: 'Business Analyst', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Business Analyst'] }] },
  { id: 'user-04', name: 'Mithra (Product Owner)', email: 'mithra@frugalforge.io', isSuperAdmin: false, displayRole: 'Product Owner', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Product Owner'] }] },
  { id: 'user-05', name: 'Karthik (Technical Architect)', email: 'karthik@frugalforge.io', isSuperAdmin: false, displayRole: 'Solution Architect', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Solution Architect'] }] },
  { id: 'user-06', name: 'Saravanan (QA Engineer)', email: 'saravanan@frugalforge.io', isSuperAdmin: false, displayRole: 'QA Engineer', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['QA Engineer'] }] },
  { id: 'user-07', name: 'Rajesh Sharma (Business Sponsor)', email: 'sponsor@frugalforge.io', isSuperAdmin: false, displayRole: 'Business Sponsor', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Business Sponsor'] }] },
  { id: 'user-08', name: 'Deepa Venkat (Business SME)', email: 'sme@frugalforge.io', isSuperAdmin: false, displayRole: 'Business SME', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Business SME'] }] },
  { id: 'user-09', name: 'Anand Kumar (Delivery Manager)', email: 'dm@frugalforge.io', isSuperAdmin: false, displayRole: 'Delivery Manager', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Delivery Manager'] }] },
  { id: 'user-10', name: 'Ananya Sundaram (UX Designer)', email: 'ux@frugalforge.io', isSuperAdmin: false, displayRole: 'UX Designer', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['UX Designer'] }] },
  { id: 'user-11', name: 'Siddharth Rao (Data Architect)', email: 'data.architect@frugalforge.io', isSuperAdmin: false, displayRole: 'Data Architect', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Data Architect'] }] },
  { id: 'user-12', name: 'Suresh Iyer (Security Reviewer)', email: 'security@frugalforge.io', isSuperAdmin: false, displayRole: 'Security Reviewer', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Security Reviewer'] }] },
  { id: 'user-13', name: 'Vikram Patel (Technical Lead)', email: 'techlead@frugalforge.io', isSuperAdmin: false, displayRole: 'Technical Lead', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Technical Lead'] }] },
  { id: 'user-14', name: 'Arjun Nair (Developer)', email: 'developer@frugalforge.io', isSuperAdmin: false, displayRole: 'Developer', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Developer'] }] },
  { id: 'user-15', name: 'Rohan Gupta (DevOps Engineer)', email: 'devops@frugalforge.io', isSuperAdmin: false, displayRole: 'DevOps Engineer', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['DevOps Engineer'] }] },
  { id: 'user-16', name: 'Priya Natarajan (Release Manager)', email: 'releasemanager@frugalforge.io', isSuperAdmin: false, displayRole: 'Release Manager', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Release Manager'] }] },
  { id: 'user-17', name: 'Ganesh Raman (Deployment Manager)', email: 'deploymentmanager@frugalforge.io', isSuperAdmin: false, displayRole: 'Deployment Manager', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Deployment Manager'] }] },
  { id: 'user-18', name: 'Lakshmi Narayanan (Auditor)', email: 'auditor@frugalforge.io', isSuperAdmin: false, displayRole: 'Auditor', projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Auditor'] }] }
];

export default function Login() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(DEFAULT_USERS);

  useEffect(() => {
    userService.getUsers().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(u => {
          let isSuperAdmin = u.isSuperAdmin || false;
          let modifiedProjectAccess = [...(u.projectAccess || [])];
          
          let displayRole = u.displayRole;
          if (!displayRole) {
            if (isSuperAdmin) displayRole = 'Super Admin';
            else if (modifiedProjectAccess.length > 0 && modifiedProjectAccess[0].personas && modifiedProjectAccess[0].personas.length > 0) {
              displayRole = modifiedProjectAccess[0].personas[0];
            } else displayRole = 'User';
          }
          return { ...u, isSuperAdmin, displayRole, projectAccess: modifiedProjectAccess };
        });
        setUsers(formatted);
      }
    });
  }, []);

  const getPrimaryPersona = (user) => {
    if (!user) return 'No Role';
    if (user.displayRole) return user.displayRole;
    if (user.isSuperAdmin) return 'Super Admin';
    if (!user.projectAccess || user.projectAccess.length === 0) return 'No Role';
    return user.projectAccess[0].personas[0] || 'No Role';
  };

  const [selectedUserId, setSelectedUserId] = useState(users.length > 0 ? users[0].id : null);
  const selectedUser = users.find(u => String(u.id) === String(selectedUserId)) || users[0];
  const [email, setEmail] = useState(selectedUser ? selectedUser.email : '');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;
    localStorage.setItem('activeUserId', selectedUser.id);
    
    const pAccess = selectedUser.projectAccess || [];
    const isPlatformAdmin = selectedUser.isSuperAdmin || pAccess.some(p => p.personas && (p.personas.includes('Platform Admin') || p.personas.includes('Super Admin') || p.personas.includes('Admin')));
    
    if (isPlatformAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/spec-to-story');
    }
  };

  const handleUserChange = (e) => {
    const rawVal = e.target.value;
    setSelectedUserId(rawVal);
    const user = users.find(u => String(u.id) === String(rawVal));
    if (user) setEmail(user.email);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-[#f8fafc] font-sans relative overflow-hidden">
      
      {/* Background ambient glow effects */}
      <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="absolute top-0 w-full flex justify-between items-center px-8 py-5 z-20 pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]">
            <i className="fas fa-gem text-base"></i>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[20px] font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-tight">TCS ValueThread</span>
            <span className="text-[10px] text-[#6366f1] font-semibold tracking-wider uppercase">Intelligent SDLC Workspace</span>
          </div>
        </div>

        {/* ACTIVE USER Dropdown in Top Header */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ACTIVE USER:</span>
          <div className="relative">
            <select 
              value={selectedUserId || ''}
              onChange={handleUserChange}
              className="appearance-none bg-[#0c1222] border border-slate-800 text-slate-300 text-[13px] font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer min-w-[240px]"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name.split(' (')[0]} ({getPrimaryPersona(user)})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Workspace Area */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 mt-12">
        <div className="bg-[#0c1222]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-10 max-w-[440px] w-full shadow-2xl relative">
          
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl"></div>

          <div className="text-center mb-8">
            <h2 className="text-[28px] font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-[14px]">Enter your credentials to access TCS ValueThread</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-400 mb-2">Username / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-[18px] h-[18px] text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#060913]/70 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-[15px] text-white focus:outline-none focus:border-indigo-500 focus:bg-[#060913]/90 transition-all placeholder-slate-600 font-mono"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-[18px] h-[18px] text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input 
                  type="password" 
                  className="w-full bg-[#060913]/70 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-[15px] text-white focus:outline-none focus:border-indigo-500 focus:bg-[#060913]/90 transition-all placeholder-slate-600 tracking-wider"
                  placeholder="••••••••"
                  defaultValue="password123"
                  required
                />
              </div>
              <div className="flex justify-end mt-2">
                <a href="#" className="text-[13px] text-[#6366f1] hover:text-indigo-400 transition-colors">Forgot password?</a>
              </div>
            </div>

            <button type="submit" className="w-full mt-2 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:opacity-90 text-white font-semibold py-3 rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all text-[15px] cursor-pointer">
              Authenticate Workspace
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-800/80"></div>
            <span className="px-3 text-[10px] uppercase font-semibold tracking-wider text-slate-500">or login with SSO</span>
            <div className="flex-grow border-t border-slate-800/80"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleLogin()} className="flex items-center justify-center space-x-2 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all py-2.5 rounded-xl text-[13px] font-semibold text-slate-300 cursor-pointer">
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" onClick={() => handleLogin()} className="flex items-center justify-center space-x-2 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all py-2.5 rounded-xl text-[13px] font-semibold text-slate-300 cursor-pointer">
              <svg viewBox="0 0 23 23" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#F25022" x="0" y="0" width="11" height="11"/>
                <rect fill="#7FBA00" x="12" y="0" width="11" height="11"/>
                <rect fill="#00A4EF" x="0" y="12" width="11" height="11"/>
                <rect fill="#FFB900" x="12" y="12" width="11" height="11"/>
              </svg>
              <span>Microsoft</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
