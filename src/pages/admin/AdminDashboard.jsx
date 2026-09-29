import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalProjects: 3,
    totalPersonas: 8,
    activeUsers: 4,
    inactiveUsers: 1,
    totalAgents: 9,
    totalMappings: 3
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
    <div className="fade-in space-y-6 max-w-7xl mx-auto pb-8">
      
      {/* Top Banner / Welcome Bar */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
            <span className="text-xs text-[#98A2B3]">•</span>
            <span className="text-xs font-semibold text-[#667085]">TCS ValueThread v2.4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17181C] tracking-tight">
            Governance & Administration Command Center
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Real-time telemetry, persona access boundaries, AI agent fleet orchestration, and enterprise compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/projects"
            className="px-3.5 py-2 rounded-[10px] bg-[#7157F5] hover:bg-[#5F46D8] text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-plus text-[10px]"></i>
            <span>New Project</span>
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-2 rounded-[10px] bg-white hover:bg-[#F8F8F7] text-[#344054] border border-[#ECEEF1] hover:border-[#D0D5DD] text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-user-plus text-[11px] text-[#7157F5]"></i>
            <span>Provision User</span>
          </Link>
          <Link
            to="/admin/debate-circles"
            className="px-3.5 py-2 rounded-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-balance-scale text-[11px]"></i>
            <span>Debate Circles</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Personas Card */}
        <Link 
          to="/admin/personas" 
          className="bg-white border border-[#ECEEF1] hover:border-blue-300 rounded-[18px] p-5 relative overflow-hidden group shadow-2xs hover:shadow-md transition-all duration-200 block cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500 opacity-80"></div>
          <div className="flex justify-between items-start mb-3 pt-1">
            <div>
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                Registered Personas
              </span>
              <h3 className="text-3xl font-extrabold text-[#17181C] tracking-tight">{metrics.totalPersonas}</h3>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <i className="fas fa-users-cog text-lg"></i>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2F4F7]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-[6px] border border-blue-100 bg-blue-50 text-blue-700 text-[10px] font-bold">
                4 System
              </span>
              <span className="inline-block px-2 py-0.5 rounded-[6px] border border-[#ECEEF1] bg-[#F8F8F7] text-[#475467] text-[10px] font-bold">
                4 Custom
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#667085] group-hover:text-blue-600 transition-colors">
              <span>Manage</span>
              <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
            </div>
          </div>
        </Link>

        {/* Projects Card */}
        <Link 
          to="/admin/projects" 
          className="bg-white border border-[#ECEEF1] hover:border-amber-300 rounded-[18px] p-5 relative overflow-hidden group shadow-2xs hover:shadow-md transition-all duration-200 block cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500 opacity-80"></div>
          <div className="flex justify-between items-start mb-3 pt-1">
            <div>
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                Total Projects
              </span>
              <h3 className="text-3xl font-extrabold text-[#17181C] tracking-tight">{metrics.totalProjects}</h3>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <i className="fas fa-briefcase text-lg"></i>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2F4F7]">
            <span className="inline-block px-2.5 py-0.5 rounded-[6px] border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold">
              Active Portfolios
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#667085] group-hover:text-amber-600 transition-colors">
              <span>View Portfolios</span>
              <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
            </div>
          </div>
        </Link>

        {/* Users Card */}
        <Link 
          to="/admin/users" 
          className="bg-white border border-[#ECEEF1] hover:border-emerald-300 rounded-[18px] p-5 relative overflow-hidden group shadow-2xs hover:shadow-md transition-all duration-200 block cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500 opacity-80"></div>
          <div className="flex justify-between items-start mb-3 pt-1">
            <div>
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                Total Users
              </span>
              <h3 className="text-3xl font-extrabold text-[#17181C] tracking-tight">{metrics.activeUsers + metrics.inactiveUsers}</h3>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <i className="fas fa-user-shield text-lg"></i>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2F4F7]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-[6px] border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                {metrics.activeUsers} Active
              </span>
              <span className="inline-block px-2 py-0.5 rounded-[6px] border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold">
                {metrics.inactiveUsers} Inactive
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#667085] group-hover:text-emerald-600 transition-colors">
              <span>Directory</span>
              <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
            </div>
          </div>
        </Link>

        {/* Agents Card */}
        <Link 
          to="/admin/agents" 
          className="bg-white border border-[#ECEEF1] hover:border-purple-300 rounded-[18px] p-5 relative overflow-hidden group shadow-2xs hover:shadow-md transition-all duration-200 block cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-600 opacity-80"></div>
          <div className="flex justify-between items-start mb-3 pt-1">
            <div>
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                Defined Agents
              </span>
              <h3 className="text-3xl font-extrabold text-[#17181C] tracking-tight">{metrics.totalAgents}</h3>
            </div>
            <div className="w-11 h-11 rounded-[12px] bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <i className="fas fa-robot text-lg"></i>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2F4F7]">
            <span className="inline-block px-2.5 py-0.5 rounded-[6px] border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold">
              Available in Pool
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#667085] group-hover:text-purple-600 transition-colors">
              <span>Registry</span>
              <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
            </div>
          </div>
        </Link>

        {/* Agent Mappings Card */}
        <Link 
          to="/admin/agent-mapping" 
          className="bg-white border border-[#ECEEF1] hover:border-pink-300 rounded-[18px] p-5 relative overflow-hidden group shadow-2xs hover:shadow-md transition-all duration-200 block cursor-pointer md:col-span-2"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-pink-500 opacity-80"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 h-full pt-1">
            <div>
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                Active Agent Mappings
              </span>
              <div className="flex items-baseline gap-2.5">
                <h3 className="text-3xl font-extrabold text-[#17181C] tracking-tight">{metrics.totalMappings}</h3>
                <span className="text-xs text-[#667085] font-semibold">Rules Configured</span>
              </div>
              <p className="text-xs text-[#667085] mt-1.5 max-w-lg leading-relaxed">
                Contextual access mappings controlling which personas can utilize specific agents within their assigned projects.
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <div className="w-13 h-13 rounded-[14px] bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center relative shadow-2xs">
                <i className="fas fa-project-diagram text-xl"></i>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full"></div>
              </div>
              <div className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#667085] group-hover:text-pink-600 transition-colors">
                <span>Configure</span>
                <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* Governance & Integration Quick Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* SDLC Stage Governance */}
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17181C] flex items-center gap-2">
              <i className="fas fa-shield-alt text-[#7157F5]"></i>
              <span>Governance Controls</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
              Active Gates
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8F8F7] border border-[#ECEEF1]">
              <span className="font-semibold text-[#344054]">Role-Based Agent Gating</span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> Enforced
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8F8F7] border border-[#ECEEF1]">
              <span className="font-semibold text-[#344054]">Human-in-the-Loop Signoffs</span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> Enabled
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8F8F7] border border-[#ECEEF1]">
              <span className="font-semibold text-[#344054]">SHA-256 Audit Trail</span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> Immutable
              </span>
            </div>
          </div>
        </div>

        {/* Infrastructure & Vector Store */}
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17181C] flex items-center gap-2">
              <i className="fas fa-database text-indigo-500"></i>
              <span>Data & Vector Store</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              ChromaDB / SQLite
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8F8F7] border border-[#ECEEF1]">
              <span className="font-semibold text-[#344054]">Primary Database</span>
              <span className="text-[11px] font-bold text-slate-700">SQLite (Better-Sqlite3)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8F8F7] border border-[#ECEEF1]">
              <span className="font-semibold text-[#344054]">Embedding Model</span>
              <span className="text-[11px] font-bold text-indigo-600">MiniLM-L6-v2 / Hybrid</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8F8F7] border border-[#ECEEF1]">
              <span className="font-semibold text-[#344054]">Enterprise Telemetry</span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <i className="fas fa-circle text-[7px]"></i> Live Syncing
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17181C] flex items-center gap-2">
              <i className="fas fa-compass text-amber-500"></i>
              <span>Navigation Quicklinks</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
              Shortcuts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link 
              to="/admin/personas" 
              className="p-2.5 rounded-[10px] bg-[#F8F8F7] hover:bg-purple-50 hover:border-purple-200 border border-[#ECEEF1] transition-all flex items-center gap-2 font-semibold text-[#344054] hover:text-purple-700 cursor-pointer"
            >
              <i className="fas fa-users-cog text-[#7157F5]"></i>
              <span className="truncate">Personas</span>
            </Link>
            <Link 
              to="/admin/workflows" 
              className="p-2.5 rounded-[10px] bg-[#F8F8F7] hover:bg-purple-50 hover:border-purple-200 border border-[#ECEEF1] transition-all flex items-center gap-2 font-semibold text-[#344054] hover:text-purple-700 cursor-pointer"
            >
              <i className="fas fa-network-wired text-[#7157F5]"></i>
              <span className="truncate">Orchestration</span>
            </Link>
            <Link 
              to="/admin/agents" 
              className="p-2.5 rounded-[10px] bg-[#F8F8F7] hover:bg-purple-50 hover:border-purple-200 border border-[#ECEEF1] transition-all flex items-center gap-2 font-semibold text-[#344054] hover:text-purple-700 cursor-pointer"
            >
              <i className="fas fa-robot text-[#7157F5]"></i>
              <span className="truncate">Agent Pool</span>
            </Link>
            <Link 
              to="/layer0" 
              className="p-2.5 rounded-[10px] bg-[#F8F8F7] hover:bg-amber-50 hover:border-amber-200 border border-[#ECEEF1] transition-all flex items-center gap-2 font-semibold text-[#344054] hover:text-amber-700 cursor-pointer"
            >
              <i className="fas fa-lightbulb text-amber-500"></i>
              <span className="truncate">Discovery</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}

