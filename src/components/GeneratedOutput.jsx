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
    <div className="bg-white rounded-[18px] flex flex-col h-full overflow-hidden shadow-2xs border border-[#ECEEF1]">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-[#ECEEF1] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-3.5 bg-[#7157F5] rounded-full shrink-0"></span>
          <h2 className="text-xs font-bold tracking-wider text-[#17181C] uppercase whitespace-nowrap">
            {title}
          </h2>
          <select
            value={selectedVersionId}
            onChange={(e) => onSelectVersion(e.target.value)}
            className="bg-[#F8F8F7] hover:bg-white border border-[#ECEEF1] hover:border-[#D0D5DD] rounded-[8px] px-2.5 py-1 text-xs text-[#17181C] font-mono font-semibold focus:outline-none focus:border-[#7157F5] cursor-pointer shadow-2xs transition max-w-[210px] truncate"
          >
            {hasVersions ? (
              versions.map((v) => (
                <option key={v.id} value={v.id} className="text-[#17181C]">
                  {v.artefactId || v.id} ({v.version || 'v1.0.0'}{v.status === 'LATEST' ? ' - LATEST' : ''})
                </option>
              ))
            ) : (
              <option value="" className="text-[#17181C]">SDLC-2026-9961 (v1.0.0 - LATEST)</option>
            )}
          </select>
        </div>

        {/* Header Actions (PDF, Excel, SQL scripts exporters etc.) */}
        {actions && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Main output viewport */}
      <div className="flex-1 p-5 overflow-auto custom-scroll bg-[#FAFAF9]">
        {children}
      </div>
    </div>
  );
};

