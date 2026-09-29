import React, { useState } from 'react';

export const ComplexityBadge = ({ complexity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!complexity) return null;

  if (complexity.isCalculating) {
    return (
      <div className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-[8px] text-[10px] font-semibold text-purple-700 flex items-center gap-1.5 animate-pulse shrink-0">
        <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
        <span>Evaluating Complexity...</span>
      </div>
    );
  }

  const { score, level, tokenEst, modelChain } = complexity;

  let colorClasses = 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/70';
  if (level === 'LOW') colorClasses = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70';
  if (level === 'HIGH' || level === 'CRITICAL') colorClasses = 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-2.5 py-1 border rounded-[8px] text-[11px] font-semibold transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${colorClasses}`}
        title="Click to view AI complexity score rationale and model routing chain"
      >
        <i className="fas fa-chart-line text-[10px]"></i>
        <span>Complexity: {score}/10 ({level})</span>
        <i className="fas fa-info-circle text-[9px] opacity-70"></i>
      </button>

      {/* Rationale Pop-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] max-w-md w-full p-6 shadow-2xl space-y-4 relative text-left">
            <div className="flex justify-between items-start border-b border-[#F2F4F7] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#17181C] flex items-center gap-2">
                  <i className="fas fa-brain text-[#7157F5]"></i>
                  <span>AI Artifact Complexity Analysis</span>
                </h3>
                <p className="text-[11px] text-[#667085] mt-0.5">Dynamic routing evaluation report</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#98A2B3] hover:text-[#17181C] transition cursor-pointer p-1">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Score & Rating Bar */}
            <div className="bg-[#F8F8F7] p-4 border border-[#ECEEF1] rounded-[14px] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Complexity Rating</span>
                <span className="text-lg font-bold text-[#17181C] font-mono">{score} / 10 ({level})</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Input Tokens</span>
                <span className="text-sm font-bold text-[#7157F5] font-mono">~{tokenEst?.toLocaleString() || 0} Tokens</span>
              </div>
            </div>

            {/* Routed LLM Model */}
            {modelChain && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Routed LLM Model & Provider</span>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-[12px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-900 font-mono">{modelChain.primaryModel}</span>
                    <span className="px-2 py-0.2 bg-purple-200/60 text-purple-800 text-[9px] font-bold rounded">Primary</span>
                  </div>
                  <p className="text-[11px] text-purple-700">{modelChain.primaryProvider}</p>
                </div>
              </div>
            )}

            {/* Rationale Explanation */}
            {modelChain?.rationale && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Routing Rationale</span>
                <div className="p-3 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[12px] text-xs text-[#344054] leading-relaxed">
                  {modelChain.rationale}
                </div>
              </div>
            )}

            {/* Failover Chain */}
            <div className="p-3 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[12px] space-y-1">
              <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">Failover Chain</span>
              <div className="text-[10px] text-[#667085] font-mono space-y-0.5">
                <p>1. {modelChain?.primaryProvider || 'LiteLLM Gateway'}</p>
                <p>2. {modelChain?.fallbackProvider || 'Google AI Studio Gemini API'}</p>
                <p>3. Client IEEE-830 Offline Engine</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F2F4F7]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-[#F8F8F7] hover:bg-[#ECEEF1] text-[#344054] text-xs font-semibold rounded-[8px] transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
