import React, { useState } from 'react';

export const ComplexityBadge = ({ complexity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!complexity) return null;

  if (complexity.isCalculating) {
    return (
      <div className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-lg text-[10px] font-bold text-indigo-300 flex items-center space-x-1.5 animate-pulse shrink-0">
        <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
        <span>Evaluating Complexity...</span>
      </div>
    );
  }

  const { score, level, tokenEst, modelChain } = complexity;

  let colorClasses = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20';
  if (level === 'LOW') colorClasses = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
  if (level === 'HIGH' || level === 'CRITICAL') colorClasses = 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold transition duration-200 flex items-center space-x-1.5 cursor-pointer shrink-0 ${colorClasses}`}
        title="Click to view AI complexity score rationale and model routing chain"
      >
        <i className="fas fa-chart-line text-[10px]"></i>
        <span>Complexity: {score}/10 ({level})</span>
        <i className="fas fa-info-circle text-[9px] opacity-75"></i>
      </button>

      {/* Rationale Pop-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-left">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500"></div>

            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <i className="fas fa-brain text-indigo-400"></i>
                  <span>AI Artifact Complexity Analysis</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Dynamic routing evaluation report</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Score & Rating Bar */}
            <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Complexity Rating</span>
                <span className="text-xl font-bold text-white font-mono">{score} / 10 ({level})</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Input Tokens</span>
                <span className="text-sm font-bold text-indigo-400 font-mono">~{tokenEst?.toLocaleString() || 0} Tokens</span>
              </div>
            </div>

            {/* Routed LLM Model */}
            {modelChain && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Routed LLM Model & Provider</span>
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white font-mono">{modelChain.primaryModel}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded">Primary</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{modelChain.primaryProvider}</p>
                </div>
              </div>
            )}

            {/* Rationale Explanation */}
            {modelChain?.rationale && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Routing Rationale</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                  {modelChain.rationale}
                </div>
              </div>
            )}

            {/* Failover Chain */}
            <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Failover Chain</span>
              <div className="text-[10px] text-slate-400 font-mono space-y-1">
                <p>1. {modelChain?.primaryProvider || 'LiteLLM Gateway'}</p>
                <p>2. {modelChain?.fallbackProvider || 'Google AI Studio Gemini API'}</p>
                <p>3. Client IEEE-830 Offline Engine</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
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
