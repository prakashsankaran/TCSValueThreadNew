import React from 'react';

export default function WipPlaceholder({ title, description, icon, badge = 'WIP' }) {
  return (
    <div className="p-8 max-w-5xl mx-auto my-12">
      <div className="bg-[#0b0f19] border border-dashed border-amber-500/30 rounded-3xl p-12 text-center space-y-6 shadow-2xl backdrop-blur relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Icon Header */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-amber-500/10">
            <i className={`${icon || 'fa-tools'} animate-pulse`}></i>
          </div>
          <span className="absolute -top-2 right-1/2 translate-x-12 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-slate-950 shadow-md">
            {badge}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {description || 'This Brownfield capability is currently under active development. Upcoming features will enable automated delta synthesis and regression test matrix generation.'}
          </p>
        </div>

        {/* Status Callout Box */}
        <div className="inline-flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Status: <strong>Planned for Next Sprint Release</strong></span>
        </div>

        {/* Quick Workflow Action Hint */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
            <i className="fas fa-check-circle text-emerald-400"></i>
            <span>Step 1: Project Context Attached</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
            <i className="fas fa-check-circle text-emerald-400"></i>
            <span>Step 2: Code-to-Spec Baseline Generated</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
            <i className="fas fa-check-circle text-emerald-400"></i>
            <span>Step 3: Impact Analysis Engine Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
