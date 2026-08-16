import React, { useState, useEffect } from 'react';

export default function SignalBrowserDrawer({ isOpen, onClose, onImportSignal, signalType = 'ALL' }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewSignal, setPreviewSignal] = useState(null);
  const [filterType, setFilterType] = useState(signalType);

  useEffect(() => {
    setFilterType(signalType);
  }, [signalType]);

  useEffect(() => {
    if (isOpen) {
      fetchSignals();
    }
  }, [isOpen]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:7001/api/layer0/signals');
      const data = await res.json();
      if (data.success) {
        setSignals(data.signals || []);
      }
    } catch (e) {
      console.warn('Error fetching signals for browser drawer:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredSignals = signals.filter(s => {
    if (filterType === 'GMAIL') return s.sourceType === 'GMAIL_THREAD' || s.sourceSystem === 'GOOGLE_GMAIL';
    if (filterType === 'MEET') return s.sourceType === 'GOOGLE_MEET_TRANSCRIPT' || s.sourceSystem === 'GOOGLE_MEET';
    if (filterType === 'SLACK') return s.sourceType?.includes('SLACK') || s.sourceSystem === 'SLACK';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <i className="fas fa-satellite-dish text-indigo-400 text-lg"></i>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                Confirmed Enterprise Signals
              </h2>
              <p className="text-[11px] text-slate-400">
                Browse confirmed signals from Enterprise Intake Service (Gmail / Meet / Slack)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Drawer Filter Tabs */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center space-x-2">
          {['ALL', 'GMAIL', 'MEET', 'SLACK'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Confirmed Signals' : tab === 'GMAIL' ? 'Gmail Threads' : tab === 'MEET' ? 'Meet Transcripts' : 'Slack Threads'}
            </button>
          ))}
          <button
            onClick={fetchSignals}
            className="ml-auto text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1"
          >
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
        </div>

        {/* Signal List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <i className="fas fa-spinner animate-spin text-lg mb-2"></i>
              <p>Loading confirmed signals...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl p-6 bg-slate-900/40">
              <i className="fas fa-inbox text-slate-600 text-3xl mb-2"></i>
              <p className="text-xs font-bold text-slate-300">No Confirmed Signals Found</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                No confirmed signals found for this connector. Publish signals from Google Signal Intake at{' '}
                <a href="http://localhost:7070" target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                  http://localhost:7070
                </a>
              </p>
            </div>
          ) : (
            filteredSignals.map(sig => (
              <div
                key={sig.importId}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 hover:border-indigo-500/50 transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      <i className={`${
                        sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                          ? 'fab fa-slack'
                          : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                          ? 'fas fa-envelope'
                          : 'fas fa-video'
                      } mr-1`}></i>
                      {sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                        ? 'Slack Thread'
                        : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                        ? 'Gmail Thread'
                        : 'Google Meet'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {sig.connectorMode}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {sig.importId} (v{sig.version})
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <i className="fas fa-check-circle mr-1"></i>
                    {sig.status}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-100">{sig.candidateTitle}</h3>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 py-1 bg-slate-950/40 rounded-lg px-2">
                  <div>
                    <span className="text-slate-500 block">Sensitivity:</span>
                    <span className="font-semibold text-amber-300">{sig.sensitivity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Statements:</span>
                    <span className="font-semibold text-slate-200">{sig.statements?.length || 0} Confirmed</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reviewed By:</span>
                    <span className="font-semibold text-slate-300">{sig.reviewedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PII Detected:</span>
                    <span className={`font-semibold ${sig.containsPotentialPII ? 'text-rose-400' : 'text-slate-400'}`}>
                      {sig.containsPotentialPII ? 'YES' : 'NONE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <a
                    href={sig.sourceDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <i className="fas fa-external-link-alt text-[9px]"></i>
                    <span>Open Google Source</span>
                  </a>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewSignal(sig)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        onImportSignal(sig);
                        onClose();
                      }}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition flex items-center space-x-1"
                    >
                      <i className="fas fa-file-import"></i>
                      <span>Import into Discovery</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Signal Preview Modal */}
      {previewSignal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{previewSignal.candidateTitle}</h3>
                <p className="text-[11px] text-slate-400">Reviewed Signal Preview & Governance Metadata</p>
              </div>
              <button
                onClick={() => setPreviewSignal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] mb-1">
                  Confirmed Reviewed Statements ({previewSignal.statements?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {previewSignal.statements?.map((st, i) => (
                    <div key={i} className="text-slate-300 border-b border-slate-900 pb-1.5 last:border-0">
                      <span className="font-mono text-[9px] text-indigo-400 bg-indigo-950/60 px-1 py-0.5 rounded mr-1.5">
                        [{st?.primaryCategory || st?.category || 'STATEMENT'}]
                      </span>
                      <span>{typeof st === 'string' ? st : (st?.text || st?.statement || st?.editedStatement || st?.originalText || '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {previewSignal.unresolvedQuestions?.length > 0 && (
                <div>
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[10px] mb-1">
                    Unresolved Open Questions ({previewSignal.unresolvedQuestions.length})
                  </h4>
                  <ul className="list-disc list-inside text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    {previewSignal.unresolvedQuestions.map((q, i) => (
                      <li key={i}>{typeof q === 'string' ? q : q.question}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                <p className="text-slate-400"><strong className="text-slate-200">Reviewed By:</strong> {previewSignal.reviewedBy} at {previewSignal.reviewedAt}</p>
                <p className="text-slate-400"><strong className="text-slate-200">Sensitivity:</strong> {previewSignal.sensitivity}</p>
                <p className="text-slate-400"><strong className="text-slate-200">Content Hash:</strong> <code className="text-indigo-400">{previewSignal.contentHash}</code></p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewSignal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onImportSignal(previewSignal);
                  setPreviewSignal(null);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Import into Discovery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
