import React, { useState, useEffect } from 'react';
import { specControlService } from '../services/specControlService';
import { vectorService } from '../services/vectorService';
import ArtifactLineageTree from '../components/ArtifactLineageTree';
import { formatFSDDocument } from '../utils/fsdFormatter';

export default function SpecControlView() {
  const [activeTab, setActiveTab] = useState('baselines'); // 'baselines' | 'artifacts' | 'graph' | 'impact' | 'regen' | 'rules'
  const [specBaselines, setSpecBaselines] = useState([]);
  const [artifactsList, setArtifactsList] = useState([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [artifactStageFilter, setArtifactStageFilter] = useState('ALL');
  const [artifactStatusFilter, setArtifactStatusFilter] = useState('ALL');
  const [artifactSearchQuery, setArtifactSearchQuery] = useState('');
  const [selectedArtifactModal, setSelectedArtifactModal] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('formatted'); // 'formatted' | 'raw'

  const [artifactGraph] = useState(specControlService.getArtifactGraph());
  const [domainRules] = useState(specControlService.getDomainRules());
  const [impactReport, setImpactReport] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const loadArtifacts = async () => {
    setIsLoadingArtifacts(true);
    try {
      const activeProj = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      const res = await fetch(`http://localhost:7001/api/artefacts?project=${encodeURIComponent(activeProj)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.artefacts)) {
        setArtifactsList(data.artefacts);
      }
    } catch (e) {
      console.warn('Failed to fetch generated artifacts:', e);
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  useEffect(() => {
    const loadSpecBaselines = async () => {
      const activeProj = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      const registeredBaselines = await specControlService.getSpecBaselinesAsync(activeProj);
      setSpecBaselines(registeredBaselines);
    };

    loadSpecBaselines();
    loadArtifacts();

    const syncActiveProject = () => {
      loadSpecBaselines();
      loadArtifacts();
    };
    window.addEventListener('activeProjectChanged', syncActiveProject);
    window.addEventListener('storage', syncActiveProject);
    window.addEventListener('specDriftUpdated', syncActiveProject);
    return () => {
      window.removeEventListener('activeProjectChanged', syncActiveProject);
      window.removeEventListener('storage', syncActiveProject);
      window.removeEventListener('specDriftUpdated', syncActiveProject);
    };
  }, []);

  const handleSimulateImpact = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = specControlService.simulateChangeImpact('SPEC-001', 'REQ-FSD-004');
      setImpactReport(res);
      setIsSimulating(false);
    }, 700);
  };

  const getParentArtefactId = (art) => {
    // 1. Explicit metadata or content parent specification ID
    if (art.metadata?.parentArtefactId && art.metadata.parentArtefactId !== 'SPEC-VendorManagement') return art.metadata.parentArtefactId;
    if (art.metadata?.specId && art.metadata.specId !== 'SPEC-VendorManagement') return art.metadata.specId;
    if (art.metadata?.requirementId && art.metadata.requirementId !== 'SPEC-VendorManagement') return art.metadata.requirementId;
    if (art.content?.requirementId) return art.content.requirementId;
    if (art.content?.specId) return art.content.specId;
    if (art.parentId) return art.parentId;
    if (art.parentSpecId) return art.parentSpecId;

    // 2. Extract requirement/spec ID from artifact ID (e.g. US-REQ001 or US-REQ969 -> SPEC-REQ001 / SPEC-REQ969)
    const rawId = art.artefactId || art.id || '';
    const matchId = rawId.match(/REQ[\w\d]+/i);
    if (matchId) {
      return `SPEC-${matchId[0].toUpperCase()}`;
    }

    // 3. Stage-based parent artifact resolution
    const stage = art.stageKey;
    const project = art.projectId || localStorage.getItem('activeProject') || 'Vendor Management';

    if (stage === 'user-stories' || stage === 'ux-wireframe' || stage === 'tech-architecture' || stage === 'database-design' || stage === 'test-cases') {
      const fsdArt = artifactsList.find(a => a.stageKey === 'functional-spec' && (a.projectId === project || !project));
      if (fsdArt) {
        return fsdArt.artefactId || fsdArt.id;
      }
    }

    // 4. Fallback to active spec baseline ID in the current project
    const activeBaseline = specBaselines.find(s => (s.projectId === project || !s.projectId) && (s.isBaselineVersion || s.status === 'BASELINED_APPROVED'));
    if (activeBaseline && activeBaseline.specId && activeBaseline.specId !== 'SPEC-VendorManagement') {
      return activeBaseline.specId.startsWith('SPEC-') ? activeBaseline.specId : `SPEC-${activeBaseline.specId}`;
    }

    return 'SPEC-REQ001';
  };

  const getParentArtefactVersion = (art) => {
    if (art.metadata?.parentArtefactVersion) return art.metadata.parentArtefactVersion;
    if (art.metadata?.parentVersion) return art.metadata.parentVersion;
    if (art.parentVersion) return art.parentVersion;

    const parentId = getParentArtefactId(art);

    if (parentId.startsWith('SPEC-') || parentId.startsWith('REQ-')) {
      let parentSpec = specBaselines.find(s => 
        (s.specId === parentId || s.requirementId === parentId) && 
        s.version === art.version
      );
      if (!parentSpec) {
        parentSpec = specBaselines.find(s => 
          s.specId === parentId || 
          s.requirementId === parentId || 
          (s.projectId === art.projectId && (s.isBaselineVersion || s.status === 'BASELINED_APPROVED'))
        );
      }
      if (parentSpec && parentSpec.version) {
        return parentSpec.version;
      }
      return 'v1.0.0';
    }

    const parentArt = artifactsList.find(a => 
      (a.artefactId === parentId || a.id === parentId) && 
      (a.projectId === art.projectId || !art.projectId)
    );

    if (parentArt && parentArt.version) {
      return parentArt.version;
    }

    return 'v1.0.0';
  };

  const getArtefactStaleness = (art) => {
    const parentId = getParentArtefactId(art);
    const artTime = new Date(art.updatedAt || art.createdAt || 0).getTime();
    const isSuperseeded = art.status === 'SUPERSEDED';

    if (isSuperseeded) {
      return { 
        isStale: false, 
        isSuperseded: true,
        label: 'SUPERSEDED', 
        reason: `Archived superseded version (Parent: ${parentId})` 
      };
    }

    if (parentId.startsWith('SPEC-') || parentId.startsWith('REQ-')) {
      const parentSpec = specBaselines.find(s => 
        s.specId === parentId || 
        s.requirementId === parentId ||
        (s.projectId === art.projectId && s.isBaselineVersion)
      );
      if (parentSpec) {
        const parentSpecVer = parentSpec.version || 'v1.0.0';
        const generatedFromVer = art.metadata?.parentArtefactVersion || art.metadata?.parentVersion || art.parentVersion || 'v1.0.0';
        
        const specVerNum = parseInt(parentSpecVer.replace(/\D/g, ''), 10) || 1;
        const genVerNum = parseInt(generatedFromVer.replace(/\D/g, ''), 10) || 1;
        
        if (specVerNum > genVerNum) {
          return { 
            isStale: true, 
            label: 'STALE', 
            reason: `Parent Spec ${parentId} updated to ${parentSpec.version} (Generated from ${generatedFromVer})` 
          };
        }
      }
      return { isStale: false, label: 'FRESH', reason: 'Synchronized with parent spec baseline' };
    }

    const parentArtifact = artifactsList.find(a => 
      (a.artefactId === parentId || a.id === parentId) && 
      (a.projectId === art.projectId || !art.projectId)
    );

    if (parentArtifact) {
      if (parentArtifact.status === 'SUPERSEDED') {
        const latestParent = artifactsList.find(a => 
          a.artefactId === parentArtifact.artefactId && 
          a.status === 'LATEST'
        );
        return { 
          isStale: true, 
          label: 'STALE', 
          reason: `Parent ${parentId} was regenerated to ${latestParent ? latestParent.version : 'newer version'}` 
        };
      }

      const parentTime = new Date(parentArtifact.updatedAt || parentArtifact.createdAt || 0).getTime();
      if (parentTime > artTime + 5000) {
        return { 
          isStale: true, 
          label: 'STALE', 
          reason: `Parent ${parentId} was updated after this artifact` 
        };
      }
    }

    return { isStale: false, label: 'FRESH', reason: 'Up-to-date with parent artifact' };
  };

  const filteredArtifacts = artifactsList.filter(art => {
    if (artifactStageFilter !== 'ALL' && art.stageKey !== artifactStageFilter) {
      return false;
    }
    if (artifactStatusFilter === 'BASELINE' && art.status !== 'LATEST') {
      return false;
    }
    if (artifactStatusFilter === 'SUPERSEDED' && art.status !== 'SUPERSEDED') {
      return false;
    }
    if (artifactStatusFilter === 'STALE' && !getArtefactStaleness(art).isStale) {
      return false;
    }
    if (artifactStatusFilter === 'FRESH' && getArtefactStaleness(art).isStale) {
      return false;
    }
    if (artifactSearchQuery.trim()) {
      const q = artifactSearchQuery.toLowerCase();
      const matchId = (art.artefactId || art.id || '').toLowerCase().includes(q);
      const matchTitle = (art.title || '').toLowerCase().includes(q);
      const matchVersion = (art.version || '').toLowerCase().includes(q);
      const matchStage = (art.stageKey || '').toLowerCase().includes(q);
      const matchParent = getParentArtefactId(art).toLowerCase().includes(q);
      const stalenessLabel = getArtefactStaleness(art).label.toLowerCase();
      if (!matchId && !matchTitle && !matchVersion && !matchStage && !matchParent && !stalenessLabel.includes(q)) return false;
    }
    return true;
  });

  const formatArtifactContentToHtml = (artifact) => {
    if (!artifact) return '';
    const content = artifact.content;

    // 1. If already full HTML document
    if (typeof content === 'string' && (content.includes('<!DOCTYPE html>') || content.includes('<html'))) {
      return content;
    }

    // 2. If User Stories backlog object or array
    if (artifact.stageKey === 'user-stories' || (content && typeof content === 'object' && (content.stories || content.spreadsheet))) {
      const stories = Array.isArray(content?.stories) ? content.stories : (Array.isArray(content?.spreadsheet) ? content.spreadsheet : []);
      if (stories.length > 0) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #070a13; color: #cbd5e1; padding: 24px; margin: 0; line-height: 1.6; }
    .header-banner { background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15)); border: 1px solid rgba(99, 102, 241, 0.35); padding: 20px; border-radius: 12px; margin-bottom: 24px; }
    h1 { color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 800; }
    .meta { font-size: 11px; color: #94a3b8; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #0f172a; border-bottom: 1px solid #334155; padding: 12px 10px; text-align: left; color: #94a3b8; text-transform: uppercase; font-size: 10px; font-weight: 700; }
    td { border-bottom: 1px solid #1e293b; padding: 12px 10px; vertical-align: top; }
    tr:hover { background-color: rgba(30, 41, 59, 0.4); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; font-family: monospace; text-transform: uppercase; }
    .badge-high { background: rgba(225, 29, 72, 0.2); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.4); }
    .badge-medium { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-low { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
    .story-id { color: #818cf8; font-weight: bold; font-family: monospace; }
    .criteria-list { margin: 6px 0 0 0; padding-left: 16px; color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>${artifact.title || 'User Stories Backlog'}</h1>
    <div class="meta">Project: ${artifact.projectId || 'sdd-enterprise-dev'} | Version: ${artifact.version || 'v1.0.0'} | Total Stories: ${stories.length}</div>
  </div>
  <table>
    <thead>
      <tr><th>ID</th><th>User Story Title & Intent</th><th>Priority</th><th>Points</th><th>Acceptance Criteria & Tech Notes</th></tr>
    </thead>
    <tbody>
      ${stories.map(s => `
        <tr>
          <td class="story-id">${s.id || s.issueType || 'US-100'}</td>
          <td>
            <strong style="color:#ffffff; font-size:13px">${s.title || s.summary || 'User Story'}</strong>
            <p style="margin:4px 0 0 0; font-size:11px; color:#cbd5e1">${s.description || `As a ${s.asA || 'User'}, I want to ${s.iWantTo || 'perform action'} so that ${s.soThat || 'achieve goal'}.`}</p>
          </td>
          <td><span class="badge ${s.priority === 'High' ? 'badge-high' : s.priority === 'Medium' ? 'badge-medium' : 'badge-low'}">${s.priority || 'High'}</span></td>
          <td style="font-weight:bold; color:#818cf8; font-family:monospace">${s.storyPoints || s.points || 3} pts</td>
          <td>
            ${Array.isArray(s.criteria) ? `<ul class="criteria-list">${s.criteria.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
            ${s.techNotes ? `<div style="font-size:10px; color:#64748b; margin-top:6px; font-family:monospace">⚙️ ${s.techNotes}</div>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
      }
    }

    // 3. Fallback to formatFSDDocument for FSD, Markdown & standard SDLC JSON
    return formatFSDDocument(content);
  };

  return (
    <div className="relative p-6 h-full flex flex-col space-y-5 custom-scroll overflow-y-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 space-x-1">
        {[
          { id: 'baselines', label: '📚 Spec Registry & Baselines' },
          { id: 'artifacts', label: '📦 Artifact Registry' },
          { id: 'graph', label: '🕸️ Artifact Lineage Graph' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-2 ${
              activeTab === t.id
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Spec Registry & Baselines */}
      {activeTab === 'baselines' && (
        <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="overflow-auto flex-1 custom-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0">
                <tr>
                  <th className="p-3.5">Spec ID</th>
                  <th className="p-3.5">Specification Title</th>
                  <th className="p-3.5">Project ID</th>
                  <th className="p-3.5">Requirement ID</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5 text-center">Quality Score</th>
                  <th className="p-3.5 text-center">Lint Status</th>
                  <th className="p-3.5 text-center">State</th>
                  <th className="p-3.5 text-right">Baseline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {specBaselines.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-500 font-sans">
                      <i className="fas fa-sitemap text-3xl mb-2 opacity-40 block"></i>
                      <p className="font-semibold text-slate-400">No Specification Baselines Stored in Vector DB</p>
                      <p className="text-xs text-slate-500 mt-1">Generate a new spec via Requirement to Spec agent and click "Save & Sync" to baseline your specifications.</p>
                    </td>
                  </tr>
                ) : (
                  specBaselines.map((spec, index) => {
                    const isBaseline = spec.isBaselineVersion || spec.status === 'BASELINED_APPROVED';
                    const driftStatus = specControlService.getSpecDriftStatus(spec.specId);
                    const isDrifted = spec.isDrifted || driftStatus.isDrifted;
                    const driftDetails = spec.driftDetails || driftStatus.changeDetails;

                    return (
                      <tr key={spec.specId + '-' + (spec.version || index)} className="hover:bg-slate-900/50 transition">
                        <td className="p-3.5 text-indigo-400 font-bold">{spec.specId}</td>
                        <td className="p-3.5 font-sans font-bold text-white">{spec.title}</td>
                        <td className="p-3.5 font-sans text-indigo-300 font-medium">{spec.projectId || 'sdd-enterprise-dev'}</td>
                        <td className="p-3.5 font-sans text-purple-300 font-medium">{spec.requirementId || 'REQ-001'}</td>
                        <td className="p-3.5 font-bold text-white">{spec.version || 'v1.0.0'}</td>
                        <td className="p-3.5 text-center text-emerald-400 font-bold">{spec.qualityScore || 99.0}%</td>
                        <td className="p-3.5 text-center font-sans">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-emerald-400 rounded text-[10px]">
                            {spec.lintStatus || 'PASSED'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-sans">
                          {isDrifted ? (
                            <span 
                              title={driftDetails ? `Parent Change Request: ${driftDetails}` : 'Parent specification has pending drift modification requests'}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm cursor-help inline-flex items-center space-x-1"
                            >
                              <i className="fas fa-exclamation-triangle text-amber-400 text-[9px] mr-1"></i>
                              <span>DRIFTED</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-sm inline-flex items-center space-x-1">
                              <i className="fas fa-check-circle text-emerald-400 text-[9px] mr-1"></i>
                              <span>FRESH</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-sans">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            isBaseline
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}>
                            {isBaseline ? '⭐ Baseline' : 'Superseded'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Artifact Registry */}
      {activeTab === 'artifacts' && (
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  placeholder="Filter by Artifact ID, Title, Version, or Parent ID..."
                  value={artifactSearchQuery}
                  onChange={e => setArtifactSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <select
                value={artifactStageFilter}
                onChange={e => setArtifactStageFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Artifact Types</option>
                <option value="spec-to-story">Spec to Story</option>
                <option value="user-stories">User Stories</option>
                <option value="functional-spec">Functional Spec (FSD)</option>
                <option value="ux-wireframe">UX Wireframe</option>
                <option value="tech-architecture">Tech Architecture</option>
                <option value="database-design">Database Design</option>
                <option value="test-cases">Test Cases</option>
                <option value="traceability-matrix">Traceability Matrix</option>
                <option value="review-agent">Review Agent</option>
              </select>

              <select
                value={artifactStatusFilter}
                onChange={e => setArtifactStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses & Health</option>
                <option value="BASELINE">⭐ Baseline Only</option>
                <option value="SUPERSEDED">Superseeded Only</option>
                <option value="STALE">⚠️ Stale Artifacts Only</option>
                <option value="FRESH">🟢 Fresh Artifacts Only</option>
              </select>
            </div>
          </div>

          {/* Artifacts Table */}
          <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-auto flex-1 custom-scroll">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3.5">Artifact ID</th>
                    <th className="p-3.5">Artifact Title</th>
                    <th className="p-3.5">Stage / Type</th>
                    <th className="p-3.5">Parent Artefact</th>
                    <th className="p-3.5">Project ID</th>
                    <th className="p-3.5">Version</th>
                    <th className="p-3.5">Created / Updated</th>
                    <th className="p-3.5 text-center">Status Flag</th>
                    <th className="p-3.5 text-center">Staleness</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {isLoadingArtifacts ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400 font-sans">
                        <i className="fas fa-circle-notch animate-spin text-indigo-400 text-2xl mb-2 block"></i>
                        Loading generated artifacts registry...
                      </td>
                    </tr>
                  ) : filteredArtifacts.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-500 font-sans">
                        <i className="fas fa-boxes text-3xl mb-2 opacity-40 block"></i>
                        <p className="font-semibold text-slate-400">No Generated Artifacts Found</p>
                        <p className="text-xs text-slate-500 mt-1">Compile artifacts from SDLC stage views to register generated versions.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredArtifacts.map((art, idx) => {
                      const isBaseline = art.status === 'LATEST';
                      const parentId = getParentArtefactId(art);
                      const parentVersion = getParentArtefactVersion(art);
                      const staleness = getArtefactStaleness(art);
                      const stageLabels = {
                        'spec-to-story': 'Spec to Story',
                        'user-stories': 'User Stories',
                        'functional-spec': 'Functional Spec',
                        'ux-wireframe': 'UX Wireframe',
                        'tech-architecture': 'Tech Architecture',
                        'database-design': 'Database Design',
                        'test-cases': 'Test Cases',
                        'traceability-matrix': 'Traceability Matrix',
                        'review-agent': 'Review Agent'
                      };

                      return (
                        <tr key={art.id || idx} className="hover:bg-slate-900/50 transition">
                          <td className="p-3.5 text-indigo-400 font-bold">{art.artefactId || art.id}</td>
                          <td className="p-3.5 font-sans font-bold text-white">{art.title}</td>
                          <td className="p-3.5 font-sans">
                            <span className="px-2 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded text-[10px] font-semibold">
                              {stageLabels[art.stageKey] || art.stageKey}
                            </span>
                          </td>
                          <td className="p-3.5 font-sans">
                            <span className="px-2.5 py-1 bg-purple-950/70 text-purple-300 border border-purple-800/70 rounded-lg text-[10px] font-mono font-bold inline-flex items-center space-x-1.5 shadow-sm">
                              <i className="fas fa-level-up-alt rotate-90 text-[9px] text-purple-400"></i>
                              <span>{parentId}</span>
                              <span className="px-1.5 py-0.2 bg-purple-900/90 text-purple-200 border border-purple-700/60 rounded text-[9px] font-mono font-bold">
                                {parentVersion}
                              </span>
                            </span>
                          </td>
                          <td className="p-3.5 font-sans text-slate-400">{art.projectId || 'sdd-enterprise-dev'}</td>
                          <td className="p-3.5 font-bold text-white">{art.version || 'v1.0.0'}</td>
                          <td className="p-3.5 font-sans text-slate-400 text-[11px]">
                            {art.updatedAt || art.createdAt ? (art.updatedAt || art.createdAt).split('T')[0] : 'N/A'}
                          </td>
                          <td className="p-3.5 text-center font-sans">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap inline-flex items-center space-x-1 ${
                              isBaseline
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-sm'
                                : 'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}>
                              <span>{isBaseline ? '⭐ Baseline' : 'Superseeded'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-sans">
                            <span 
                              title={staleness.reason}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap inline-flex items-center space-x-1 cursor-help ${
                                staleness.label === 'SUPERSEDED' || staleness.isSuperseded
                                  ? 'bg-slate-900 text-slate-400 border border-slate-700'
                                  : staleness.isStale
                                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-sm'
                                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-sm'
                              }`}
                            >
                              <i className={`fas ${
                                staleness.label === 'SUPERSEDED' || staleness.isSuperseded
                                  ? 'fa-history text-slate-500'
                                  : staleness.isStale
                                  ? 'fa-exclamation-triangle text-rose-400'
                                  : 'fa-check-circle text-emerald-400'
                              } text-[9px] mr-1`}></i>
                              <span>{staleness.label}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-sans">
                            <button
                              title="View Payload Document"
                              onClick={() => setSelectedArtifactModal({ ...art, parentArtefactId: parentId, parentArtefactVersion: parentVersion, staleness })}
                              className="w-8 h-8 bg-slate-900 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500 rounded-lg transition cursor-pointer inline-flex items-center justify-center shadow-sm"
                            >
                              <i className="fas fa-eye text-xs"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Artifact Lineage Graph */}
      {activeTab === 'graph' && (
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <ArtifactLineageTree />
        </div>
      )}

      {/* Target State Layer 4 Info & Telemetry Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scroll text-left">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Target State Layer 4 of 6
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Document ID: SDD-REQ-L4-SAC</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5 flex items-center space-x-2.5">
                  <i className="fas fa-sitemap text-blue-400"></i>
                  <span>Spec & Artifact Control Layer Control Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Establishes approved specifications as the source of truth, enforcing immutable baselines and bidirectional artifact graphs.
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
                <h4 className="font-bold text-blue-400 uppercase text-[11px]">Layer 4 Foundational Objectives</h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li><strong>Spec Registry (`SAC-FR-001`):</strong> Authoritative repository for machine-readable versioned specifications.</li>
                  <li><strong>Baseline Manager (`SAC-FR-012`):</strong> Locks approved specification baselines before downstream generation.</li>
                  <li><strong>Artifact Graph (`SAC-FR-015`):</strong> Bidirectional relationships (`derives-from`, `implements`, `tests`).</li>
                  <li><strong>Change Impact Agent (`SAC-FR-017`):</strong> Analyzes modifications and flags affected artifacts as stale.</li>
                  <li><strong>Regeneration Orchestrator (`SAC-FR-019`):</strong> Selective regeneration guaranteeing zero silent overwrites.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg"
              >
                Close Info Modal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Artifact Payload Detail Modal */}
      {selectedArtifactModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4 relative h-[90vh] flex flex-col text-left">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                    selectedArtifactModal.status === 'LATEST' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {selectedArtifactModal.status === 'LATEST' ? '⭐ Baseline Version' : 'Superseeded Version'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedArtifactModal.version}</span>
                  {selectedArtifactModal.staleness && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                      selectedArtifactModal.staleness.isStale ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {selectedArtifactModal.staleness.label}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedArtifactModal.title}</h3>
                <p className="text-xs text-slate-400">
                  ID: <span className="text-indigo-300 font-mono">{selectedArtifactModal.artefactId || selectedArtifactModal.id}</span> | 
                  Stage: <span className="text-purple-300 font-mono">{selectedArtifactModal.stageKey}</span> | 
                  Parent: <span className="text-purple-300 font-mono">{selectedArtifactModal.parentArtefactId} ({selectedArtifactModal.parentArtefactVersion || 'v1.0.0'})</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* View Mode Toggle Buttons */}
                <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl space-x-1">
                  <button
                    onClick={() => setModalViewMode('formatted')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                      modalViewMode === 'formatted'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-file-alt"></i>
                    <span>Formatted Document</span>
                  </button>
                  <button
                    onClick={() => setModalViewMode('raw')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                      modalViewMode === 'raw'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-code"></i>
                    <span>Raw JSON Payload</span>
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedArtifactModal(null)} 
                  className="text-slate-400 hover:text-white transition cursor-pointer text-lg p-1"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            {modalViewMode === 'formatted' ? (
              <div className="flex-1 overflow-hidden bg-[#070a13] border border-slate-800 rounded-xl">
                <iframe
                  srcDoc={formatArtifactContentToHtml(selectedArtifactModal)}
                  className="w-full h-full border-0 rounded-xl bg-[#070a13]"
                  title={selectedArtifactModal.title}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 custom-scroll font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {typeof selectedArtifactModal.content === 'object'
                  ? JSON.stringify(selectedArtifactModal.content, null, 2)
                  : selectedArtifactModal.content}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedArtifactModal.staleness ? selectedArtifactModal.staleness.reason : 'Baseline document payload'}
              </span>
              <button
                onClick={() => setSelectedArtifactModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
