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
    navigate('/');
  };

  const handleUserChange = (e) => {
    const rawVal = e.target.value;
    setSelectedUserId(rawVal);
    const user = users.find(u => String(u.id) === String(rawVal));
    if (user) setEmail(user.email);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#17181C] font-sans relative overflow-hidden select-none">
      
      {/* Background subtle radial glow */}
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: `
            radial-gradient(circle at 60% 30%, rgba(113, 87, 245, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 30% 70%, rgba(22, 184, 166, 0.04) 0%, transparent 45%)
          `
        }}
      />

      {/* Top Header */}
      <header className="w-full flex justify-between items-center px-6 lg:px-12 py-4 border-b border-[#ECEEF1] bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')} title="TCS ValueThread Home">
          <img
            src="/branding/tcs-valuethread-header-logo.png"
            alt="TCS ValueThread"
            className="h-9 md:h-10 w-auto object-contain transition-transform hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/branding/tcs-valuethread-full-logo-tagline.png";
            }}
          />
        </div>

        {/* ACTIVE USER Dropdown in Top Header */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider hidden sm:inline">Active Persona:</span>
          <div className="relative">
            <select 
              value={selectedUserId || ''}
              onChange={handleUserChange}
              className="appearance-none bg-white border border-[#ECEEF1] hover:border-[#D0D5DD] text-[#344054] text-xs font-semibold rounded-[10px] pl-3 pr-8 py-2 focus:outline-none focus:border-[#7157F5] transition-colors cursor-pointer min-w-[220px] shadow-2xs"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {getPrimaryPersona(u)}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-[#98A2B3]">
              <i className="fas fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Workspace Area */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-8">
        <div className="bg-white border border-[#ECEEF1] rounded-[20px] p-8 sm:p-10 max-w-[440px] w-full shadow-md relative">
          
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7157F5] via-[#5F46D8] to-[#16B8A6] rounded-t-[20px]"></div>

          <div className="text-center mb-7">
            <img 
              src="/branding/tcs-valuethread-symbol-simple.png" 
              alt="TCS ValueThread Emblem" 
              className="w-12 h-12 rounded-[14px] mx-auto mb-3 shadow-2xs object-contain p-1 border border-[#ECEEF1] bg-[#F4F1FF]"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/branding/tcs-valuethread-app-icon-256.png";
              }}
            />
            <h2 className="text-2xl font-bold text-[#17181C] mb-1 tracking-tight">Enterprise Sign In</h2>
            <p className="text-[#667085] text-xs">Authenticate into TCS ValueThread Workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">User Email / SSO ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98A2B3]">
                  <i className="fas fa-user text-xs"></i>
                </div>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-[#ECEEF1] rounded-[10px] py-2.5 pl-9 pr-4 text-xs font-medium text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-all placeholder-[#98A2B3]"
                  placeholder="name@tcs.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98A2B3]">
                  <i className="fas fa-lock text-xs"></i>
                </div>
                <input 
                  type="password" 
                  className="w-full bg-[#FAFAF9] border border-[#ECEEF1] rounded-[10px] py-2.5 pl-9 pr-4 text-xs font-medium text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition-all placeholder-[#98A2B3]"
                  placeholder="••••••••"
                  defaultValue="password123"
                  required
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <a href="#" className="text-[11px] font-semibold text-[#7157F5] hover:text-[#5F46D8] transition-colors">Forgot password?</a>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full mt-2 bg-[#17181C] hover:bg-[#292B30] active:bg-[#000000] text-white font-semibold py-2.5 rounded-[12px] shadow-sm transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Access ValueThread</span>
              <i className="fas fa-arrow-right text-[10px]"></i>
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-grow border-t border-[#ECEEF1]"></div>
            <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#98A2B3]">or Single Sign-On</span>
            <div className="flex-grow border-t border-[#ECEEF1]"></div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button 
              type="button" 
              onClick={() => handleLogin()} 
              className="flex items-center justify-center gap-2 bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#D0D5DD] transition-all py-2 rounded-[10px] text-xs font-semibold text-[#344054] cursor-pointer shadow-2xs"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Google SSO</span>
            </button>
            <button 
              type="button" 
              onClick={() => handleLogin()} 
              className="flex items-center justify-center gap-2 bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#D0D5DD] transition-all py-2 rounded-[10px] text-xs font-semibold text-[#344054] cursor-pointer shadow-2xs"
            >
              <svg viewBox="0 0 23 23" width="13" height="13" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#F25022" x="0" y="0" width="11" height="11"/>
                <rect fill="#7FBA00" x="12" y="0" width="11" height="11"/>
                <rect fill="#00A4EF" x="0" y="12" width="11" height="11"/>
                <rect fill="#FFB900" x="12" y="12" width="11" height="11"/>
              </svg>
              <span>Microsoft SSO</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
