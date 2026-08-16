import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalProjects: 3,
    totalPersonas: 8,
    activeUsers: 4,
    inactiveUsers: 1,
    totalAgents: 9,
    totalMappings: 0
  });

  useEffect(() => {
    try {
      const savedMappings = localStorage.getItem('agentMappings');
      if (savedMappings) {
        const parsed = JSON.parse(savedMappings);
        setMetrics(prev => ({ ...prev, totalMappings: parsed.length }));
      } else {
        setMetrics(prev => ({ ...prev, totalMappings: 3 }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="text-white fade-in space-y-6">

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Personas Card */}
        <Link to="/admin/personas" className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors shadow-lg block cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Registered Personas</span>
              <h3 className="text-4xl font-black text-white">{metrics.totalPersonas}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <i className="fas fa-users-cog text-xl"></i>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              <span className="inline-block px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 text-[9px] font-bold">4 System</span>
              <span className="inline-block px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 text-[9px] font-bold">4 Custom</span>
            </div>
            <i className="fas fa-arrow-right text-slate-600 group-hover:text-blue-400 transition-colors text-xs"></i>
          </div>
        </Link>

        {/* Projects Card */}
        <Link to="/admin/projects" className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors shadow-lg block cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Projects</span>
              <h3 className="text-4xl font-black text-white">{metrics.totalProjects}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <i className="fas fa-briefcase text-xl"></i>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-4">
            <span className="inline-block px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold">
              Active Portfolios
            </span>
            <i className="fas fa-arrow-right text-slate-600 group-hover:text-amber-400 transition-colors text-xs"></i>
          </div>
        </Link>

        {/* Users Card */}
        <Link to="/admin/users" className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors shadow-lg block cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Users</span>
              <h3 className="text-4xl font-black text-white">{metrics.activeUsers + metrics.inactiveUsers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <i className="fas fa-user-shield text-xl"></i>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              <span className="inline-block px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                {metrics.activeUsers} Active
              </span>
              <span className="inline-block px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[9px] font-bold">
                {metrics.inactiveUsers} Inactive
              </span>
            </div>
            <i className="fas fa-arrow-right text-slate-600 group-hover:text-emerald-400 transition-colors text-xs"></i>
          </div>
        </Link>

        {/* Agents Card */}
        <Link to="/admin/agents" className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors shadow-lg block cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Defined Agents</span>
              <h3 className="text-4xl font-black text-white">{metrics.totalAgents}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <i className="fas fa-robot text-xl"></i>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-4">
            <span className="inline-block px-2.5 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-bold">
              Available in Pool
            </span>
            <i className="fas fa-arrow-right text-slate-600 group-hover:text-purple-400 transition-colors text-xs"></i>
          </div>
        </Link>

        {/* Agent Mappings Card */}
        <Link to="/admin/agent-mapping" className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-pink-500/50 transition-colors shadow-lg block cursor-pointer lg:col-span-2">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-colors"></div>
          <div className="flex justify-between items-center h-full relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Agent Mappings</span>
              <div className="flex items-baseline space-x-3">
                <h3 className="text-4xl font-black text-white">{metrics.totalMappings}</h3>
                <span className="text-sm text-slate-400 font-semibold">Rules Configured</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-sm">
                Contextual access mappings controlling which personas can utilize specific agents within their assigned projects.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/10 relative">
              <i className="fas fa-project-diagram text-2xl"></i>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></div>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
