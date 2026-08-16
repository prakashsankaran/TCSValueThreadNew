import React, { useState } from 'react';
import { evidenceService } from '../services/evidenceService';

export function ApprovalGateModal({ isOpen, onClose, gateName = 'STAGE_GATE_3_ARCHITECTURE', artifactTitle = 'Functional Specification Baseline v1.0' }) {
  const [outcome, setOutcome] = useState('APPROVE'); // 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT'
  const [rationale, setRationale] = useState('');
  const [conditions, setConditions] = useState('');
  const [dissentActor, setDissentActor] = useState('');
  const [dissentNote, setDissentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      evidenceService.logDecision({
        type: gateName,
        options: ['Approve Stage Gate', 'Request Changes / Reject'],
        recommendation: 'Approve Stage Gate',
        selectedOption: outcome,
        rationale: rationale || 'Gate approved in compliance with SDD governance standards.',
        approvers: [localStorage.getItem('activeUser') || 'Lead Architect [LA]'],
        dissent: dissentNote ? { actor: dissentActor || 'Reviewer', note: dissentNote } : null,
        conditions: conditions || ''
      });

      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
      <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-left">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
              Governance Approval Gate (GS-FR-006)
            </span>
            <h3 className="text-base font-bold text-white mt-1 flex items-center space-x-2">
              <i className="fas fa-gavel text-amber-400"></i>
              <span>{gateName}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Governed Artifact Baseline</label>
            <input
              type="text"
              readOnly
              value={artifactTitle}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Decision Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="APPROVE">Approve Stage Gate</option>
              <option value="APPROVE_WITH_CONDITIONS">Approve with Conditions</option>
              <option value="REJECT">Reject / Request Revisions</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Approval Rationale & Rationale Notes</label>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Enter technical rationale for this decision..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {outcome === 'APPROVE_WITH_CONDITIONS' && (
            <div>
              <label className="block text-amber-400 font-bold mb-1">Gate Execution Conditions</label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Load tests must pass before production deployment"
                className="w-full bg-slate-950 border border-amber-800/80 rounded-xl px-3 py-2 text-amber-200"
              />
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-3 space-y-2">
            <label className="block text-rose-400 font-bold text-[11px] flex items-center">
              <i className="fas fa-exclamation-circle mr-1.5"></i> Preserved Dissent Record (Optional - GS-FR-006)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={dissentActor}
                onChange={(e) => setDissentActor(e.target.value)}
                placeholder="Dissenting Actor (e.g. Senior DBA)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300"
              />
              <input
                type="text"
                value={dissentNote}
                onChange={(e) => setDissentNote(e.target.value)}
                placeholder="Dissenting Concern / Opinion"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg border border-indigo-500/30 cursor-pointer flex items-center space-x-2"
            >
              {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-check-circle"></i>}
              <span>Record Governance Decision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
