import React, { useState, useEffect } from 'react';
import { tokenTracker } from '../services/tokenTracker';

const API_BASE = 'http://localhost:7001';

export default function HeaderTokenBadge({ onClick }) {
  const [totalTokens, setTotalTokens] = useState(() => tokenTracker.getSummary().grandTotalTokens);
  const [threshold, setThreshold] = useState(() => {
    return parseInt(localStorage.getItem('token_alert_threshold') || '100000', 10);
  });
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return localStorage.getItem('token_alerts_enabled') !== 'false';
  });

  const fetchSummary = async () => {
    setThreshold(parseInt(localStorage.getItem('token_alert_threshold') || '100000', 10));
    setAlertsEnabled(localStorage.getItem('token_alerts_enabled') !== 'false');

    try {
      const res = await fetch(`${API_BASE}/api/tokens/summary`);
      const data = await res.json();
      if (data.success && data.grandTotalTokens !== undefined) {
        setTotalTokens(data.grandTotalTokens);
        return;
      }
    } catch (err) {}

    // Fallback to dynamic tokenTracker local summary
    const summary = tokenTracker.getSummary();
    setTotalTokens(summary.grandTotalTokens);
  };

  useEffect(() => {
    fetchSummary();
    const handleUpdate = () => fetchSummary();

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('token_threshold_updated', handleUpdate);
    window.addEventListener('token_usage_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('token_threshold_updated', handleUpdate);
      window.removeEventListener('token_usage_updated', handleUpdate);
    };
  }, []);

  const formatTokens = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const isExceeded = alertsEnabled && threshold > 0 && totalTokens >= threshold;

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] transition duration-200 shadow-2xs cursor-pointer ${
        isExceeded
          ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse'
          : 'bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#D0D5DD] text-[#344054]'
      }`}
      title={isExceeded ? `Token limit exceeded! (${totalTokens.toLocaleString()} / ${threshold.toLocaleString()})` : "View Model Token Consumption & History Log"}
    >
      <i className={`fas ${isExceeded ? 'fa-exclamation-triangle text-rose-600' : 'fa-bolt text-amber-500'} text-xs`}></i>
      <span className="text-xs font-semibold font-mono tracking-tight text-[#17181C]">
        {formatTokens(totalTokens)} <span className="text-[10px] font-sans font-normal text-[#667085]">Tokens</span> {isExceeded ? '⚠️' : ''}
      </span>
    </button>
  );
}
