import React, { useState, useEffect } from 'react';
import { orchestratorEngine } from '../agents/orchestratorEngine';

export const AiOrchestratorModal = ({ isOpen, onClose }) => {
  const [orchestrationMode, setOrchestrationMode] = useState('auto');
  const [strictOpenSource, setStrictOpenSource] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOrchestrationMode(orchestratorEngine.getMode());
      setStrictOpenSource(orchestratorEngine.getStrictOpenSource());
    }
  }, [isOpen]);

  const handleSave = () => {
    orchestratorEngine.setMode(orchestrationMode);
    orchestratorEngine.setStrictOpenSource(strictOpenSource);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <i className="fas fa-brain text-indigo-400"></i>
              <span>AI Engine & Dynamic Model Orchestrator</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Configure self-hosted LiteLLM routing policy and open-source model enforcement.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer text-lg">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {showSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-bold flex items-center space-x-2 animate-fade-in">
            <i className="fas fa-check-circle"></i>
            <span>Orchestrator settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Orchestration Routing Policy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'auto', title: '⚡ Auto Complexity Router', desc: 'Prioritizes Open-Source models based on input tokens & score' },
                { id: 'litellm', title: '🎯 LiteLLM Gateway', desc: 'Force self-hosted Enterprise LiteLLM models' },
                { id: 'gemini', title: '♊ Google AI Studio', desc: 'Force direct Google Gemini API' },
                { id: 'offline', title: '📦 Offline Demo', desc: 'Client synthesis without active network calls' }
              ].map(m => (
                <div 
                  key={m.id}
                  onClick={() => setOrchestrationMode(m.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                    orchestrationMode === m.id 
                      ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-lg' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200">{m.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strictly Open-Source Enforcement Toggle (Only applicable for Auto Router and LiteLLM Gateway) */}
          {(orchestrationMode === 'auto' || orchestrationMode === 'litellm') ? (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <i className="fas fa-shield-alt text-emerald-400"></i>
                  <span>Enforce Strictly Open-Source Models</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Routes strictly to DeepSeek-R1, Llama 3.3 70B, Llama 4 Maverick & Phi-4. Blocks all commercial proprietary APIs.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input 
                  type="checkbox"
                  checked={strictOpenSource}
                  onChange={(e) => setStrictOpenSource(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          ) : orchestrationMode === 'gemini' ? (
            <div className="p-3 bg-indigo-950/30 border border-indigo-900/60 rounded-xl text-[11px] text-indigo-300 flex items-center space-x-2 animate-fade-in">
              <i className="fas fa-info-circle text-indigo-400 text-sm"></i>
              <span>Google AI Studio policy forces commercial Google Gemini 2.5 Pro API calls directly. Open-source enforcement applies to LiteLLM & Auto Router modes.</span>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center space-x-2 animate-fade-in">
              <i className="fas fa-box text-amber-400 text-sm"></i>
              <span>Offline mode uses client-side template synthesis without making external network or LLM API calls.</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg border border-indigo-500/30 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="fas fa-save"></i>
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
};
