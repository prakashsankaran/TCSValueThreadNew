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
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F4F1FF] border border-[#E4DCFF] flex items-center justify-center text-[#7157F5] shrink-0 shadow-2xs">
              <i className="fas fa-inbox text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[#17181C] flex items-center gap-2">
                Enterprise Signal Inbox
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F4F1FF] text-[#5F46D8] border border-[#E4DCFF] font-bold">
                  {signals.length} {signals.length === 1 ? 'Signal' : 'Signals'}
                </span>
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Ingested signals from Enterprise Intake (Gmail, Meet & Slack) and manual uploads
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={fetchSignals}
              className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-[#F8F8F7] text-[#344054] text-xs font-semibold flex items-center space-x-1.5 border border-[#ECEEF1] shadow-2xs transition cursor-pointer"
              title="Refresh Inbox"
            >
              <i className={`fas fa-sync-alt text-[10px] text-[#7157F5] ${loading ? 'animate-spin' : ''}`}></i>
              <span>Refresh</span>
            </button>

            {signals.length > 0 && (
              <button
                onClick={promptClearAllSignals}
                className="px-3 py-1.5 rounded-[8px] bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#D92D20] text-xs font-semibold flex items-center space-x-1 border border-[#FECDCA] shadow-2xs transition cursor-pointer"
                title="Clear All Signals"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
                <span>Clear Inbox</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pt-3 border-t border-[#ECEEF1]">
          <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider shrink-0 mr-1">
            Filter View:
          </span>

          {[
            { id: 'ALL', label: 'All Signals', icon: 'fas fa-layer-group' },
            { id: 'EMAIL', label: 'Email Threads', icon: 'fas fa-envelope text-rose-500' },
            { id: 'MEET', label: 'Meeting Transcripts', icon: 'fas fa-video text-emerald-600' },
            { id: 'SLACK', label: 'Slack Threads', icon: 'fab fa-slack text-[#7157F5]' },
            { id: 'NOT_IMPORTED', label: 'Ready to Import', icon: 'fas fa-clock text-amber-600' },
            { id: 'IMPORTED', label: 'Imported', icon: 'fas fa-check-circle text-emerald-600' },
            { id: 'HANDED_OFF', label: 'Handed Off', icon: 'fas fa-external-link-alt text-[#7157F5]' },
            { id: 'DUPLICATES', label: 'Duplicates', icon: 'fas fa-copy text-[#667085]' },
            { id: 'UPDATES', label: 'Updates', icon: 'fas fa-sync text-cyan-600' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition cursor-pointer border shadow-2xs ${
                activeFilter === f.id
                  ? 'bg-[#7157F5] text-white border-[#7157F5]'
                  : 'bg-white text-[#667085] border-[#ECEEF1] hover:text-[#17181C] hover:bg-[#F8F8F7]'
              }`}
            >
              {f.icon && <i className={`${f.icon} text-[10px]`}></i>}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Signal Table */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="text-center py-12 text-[#667085] text-xs">
            <i className="fas fa-circle-notch animate-spin text-lg mb-2 text-[#7157F5]"></i>
            <p className="font-medium">Loading enterprise signals...</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#ECEEF1] m-5 rounded-[14px] bg-[#FAFAF9]">
            <div className="w-12 h-12 rounded-full bg-[#F4F1FF] border border-[#E4DCFF] flex items-center justify-center text-[#7157F5] mx-auto mb-2 text-lg">
              <i className="fas fa-inbox"></i>
            </div>
            <p className="text-xs font-bold text-[#17181C]">No Enterprise Signals Found</p>
            <p className="text-[11px] text-[#667085] mt-1">
              Publish signals from Google Signal Intake at{' '}
              <a href="http://localhost:7070" target="_blank" rel="noreferrer" className="text-[#7157F5] font-semibold underline">
                http://localhost:7070
              </a>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="bg-[#FAFAF9] text-[11px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#ECEEF1]">
                <tr>
                  <th className="px-4 py-3 min-w-[340px]">Signal ID & Candidate Title</th>
                  <th className="px-4 py-3 whitespace-nowrap">Source & Mode</th>
                  <th className="px-4 py-3 whitespace-nowrap">Sensitivity</th>
                  <th className="px-4 py-3 whitespace-nowrap">Statements</th>
                  <th className="px-4 py-3 whitespace-nowrap">Open Questions</th>
                  <th className="px-4 py-3 whitespace-nowrap">Received At</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap min-w-[170px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1]">
                {filteredSignals.map(sig => (
                  <tr key={sig.importId} className="hover:bg-[#F8F8F7] transition">
                    <td className="px-4 py-3.5 min-w-[340px]">
                      <div className="font-bold text-[#17181C] text-xs leading-snug">{sig.candidateTitle}</div>
                      <div className="text-[10px] font-mono text-[#7157F5] flex items-center space-x-2 mt-1 whitespace-nowrap">
                        <span className="bg-[#F4F1FF] px-1.5 py-0.5 rounded-[4px] border border-[#E4DCFF] font-semibold">{sig.importId}</span>
                        <span className="text-[#98A2B3]">•</span>
                        <span className="text-[#667085]">Signal: {sig.signalId} (v{sig.version})</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <i className={`${
                          sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                            ? 'fab fa-slack text-[#7157F5]'
                            : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                            ? 'fas fa-envelope text-rose-500'
                            : 'fas fa-video text-emerald-600'
                        }`}></i>
                        <span className="font-semibold text-[#17181C]">
                          {sig.sourceType?.includes('SLACK') || sig.sourceSystem === 'SLACK'
                            ? 'Slack'
                            : sig.sourceType === 'GMAIL_THREAD' || sig.sourceSystem === 'GOOGLE_GMAIL'
                            ? 'Gmail'
                            : 'Meet'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#98A2B3] uppercase font-mono mt-0.5">{sig.connectorMode}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        sig.sensitivity === 'CONFIDENTIAL' || sig.sensitivity === 'HIGH'
                          ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                          : 'bg-[#F8F8F7] text-[#344054] border-[#ECEEF1]'
                      }`}>
                        {sig.sensitivity || 'INTERNAL'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#17181C] font-semibold whitespace-nowrap">
                      {sig.statements?.length || 0} Confirmed
                    </td>

                    <td className="px-4 py-3.5 text-amber-600 font-semibold whitespace-nowrap">
                      {sig.unresolvedQuestions?.length || 0}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-[#667085] whitespace-nowrap font-mono">
                      {new Date(sig.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        sig.status === 'HANDED_OFF_TO_SDD' || sig.status === 'HANDED_OFF'
                          ? 'bg-[#F4F1FF] text-[#5F46D8] border-[#E4DCFF]'
                          : sig.status === 'IMPORTED'
                          ? 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]'
                          : sig.status === 'REJECTED'
                          ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                          : sig.status === 'DUPLICATE'
                          ? 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]'
                          : 'bg-[#F4F1FF] text-[#5F46D8] border-[#E4DCFF]'
                      }`}>
                        {sig.status === 'HANDED_OFF_TO_SDD' ? 'HANDED OFF' : sig.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedSignal(sig)}
                          className="px-2.5 py-1 rounded-[6px] bg-white hover:bg-[#F8F8F7] text-[#344054] text-[11px] font-semibold border border-[#ECEEF1] shadow-2xs transition cursor-pointer"
                        >
                          Preview
                        </button>

                        {sig.status !== 'IMPORTED' && sig.status !== 'HANDED_OFF_TO_SDD' && sig.status !== 'REJECTED' && (
                          <button
                            disabled={importingId === sig.importId}
                            onClick={() => handleCreateInitiative(sig.importId)}
                            className="px-3 py-1 rounded-[6px] bg-[#7157F5] hover:bg-[#5E43E2] disabled:opacity-50 text-white text-[11px] font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
                          >
                            {importingId === sig.importId ? (
                              <>
                                <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
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
                            className="px-2.5 py-1 rounded-[6px] bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#D92D20] text-[11px] font-semibold border border-[#FECDCA] shadow-2xs transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => promptDeleteSignal(sig)}
                          className="w-7 h-7 rounded-[6px] bg-white hover:bg-[#FEF3F2] text-[#98A2B3] hover:text-[#D92D20] border border-[#ECEEF1] hover:border-[#FECDCA] flex items-center justify-center transition cursor-pointer shadow-2xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#ECEEF1] rounded-[18px] max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECEEF1] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#17181C]">{selectedSignal.candidateTitle}</h3>
                <p className="text-[11px] text-[#667085] font-mono mt-0.5">Import ID: {selectedSignal.importId}</p>
              </div>
              <button onClick={() => setSelectedSignal(null)} className="text-[#98A2B3] hover:text-[#17181C] cursor-pointer">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-[#7157F5] uppercase tracking-wider text-[10px] mb-1.5">
                  Confirmed Reviewed Statements ({selectedSignal.statements?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto bg-[#FAFAF9] p-3 rounded-[12px] border border-[#ECEEF1] custom-scroll">
                  {selectedSignal.statements?.map((st, i) => (
                    <div key={i} className="text-[#344054] border-b border-[#ECEEF1] pb-1.5 last:border-0">
                      <span className="font-mono text-[9px] text-[#5F46D8] bg-[#F4F1FF] border border-[#E4DCFF] px-1 py-0.5 rounded mr-1.5 font-bold">
                        [{st?.primaryCategory || st?.category || 'STATEMENT'}]
                      </span>
                      <span>{typeof st === 'string' ? st : (st?.text || st?.statement || st?.editedStatement || st?.originalText || '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FAFAF9] p-3.5 rounded-[12px] border border-[#ECEEF1] text-[11px] space-y-1">
                <p className="text-[#667085]"><strong className="text-[#17181C]">Source:</strong> {selectedSignal.sourceSystem} ({selectedSignal.connectorMode})</p>
                <p className="text-[#667085]"><strong className="text-[#17181C]">Reviewed By:</strong> {selectedSignal.reviewedBy} at {selectedSignal.reviewedAt}</p>
                <p className="text-[#667085]"><strong className="text-[#17181C]">Content Hash:</strong> <code className="text-[#7157F5] font-mono">{selectedSignal.contentHash}</code></p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#ECEEF1]">
              <a
                href={selectedSignal.sourceDeepLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7157F5] hover:underline font-semibold flex items-center space-x-1"
              >
                <i className="fas fa-external-link-alt text-[10px]"></i>
                <span>Open Original Google Source</span>
              </a>

              <div className="space-x-2">
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#ECEEF1] hover:bg-[#F8F8F7] text-[#344054] text-xs font-semibold shadow-2xs cursor-pointer"
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
                    className="px-4 py-1.5 rounded-[8px] bg-[#7157F5] hover:bg-[#5E43E2] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center space-x-1.5 inline-flex"
                  >
                    {importingId === selectedSignal.importId ? (
                      <>
                        <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#ECEEF1] rounded-[18px] max-w-md w-full p-6 space-y-4 shadow-xl relative">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center text-[#D92D20] shrink-0 mt-0.5">
                <i className="fas fa-exclamation-triangle text-base"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#17181C]">
                  {confirmModal.type === 'ALL' ? 'Clear All Enterprise Signals?' : 'Delete Enterprise Signal?'}
                </h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  {confirmModal.type === 'ALL'
                    ? 'Are you sure you want to permanently delete ALL ingested signals from the Enterprise Signal Inbox? This action cannot be undone.'
                    : `Are you sure you want to delete signal "${confirmModal.candidateTitle || confirmModal.importId}"? This action cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#ECEEF1]">
              <button
                onClick={() => setConfirmModal({ show: false, type: null, importId: null, candidateTitle: '' })}
                className="px-4 py-2 rounded-[8px] bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] text-[#344054] text-xs font-semibold shadow-2xs transition cursor-pointer"
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
                className="px-4 py-2 rounded-[8px] bg-[#D92D20] hover:bg-[#B42318] text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
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
