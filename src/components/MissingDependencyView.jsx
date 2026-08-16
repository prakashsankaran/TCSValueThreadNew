import React from 'react';

export default function MissingDependencyView({ missing }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 fade-in">
      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-6 shadow-[0_0_30px_rgba(244,63,94,0.15)] relative">
        <i className="fas fa-lock text-3xl text-rose-400"></i>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#0b0f19] flex items-center justify-center border border-slate-800">
          <i className="fas fa-exclamation text-rose-500 text-sm"></i>
        </div>
      </div>
      
      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Agent Locked</h2>
      <p className="text-sm mt-2 max-w-md text-center text-slate-400 leading-relaxed mb-8">
        This agent cannot be run because it depends on artifacts that have not yet been generated in the workflow pipeline.
      </p>

      <div className="bg-[#0b0f19] border border-rose-500/30 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="bg-rose-500/10 px-4 py-3 border-b border-rose-500/20">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center">
            <i className="fas fa-network-wired mr-2"></i> Missing Dependencies
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {missing.map((dep, idx) => (
            <div key={idx} className="flex items-start space-x-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="mt-0.5 text-rose-500">
                <i className="fas fa-times-circle"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{dep.artifact}</p>
                <p className="text-xs text-slate-500 mt-0.5">Required from <span className="text-indigo-400">{dep.sourceAgent}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
