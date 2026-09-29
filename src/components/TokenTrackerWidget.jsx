import React, { useState, useEffect } from 'react';
import { tokenTracker } from '../services/tokenTracker';

const API_BASE = 'http://localhost:7001';

export default function TokenTrackerWidget({ isOpen, onClose }) {
  const [summary, setSummary] = useState(() => tokenTracker.getSummary());
  const [history, setHistory] = useState(() => tokenTracker.getHistory());
  const [selectedModel, setSelectedModel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const [thresholdInput, setThresholdInput] = useState(() => {
    return localStorage.getItem('token_alert_threshold') || '100000';
  });
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return localStorage.getItem('token_alerts_enabled') !== 'false';
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveThreshold = (e) => {
    e.preventDefault();
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 0) return;

    localStorage.setItem('token_alert_threshold', val.toString());
    localStorage.setItem('token_alerts_enabled', alertsEnabled ? 'true' : 'false');
    window.dispatchEvent(new Event('token_threshold_updated'));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/api/tokens/summary`),
        fetch(`${API_BASE}/api/tokens/history${selectedModel ? `?model=${encodeURIComponent(selectedModel)}` : ''}`)
      ]);

      const sumData = await sumRes.json();
      const histData = await histRes.json();

      if (sumData.success && sumData.grandTotalTokens !== undefined) {
        setSummary(sumData);
      } else {
        setSummary(tokenTracker.getSummary());
      }
      if (histData.success && Array.isArray(histData.history)) {
        setHistory(histData.history);
      } else {
        setHistory(tokenTracker.getHistory());
      }
    } catch (err) {
      setSummary(tokenTracker.getSummary());
      setHistory(tokenTracker.getHistory());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      const handleUpdate = () => fetchData();
      window.addEventListener('token_usage_updated', handleUpdate);
      return () => window.removeEventListener('token_usage_updated', handleUpdate);
    }
  }, [isOpen, selectedModel]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all token usage history?')) {
      try {
        await fetch(`${API_BASE}/api/tokens/clear`, { method: 'DELETE' });
      } catch (err) {}
      tokenTracker.clearHistory();
      fetchData();
    }
  };

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    const matchesModel = !selectedModel || item.model.toLowerCase() === selectedModel.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModel && matchesSearch;
  });

  const formatNumber = (num) => (num || 0).toLocaleString();

  const getModelBadgeColor = (modelName) => {
    const lower = (modelName || '').toLowerCase();
    if (lower.includes('2.5-pro') || lower.includes('2.0-pro') || lower.includes('pro')) return 'bg-[#F4F1FF] text-[#5F46D8] border border-[#E4DCFF]';
    if (lower.includes('flash')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (lower.includes('gpt-4')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (lower.includes('claude')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-purple-50 text-purple-700 border border-purple-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#17181C]/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white border-l border-[#ECEEF1] text-[#17181C] flex flex-col h-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-[#ECEEF1] flex items-center justify-between bg-[#FAFAF9]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F4F1FF] text-[#7157F5] border border-[#E4DCFF] flex items-center justify-center shadow-2xs">
              <i className="fas fa-coins text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#17181C]">Token Usage & History</h2>
              <p className="text-[11px] text-[#667085]">Real-time model token consumption telemetry</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-[8px] bg-white border border-[#ECEEF1] text-[#667085] hover:text-[#17181C] hover:bg-[#F8F8F7] transition cursor-pointer text-xs shadow-2xs"
              title="Refresh Data"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin text-[#7157F5]' : ''}`}></i>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-[8px] bg-white border border-[#ECEEF1] text-[#667085] hover:text-[#17181C] hover:bg-[#F8F8F7] transition cursor-pointer text-xs shadow-2xs"
              title="Close Panel"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Global Summary KPI Bar */}
        <div className="grid grid-cols-4 gap-3 p-4 border-b border-[#ECEEF1] bg-[#FAFAF9]">
          <div className="bg-white border border-[#ECEEF1] rounded-[12px] p-3 shadow-2xs">
            <div className="text-[9px] font-bold text-[#667085] uppercase tracking-wider">Total Tokens</div>
            <div className="text-base font-bold text-[#5F46D8] mt-1 font-mono">{formatNumber(summary.grandTotalTokens)}</div>
          </div>
          <div className="bg-white border border-[#ECEEF1] rounded-[12px] p-3 shadow-2xs">
            <div className="text-[9px] font-bold text-[#667085] uppercase tracking-wider">Prompt (In)</div>
            <div className="text-base font-bold text-blue-600 mt-1 font-mono">{formatNumber(summary.grandTotalPromptTokens)}</div>
          </div>
          <div className="bg-white border border-[#ECEEF1] rounded-[12px] p-3 shadow-2xs">
            <div className="text-[9px] font-bold text-[#667085] uppercase tracking-wider">Completion (Out)</div>
            <div className="text-base font-bold text-purple-600 mt-1 font-mono">{formatNumber(summary.grandTotalCompletionTokens)}</div>
          </div>
          <div className="bg-white border border-[#ECEEF1] rounded-[12px] p-3 shadow-2xs">
            <div className="text-[9px] font-bold text-[#667085] uppercase tracking-wider">LLM Calls</div>
            <div className="text-base font-bold text-emerald-600 mt-1 font-mono">{formatNumber(summary.totalCalls)}</div>
          </div>
        </div>

        {/* Tab Navigation & Filters Header */}
        <div className="px-6 py-3 border-b border-[#ECEEF1] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-[#F8F8F7] p-1 rounded-[10px] border border-[#ECEEF1]">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-white text-[#17181C] shadow-2xs font-bold border border-[#ECEEF1]'
                  : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              <i className="fas fa-chart-pie mr-1.5 text-[#7157F5]"></i> Model Grouping
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-[#17181C] shadow-2xs font-bold border border-[#ECEEF1]'
                  : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              <i className="fas fa-history mr-1.5 text-[#7157F5]"></i> Call History ({filteredHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-[#17181C] shadow-2xs font-bold border border-[#ECEEF1]'
                  : 'text-[#667085] hover:text-[#17181C]'
              }`}
            >
              <i className="fas fa-bell mr-1.5 text-[#7157F5]"></i> Alert Limits
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white border border-[#ECEEF1] text-[#344054] text-xs px-3 py-1.5 rounded-[8px] font-medium focus:outline-none focus:border-[#7157F5] cursor-pointer shadow-2xs"
            >
              <option value="">All Models</option>
              {summary.byModel.map(m => (
                <option key={m.model} value={m.model}>{m.model}</option>
              ))}
            </select>

            {activeTab === 'history' && (
              <button
                onClick={handleClearHistory}
                className="px-2.5 py-1.5 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Clear History Logs"
              >
                <i className="fas fa-trash-alt mr-1"></i> Clear
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll bg-[#FAFAF9]/50">
          {/* TAB 1: MODEL GROUPING ACCORDION / CARDS */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">Consumption Grouped by Model</h3>

              {summary.byModel.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#ECEEF1] rounded-[16px] shadow-2xs">
                  <i className="fas fa-robot text-3xl text-[#98A2B3] mb-3 block"></i>
                  <p className="text-xs text-[#344054] font-semibold">No LLM token consumption recorded yet.</p>
                  <p className="text-[10px] text-[#667085] mt-1">Run an agent or scaffolding task to start tracking.</p>
                </div>
              ) : (
                summary.byModel.map((m) => {
                  const pct = summary.grandTotalTokens > 0 
                    ? Math.round((m.totalTokens / summary.grandTotalTokens) * 100) 
                    : 0;

                  return (
                    <div key={m.model} className="bg-white border border-[#ECEEF1] rounded-[14px] p-4 space-y-3 hover:border-[#D0D5DD] transition shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className={`px-2.5 py-1 rounded-[6px] text-xs font-mono font-bold ${getModelBadgeColor(m.model)}`}>
                            {m.model}
                          </span>
                          <span className="text-[10px] font-semibold text-[#667085] bg-[#F8F8F7] border border-[#ECEEF1] px-2 py-0.5 rounded-full">
                            {m.callCount} {m.callCount === 1 ? 'call' : 'calls'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-[#17181C] font-mono">{formatNumber(m.totalTokens)}</span>
                          <span className="text-[10px] text-[#667085] ml-1">tokens ({pct}%)</span>
                        </div>
                      </div>

                      {/* Usage Breakdown Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-[#ECEEF1] rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${m.totalTokens ? (m.promptTokens / m.totalTokens) * 100 : 0}%` }}
                            title={`Prompt Tokens: ${formatNumber(m.promptTokens)}`}
                          ></div>
                          <div 
                            className="h-full bg-[#7157F5]" 
                            style={{ width: `${m.totalTokens ? (m.completionTokens / m.totalTokens) * 100 : 0}%` }}
                            title={`Completion Tokens: ${formatNumber(m.completionTokens)}`}
                          ></div>
                        </div>

                        <div className="flex justify-between text-[10px] text-[#667085] font-mono pt-1">
                          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span> Prompt: {formatNumber(m.promptTokens)}</span>
                          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#7157F5] mr-1.5"></span> Completion: {formatNumber(m.completionTokens)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: CHRONOLOGICAL HISTORY TIMELINE */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-2.5 text-[#98A2B3] text-xs"></i>
                <input
                  type="text"
                  placeholder="Search by agent or model name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#ECEEF1] rounded-[10px] pl-9 pr-4 py-2 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] shadow-2xs"
                />
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#ECEEF1] rounded-[16px] shadow-2xs">
                  <i className="fas fa-clock text-3xl text-[#98A2B3] mb-3 block"></i>
                  <p className="text-xs text-[#344054] font-semibold">No matching history records found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item) => {
                    const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });
                    const formattedDate = new Date(item.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <div 
                        key={item.id}
                        className="bg-white border border-[#ECEEF1] hover:border-[#D0D5DD] rounded-[12px] p-3 flex items-center justify-between transition shadow-2xs"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-[#17181C] truncate">{item.agentName}</span>
                            <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold ${getModelBadgeColor(item.model)}`}>
                              {item.model}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#667085] font-mono">
                            <i className="far fa-clock mr-1 text-[#98A2B3]"></i>{formattedDate} at {formattedTime}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-[#5F46D8] font-mono">
                            ⚡ {formatNumber(item.totalTokens)}
                          </div>
                          <div className="text-[9px] text-[#667085] font-mono space-x-1.5">
                            <span>In: {formatNumber(item.promptTokens)}</span>
                            <span>•</span>
                            <span>Out: {formatNumber(item.completionTokens)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALERT LIMIT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#ECEEF1] rounded-[16px] p-5 space-y-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-[10px] bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <i className="fas fa-bell text-amber-600 text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#17181C]">Token Usage Alert Threshold</h3>
                    <p className="text-[11px] text-[#667085]">Receive automatic pop-up alerts when total token consumption exceeds this limit.</p>
                  </div>
                </div>

                {/* Meter Progress Card */}
                {(() => {
                  const tVal = parseInt(thresholdInput, 10) || 100000;
                  const pct = Math.round((summary.grandTotalTokens / tVal) * 100);
                  const isOver = summary.grandTotalTokens >= tVal;

                  return (
                    <div className={`p-4 rounded-[12px] border ${isOver ? 'bg-rose-50 border-rose-200' : 'bg-[#FAFAF9] border-[#ECEEF1]'} space-y-2 shadow-2xs`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#667085] font-bold uppercase text-[10px] tracking-wider">Current Limit Status</span>
                        <span className={`font-mono font-bold text-xs ${isOver ? 'text-rose-700' : pct > 75 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {summary.grandTotalTokens.toLocaleString()} / {tVal.toLocaleString()} tokens ({pct}%)
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-[#ECEEF1] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${isOver ? 'bg-rose-500 animate-pulse' : pct > 75 ? 'bg-amber-500' : 'bg-[#7157F5]'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Configuration Form */}
                <form onSubmit={handleSaveThreshold} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#344054] block">
                      Token Limit Threshold (Tokens)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      className="w-full bg-[#FAFAF9] border border-[#ECEEF1] rounded-[10px] px-3 py-2 text-xs text-[#17181C] font-mono focus:outline-none focus:border-[#7157F5]"
                    />
                    <p className="text-[10px] text-[#667085]">Default: 100,000 tokens. (Set to 0 to disable alerts).</p>
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <input
                      type="checkbox"
                      id="alertsEnabled"
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded bg-white border-[#ECEEF1] text-[#7157F5] focus:ring-0 cursor-pointer accent-[#7157F5]"
                    />
                    <label htmlFor="alertsEnabled" className="text-xs text-[#344054] font-medium cursor-pointer">
                      Enable Pop-up Alert Banners when limit is reached
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 pt-3">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-[10px] bg-[#17181C] hover:bg-[#292B30] text-white text-xs font-semibold transition shadow-sm cursor-pointer"
                    >
                      <i className="fas fa-save mr-1.5"></i> Save Alert Threshold
                    </button>

                    {saveSuccess && (
                      <span className="text-xs text-emerald-700 font-semibold animate-fadeIn flex items-center">
                        <i className="fas fa-check-circle mr-1 text-emerald-600"></i> Threshold Saved!
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
