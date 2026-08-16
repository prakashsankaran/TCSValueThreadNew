import React, { useState, useEffect } from 'react';

export default function SignalInbox({ onImportInitiative }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, importId: null, candidateTitle: '' });

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:7001/api/layer0/signals');
      const data = await res.json();
      if (data.success) {
        setSignals(data.signals || []);
      }
    } catch (e) {
      console.warn('Error fetching signals for inbox:', e);
    } finally {
      setLoading(false);
    }
  };

  const [importingId, setImportingId] = useState(null);

  const handleCreateInitiative = async (importId) => {
    setImportingId(importId);
    try {
      const res = await fetch(`http://localhost:7001/api/layer0/signals/${encodeURIComponent(importId)}/create-initiative`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.ideaState) {
        if (onImportInitiative) onImportInitiative(data.ideaState);
        fetchSignals();
      } else {
        alert(data.error || 'Failed to import signal into discovery workbench.');
      }
    } catch (e) {
      console.error('Error creating initiative:', e);
      alert('Error importing signal: ' + e.message);
    } finally {
      setImportingId(null);
    }
  };

  const handleRejectSignal = async (importId) => {
    try {
      const res = await fetch(`http://localhost:7001/api/layer0/signals/${encodeURIComponent(importId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: 'Rejected via Signal Inbox' })
      });
      const data = await res.json();
      if (data.success) fetchSignals();
    } catch (e) {
      console.error('Error rejecting signal:', e);
    }
  };

  const promptDeleteSignal = (sig) => {
    setConfirmModal({
      show: true,
      type: 'SINGLE',
      importId: sig.importId,
      candidateTitle: sig.candidateTitle
    });
  };

  const promptClearAllSignals = () => {
    setConfirmModal({
      show: true,
      type: 'ALL',
      importId: null,
      candidateTitle: ''
    });
  };

  const executeDeleteSignal = async (importId) => {
    try {
      const res = await fetch(`http://localhost:7001/api/layer0/signals/${encodeURIComponent(importId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) fetchSignals();
    } catch (e) {
      console.error('Error deleting signal:', e);
    }
  };

  const executeClearAllSignals = async () => {
    try {
      const res = await fetch(`http://localhost:7001/api/layer0/signals/clear/all`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) fetchSignals();
    } catch (e) {
      console.error('Error clearing signals:', e);
    }
  };

  const filteredSignals = signals.filter(s => {
    if (activeFilter === 'EMAIL') return s.sourceType === 'GMAIL_THREAD' || s.sourceSystem === 'GOOGLE_GMAIL';
    if (activeFilter === 'MEET') return s.sourceType === 'GOOGLE_MEET_TRANSCRIPT' || s.sourceSystem === 'GOOGLE_MEET';
    if (activeFilter === 'SLACK') return s.sourceType?.includes('SLACK') || s.sourceSystem === 'SLACK';
    if (activeFilter === 'NOT_IMPORTED') return s.status !== 'IMPORTED' && s.status !== 'HANDED_OFF_TO_SDD';
    if (activeFilter === 'IMPORTED') return s.status === 'IMPORTED';
    if (activeFilter === 'HANDED_OFF') return s.status === 'HANDED_OFF_TO_SDD' || s.status === 'HANDED_OFF';
    if (activeFilter === 'DUPLICATES') return s.status === 'DUPLICATE';
    if (activeFilter === 'UPDATES') return s.status === 'UPDATED';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <i className="fas fa-inbox text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Enterprise Signal Inbox
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {signals.length} {signals.length === 1 ? 'Signal' : 'Signals'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ingested signals from Enterprise Intake (Gmail, Meet & Slack) and manual uploads
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={fetchSignals}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700/60 transition cursor-pointer"
              title="Refresh Inbox"
            >
              <i className={`fas fa-sync-alt text-[10px] ${loading ? 'animate-spin text-indigo-400' : ''}`}></i>
              <span>Refresh</span>
            </button>

            {signals.length > 0 && (
              <button
                onClick={promptClearAllSignals}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold flex items-center space-x-1 border border-rose-800/80 transition cursor-pointer"
                title="Clear All Signals"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
                <span>Clear Inbox</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Filter View:
          </span>

          {[
            { id: 'ALL', label: 'All Signals', icon: 'fas fa-layer-group' },
            { id: 'EMAIL', label: 'Email Threads', icon: 'fas fa-envelope text-rose-400' },
            { id: 'MEET', label: 'Meeting Transcripts', icon: 'fas fa-video text-emerald-400' },
            { id: 'SLACK', label: 'Slack Threads', icon: 'fab fa-slack text-purple-400' },
            { id: 'NOT_IMPORTED', label: 'Ready to Import', icon: 'fas fa-clock text-amber-400' },
            { id: 'IMPORTED', label: 'Imported', icon: 'fas fa-check-circle text-emerald-400' },
            { id: 'HANDED_OFF', label: 'Handed Off', icon: 'fas fa-external-link-alt text-purple-400' },
            { id: 'DUPLICATES', label: 'Duplicates', icon: 'fas fa-copy text-slate-400' },
            { id: 'UPDATES', label: 'Updates', icon: 'fas fa-sync text-cyan-400' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition cursor-pointer border ${
                activeFilter === f.id
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f.icon && <i className={`${f.icon} text-[10px]`}></i>}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Signal Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <i className="fas fa-spinner animate-spin text-lg mb-2"></i>
            <p>Loading enterprise signals...</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 m-4 rounded-xl">
            <i className="fas fa-inbox text-slate-600 text-3xl mb-2"></i>
            <p className="text-xs font-bold text-slate-300">No Enterprise Signals Found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Publish signals from Google Signal Intake at{' '}
              <a href="http://localhost:7070" target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                http://localhost:7070
              </a>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 min-w-[340px]">Signal ID & Candidate Title</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Source & Mode</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Sensitivity</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Statements</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Open Questions</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Received At</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[170px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSignals.map(sig => (
                  <tr key={sig.importId} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 min-w-[340px]">
                      <div className="font-bold text-slate-100 text-xs leading-snug">{sig.candidateTitle}</div>
                      <div className="text-[10px] font-mono text-indigo-400 flex items-center space-x-2 mt-1 whitespace-nowrap">
                        <span className="bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/60">{sig.importId}</span>
                        <span>•</span>
                        <span className="text-slate-400">Signal: {sig.signalId} (v{sig.version})</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <i className={`${
                          sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                            ? 'fab fa-slack text-purple-400'
                            : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                            ? 'fas fa-envelope text-rose-400'
                            : 'fas fa-video text-emerald-400'
                        }`}></i>
                        <span className="font-semibold text-slate-300">
                          {sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                            ? 'Slack'
                            : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                            ? 'Gmail'
                            : 'Meet'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{sig.connectorMode}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
                        {sig.sensitivity}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-300 font-semibold whitespace-nowrap">
                      {sig.statements?.length || 0} Confirmed
                    </td>

                    <td className="px-4 py-3 text-amber-400 font-semibold whitespace-nowrap">
                      {sig.unresolvedQuestions?.length || 0}
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap font-mono">
                      {new Date(sig.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        sig.status === 'HANDED_OFF_TO_SDD' || sig.status === 'HANDED_OFF'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : sig.status === 'IMPORTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : sig.status === 'REJECTED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : sig.status === 'DUPLICATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}>
                        {sig.status === 'HANDED_OFF_TO_SDD' ? 'HANDED OFF' : sig.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedSignal(sig)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700/60 transition cursor-pointer"
                        >
                          Preview
                        </button>

                        {sig.status !== 'IMPORTED' && sig.status !== 'HANDED_OFF_TO_SDD' && sig.status !== 'REJECTED' && (
                          <button
                            disabled={importingId === sig.importId}
                            onClick={() => handleCreateInitiative(sig.importId)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/80 text-white text-[11px] font-bold shadow-sm shadow-indigo-600/30 transition cursor-pointer flex items-center space-x-1.5"
                          >
                            {importingId === sig.importId ? (
                              <>
                                <i className="fas fa-spinner animate-spin text-[10px]"></i>
                                <span>Importing...</span>
                              </>
                            ) : (
                              <span>Import</span>
                            )}
                          </button>
                        )}

                        {sig.status !== 'REJECTED' && sig.status !== 'HANDED_OFF_TO_SDD' && (
                          <button
                            onClick={() => handleRejectSignal(sig.importId)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold border border-rose-800/80 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => promptDeleteSignal(sig)}
                          className="w-7 h-7 rounded-lg bg-slate-950/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 flex items-center justify-center transition cursor-pointer"
                          title="Delete Signal"
                        >
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signal Details Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedSignal.candidateTitle}</h3>
                <p className="text-[11px] text-slate-400">Import ID: {selectedSignal.importId}</p>
              </div>
              <button onClick={() => setSelectedSignal(null)} className="text-slate-400 hover:text-slate-200">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] mb-1">
                  Confirmed Reviewed Statements ({selectedSignal.statements?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {selectedSignal.statements?.map((st, i) => (
                    <div key={i} className="text-slate-300 border-b border-slate-900 pb-1.5 last:border-0">
                      <span className="font-mono text-[9px] text-indigo-400 bg-indigo-950/60 px-1 py-0.5 rounded mr-1.5">
                        [{st?.primaryCategory || st?.category || 'STATEMENT'}]
                      </span>
                      <span>{typeof st === 'string' ? st : (st?.text || st?.statement || st?.editedStatement || st?.originalText || '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                <p className="text-slate-400"><strong className="text-slate-200">Source:</strong> {selectedSignal.sourceSystem} ({selectedSignal.connectorMode})</p>
                <p className="text-slate-400"><strong className="text-slate-200">Reviewed By:</strong> {selectedSignal.reviewedBy} at {selectedSignal.reviewedAt}</p>
                <p className="text-slate-400"><strong className="text-slate-200">Content Hash:</strong> <code className="text-indigo-400">{selectedSignal.contentHash}</code></p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <a
                href={selectedSignal.sourceDeepLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <i className="fas fa-external-link-alt text-[10px]"></i>
                <span>Open Original Google Source</span>
              </a>

              <div className="space-x-2">
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                {selectedSignal.status !== 'IMPORTED' && (
                  <button
                    disabled={importingId === selectedSignal.importId}
                    onClick={() => {
                      handleCreateInitiative(selectedSignal.importId);
                      setSelectedSignal(null);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/80 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    {importingId === selectedSignal.importId ? (
                      <>
                        <i className="fas fa-spinner animate-spin text-[10px]"></i>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <span>Import into Discovery</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <i className="fas fa-exclamation-triangle text-base"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">
                  {confirmModal.type === 'ALL' ? 'Clear All Enterprise Signals?' : 'Delete Enterprise Signal?'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {confirmModal.type === 'ALL'
                    ? 'Are you sure you want to permanently delete ALL ingested signals from the Enterprise Signal Inbox? This action cannot be undone.'
                    : `Are you sure you want to delete signal "${confirmModal.candidateTitle || confirmModal.importId}"? This action cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => setConfirmModal({ show: false, type: null, importId: null, candidateTitle: '' })}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const type = confirmModal.type;
                  const importId = confirmModal.importId;
                  setConfirmModal({ show: false, type: null, importId: null, candidateTitle: '' });
                  if (type === 'ALL') {
                    await executeClearAllSignals();
                  } else if (importId) {
                    await executeDeleteSignal(importId);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center space-x-1.5"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
                <span>{confirmModal.type === 'ALL' ? 'Yes, Clear All' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
