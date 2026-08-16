import React, { useState } from 'react';
import { evalService } from '../services/evalService';

export default function EvalHarnessView() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'datasets' | 'conformance' | 'safety' | 'drift'
  const [leaderboard] = useState(evalService.getModelLeaderboard());
  const [datasets] = useState(evalService.getGoldenDatasets());
  const [conformanceReport] = useState(evalService.getConformanceReport());
  const [safetyTestResult, setSafetyTestResult] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleRunSafetyTest = () => {
    setIsRunningTest(true);
    setTimeout(() => {
      const res = evalService.runSafetyTest('gemini-2.5-pro');
      setSafetyTestResult(res);
      setIsRunningTest(false);
    }, 800);
  };

  return (
    <div className="relative p-6 h-full flex flex-col space-y-5 custom-scroll overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <i className="fas fa-flask text-purple-400"></i>
            <span>Trust, Evaluation & Quality Control Center</span>
          </h1>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <i className="fas fa-info-circle text-indigo-400"></i>
            <span>Layer Info & Telemetry</span>
          </button>
        </div>

        <button
          onClick={handleRunSafetyTest}
          disabled={isRunningTest}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg border border-purple-500/30 transition flex items-center space-x-2 cursor-pointer"
        >
          {isRunningTest ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-[#a855f7] fa-vial"></i>}
          <span>Run Adversarial Safety Test</span>
        </button>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-microscope"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Suites</p>
            <p className="text-lg font-black text-white font-mono">12 <span className="text-xs font-normal text-slate-400">Active Suites</span></p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-award"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spec Conformance</p>
            <p className="text-lg font-black text-emerald-400 font-mono">98.6% <span className="text-xs font-normal text-slate-400">Matched</span></p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-shield-virus"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Test Pass Rate</p>
            <p className="text-lg font-black text-white font-mono">100.0% <span className="text-xs font-normal text-emerald-400">Clean</span></p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-chart-line"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Quality Grade</p>
            <p className="text-lg font-black text-amber-400 font-mono">GRADE A+</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 space-x-1">
        {[
          { id: 'leaderboard', label: '🧪 Model Benchmark Leaderboard' },
          { id: 'datasets', label: '🏆 Golden Datasets' },
          { id: 'conformance', label: '🎯 Spec Conformance Agent' },
          { id: 'safety', label: '🛡️ Adversarial Safety Tests' },
          { id: 'drift', label: '📈 Drift & Regression Monitor' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
              activeTab === t.id
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="overflow-auto flex-1 custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Model Name & ID</th>
                  <th className="p-3.5">Provider / Gateway</th>
                  <th className="p-3.5 text-center">Correctness</th>
                  <th className="p-3.5 text-center">Groundedness</th>
                  <th className="p-3.5 text-center">Safety Score</th>
                  <th className="p-3.5 text-right">Avg Latency</th>
                  <th className="p-3.5 text-right">Cost / 1k Tokens</th>
                  <th className="p-3.5 text-right">Promotion Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {leaderboard.map((row) => (
                  <tr key={row.modelId} className="hover:bg-slate-900/50 transition">
                    <td className="p-3.5 font-bold text-slate-400">#{row.rank}</td>
                    <td className="p-3.5">
                      <div className="font-sans font-bold text-indigo-400">{row.modelName}</div>
                      <div className="text-[10px] text-slate-500">{row.modelId}</div>
                    </td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px]">
                        {row.provider}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-emerald-400 font-bold">{row.correctnessScore}%</td>
                    <td className="p-3.5 text-center text-indigo-300 font-bold">{row.groundednessScore}%</td>
                    <td className="p-3.5 text-center text-purple-300 font-bold">{row.safetyScore}%</td>
                    <td className="p-3.5 text-right text-slate-300">{row.avgLatencyMs} ms</td>
                    <td className="p-3.5 text-right text-emerald-400">{row.costPer1kTokens}</td>
                    <td className="p-3.5 text-right font-sans">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'PROMOTED'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                          : row.status === 'SECONDARY_FALLBACK'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Golden Datasets */}
      {activeTab === 'datasets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {datasets.map(ds => (
            <div key={ds.datasetId} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-2">
                <div>
                  <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold rounded">
                    {ds.datasetId}
                  </span>
                  <h3 className="text-xs font-bold text-white mt-1">{ds.name}</h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">{ds.passRate}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p>Target Agent: <span className="text-indigo-300 font-mono">{ds.agent}</span></p>
                <p>Benchmark Cases: <span className="text-white font-bold">{ds.caseCount}</span> (with {ds.edgeCases} edge cases)</p>
                <p className="text-[10px] text-slate-500">Last Baseline Sync: {ds.lastUpdated}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Spec Conformance Agent */}
      {activeTab === 'conformance' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center">
              <i className="fas fa-bullseye text-emerald-400 mr-2"></i> Spec-to-Output Conformance Inspector (TEQ-FR-012)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Clause-by-clause alignment verification between approved specification baseline (<span className="font-mono text-indigo-300">{conformanceReport.specId}</span>) and downstream artifacts.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">Conformance Score: {conformanceReport.conformanceScore}%</span>
              <span className="text-slate-400">{conformanceReport.matchedClauses} of {conformanceReport.totalClausesChecked} Clauses Matched</span>
            </div>

            {conformanceReport.deviations.map((dev, i) => (
              <div key={i} className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-amber-400 font-bold">{dev.clauseId}: {dev.specTitle}</span>
                  <span className="text-slate-500">Target Artifact: {dev.artifact}</span>
                </div>
                <p className="text-slate-300">{dev.issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Adversarial Safety Tests */}
      {activeTab === 'safety' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center">
                <i className="fas fa-shield-virus text-purple-400 mr-2"></i> OWASP & SDLC Adversarial Safety Suite (TEQ-FR-010)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Automated vulnerability checks for prompt injection, secret leakage, role confusion, and insecure code generation.
              </p>
            </div>
            <button
              onClick={handleRunSafetyTest}
              disabled={isRunningTest}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {isRunningTest ? 'Executing...' : 'Run Test Suite'}
            </button>
          </div>

          {safetyTestResult && (
            <div className="space-y-2 font-mono text-xs">
              {safetyTestResult.results.map((r, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300 font-sans font-medium">{r.testName}</span>
                  <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800 rounded font-bold">
                    {r.status} ({r.score})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Drift Monitor */}
      {activeTab === 'drift' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 shadow-lg">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Output Groundedness Drift</p>
            <p className="text-3xl font-black text-white font-mono">0.02% <span className="text-xs text-emerald-400 font-normal">Stable</span></p>
            <p className="text-[10px] text-slate-400">Zero degradation detected over 1,400 runs</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 shadow-lg">
            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Latency Budget Compliance</p>
            <p className="text-3xl font-black text-purple-400 font-mono">820 ms <span className="text-xs text-slate-400 font-normal">Target: 2000ms</span></p>
            <p className="text-[10px] text-slate-400">Well within enterprise SLA limits</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 shadow-lg">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cost Efficiency</p>
            <p className="text-3xl font-black text-emerald-400 font-mono">$0.00 <span className="text-xs text-slate-400 font-normal">Self-Hosted</span></p>
            <p className="text-[10px] text-slate-400">100% Routed via Open-Source LiteLLM Gateway</p>
          </div>
        </div>
      )}

      {/* Target State Layer 3 Info & Telemetry Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scroll text-left">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Target State Layer 3 of 6
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Document ID: SDD-REQ-L3-TEQ</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5 flex items-center space-x-2.5">
                  <i className="fas fa-flask text-purple-400"></i>
                  <span>Trust, Evaluation & Quality Layer Control Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Proves that agents, models, and generated SDLC outputs are correct, grounded, safe, and conformant for enterprise use.
                </p>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer text-lg p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Architecture Overview */}
            <div className="space-y-3 text-xs text-slate-300 font-sans">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-purple-400 uppercase text-[11px]">Layer 3 Foundational Objectives</h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li><strong>AI Eval Harness (`TEQ-FR-001`):</strong> Runs repeatable evaluations for models and agents using approved benchmark datasets.</li>
                  <li><strong>Golden Datasets (`TEQ-FR-002`):</strong> Maintains representative normal, edge, and negative case benchmarks.</li>
                  <li><strong>Spec Conformance Agent (`TEQ-FR-012`):</strong> Validates spec-to-output clause alignment to prevent hallucinations.</li>
                  <li><strong>Adversarial Safety Tests (`TEQ-FR-010`):</strong> Executes prompt injection and secret leakage safety test suites.</li>
                  <li><strong>Drift & Regression Monitor (`TEQ-FR-019`):</strong> Tracks groundedness, latency budgets, and quality drift.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg"
              >
                Close Info Modal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
