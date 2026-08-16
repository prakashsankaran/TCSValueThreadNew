import React from 'react';

export const GeneratedOutput = ({ 
  title = "Generated Output Review", 
  subtitle = "Inspect and export compiles", 
  versions = [],
  selectedVersionId = '',
  onSelectVersion = () => {},
  actions = null, 
  children 
}) => {
  const hasVersions = Array.isArray(versions) && versions.length > 0;

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden shadow-xl border border-slate-800">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full shrink-0"></span>
          <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-200 uppercase whitespace-nowrap">
            {title}
          </h2>
          <select
            value={selectedVersionId}
            onChange={(e) => onSelectVersion(e.target.value)}
            className="bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-500/40 hover:border-indigo-400 rounded-lg px-2.5 py-1 text-[11px] text-indigo-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm transition max-w-[210px] truncate"
          >
            {hasVersions ? (
              versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-950 text-slate-200">
                  {v.artefactId || v.id} ({v.version || 'v1.0.0'}{v.status === 'LATEST' ? ' - LATEST' : ''})
                </option>
              ))
            ) : (
              <option value="" className="bg-slate-950 text-slate-200">SDLC-2026-9961 (v1.0.0 - LATEST)</option>
            )}
          </select>
        </div>

        {/* Header Actions (PDF, Excel, SQL scripts exporters etc.) */}
        {actions && (
          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Main output viewport */}
      <div className="flex-1 p-5 overflow-auto custom-scroll bg-slate-950/40">
        {children}
      </div>
    </div>
  );
};
