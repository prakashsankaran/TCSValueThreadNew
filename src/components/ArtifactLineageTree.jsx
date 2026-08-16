import React, { useState, useEffect, useMemo } from 'react';

export default function ArtifactLineageTree() {
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectModalArtifact, setInspectModalArtifact] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [svgLines, setSvgLines] = useState([]);

  const containerRef = React.useRef(null);
  const nodeRefs = React.useRef({});

  // Sync real artifacts from SQLite DB across Idea -> Requirement -> Spec -> SDLC stages
  useEffect(() => {
    const loadDynamicArtifacts = async () => {
      try {
        const activeProj = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
        
        const [ideasRes, reqsRes, specsRes, artsRes] = await Promise.all([
          fetch(`http://localhost:7001/api/ideas?project=${encodeURIComponent(activeProj)}`).then(r => r.json()).catch(() => ({ ideas: [] })),
          fetch(`http://localhost:7001/api/requirements?project=${encodeURIComponent(activeProj)}`).then(r => r.json()).catch(() => ({ requirements: [] })),
          fetch(`http://localhost:7001/api/specs?project=${encodeURIComponent(activeProj)}`).then(r => r.json()).catch(() => ({ specs: [] })),
          fetch(`http://localhost:7001/api/artefacts?project=${encodeURIComponent(activeProj)}`).then(r => r.json()).catch(() => ({ artefacts: [] }))
        ]);

        const rawIdeas = ideasRes?.ideas || [];
        const rawReqs = reqsRes?.requirements || [];
        const rawSpecs = specsRes?.specs || [];
        const rawArts = artsRes?.artefacts || [];

        const dynamicMap = new Map();

        // 1. Map Layer 0 Ideas
        rawIdeas.forEach(idea => {
          const id = idea.ideaId || `IDEA-${Date.now()}`;
          const title = idea.title || idea.ideaBrief?.title || idea.originalInput?.substring(0, 40) || 'Layer 0 Requirement Signal';
          dynamicMap.set(id, {
            id,
            title: `${title}`,
            category: 'Requirements',
            type: 'Layer 0 Requirement Intent',
            version: `v${idea.version || 1}.0`,
            owner: idea.submitter || 'Delivery Manager',
            createdAt: idea.createdAt ? idea.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            status: idea.humanDecision?.status || 'APPROVED',
            inputs: [],
            outputs: [],
            contentSnippet: typeof idea.originalInput === 'string' ? idea.originalInput.substring(0, 200) : 'Layer 0 requirement signal input.'
          });
        });

        // 2. Map Requirements
        rawReqs.forEach(req => {
          const id = req.requirement_id || `REQ-${Date.now()}`;
          const parentIdeaId = req.idea_id || (rawIdeas.length > 0 ? rawIdeas[0].ideaId : null);
          const inputs = parentIdeaId && dynamicMap.has(parentIdeaId) ? [parentIdeaId] : [];
          
          dynamicMap.set(id, {
            id,
            title: req.title || 'Requirement Specification',
            category: 'Requirements',
            type: 'Requirement Intent',
            version: 'v1.0',
            owner: req.submitter || 'Business Analyst',
            createdAt: req.updated_at ? req.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            status: req.status || 'APPROVED',
            inputs,
            outputs: [],
            contentSnippet: req.requirement_markdown ? req.requirement_markdown.substring(0, 200) + '...' : 'Requirement intent specification.'
          });
        });

        // 3. Map System Specifications
        rawSpecs.forEach(spec => {
          const id = spec.specId || spec.id;
          const reqId = spec.requirementId || (rawReqs.length > 0 ? rawReqs[0].requirement_id : null);
          const inputs = reqId && dynamicMap.has(reqId) ? [reqId] : [];

          dynamicMap.set(id, {
            id,
            title: `${spec.title} (${spec.version || 'v1.0.0'})`,
            category: 'Specification',
            type: 'SpeckIt System Spec',
            version: spec.version || 'v1.0.0',
            owner: spec.metadata?.owner || 'Requirements AI Agent',
            createdAt: spec.updatedAt ? spec.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            status: spec.status || 'APPROVED',
            inputs,
            outputs: [],
            contentSnippet: spec.contentMarkdown ? spec.contentMarkdown.substring(0, 200) + '...' : 'System architecture specification baseline.'
          });
        });

        // Find primary Spec ID for linking downstream generated artefacts
        const primarySpecId = rawSpecs.length > 0 ? (rawSpecs[0].specId || rawSpecs[0].id) : null;

        // Stage definitions for generated artefacts
        const stageMeta = {
          'spec-to-story': { cat: 'User Stories', type: 'Product Backlog', prefix: 'US', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'user-stories': { cat: 'User Stories', type: 'JIRA Backlog', prefix: 'US', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'ux-wireframe': { cat: 'UX Wireframe', type: 'Tailwind Prototype', prefix: 'UX', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'functional-spec': { cat: 'Functional Spec', type: 'Functional Specification', prefix: 'FSD', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'tech-architecture': { cat: 'Tech Architecture', type: 'Architecture Blueprint', prefix: 'ARCH', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'database-design': { cat: 'Database Design', type: 'Data Model & DDL', prefix: 'DB', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'test-cases': { cat: 'Test Cases', type: 'Test Suite', prefix: 'TC', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'traceability-matrix': { cat: 'Traceability', type: 'Audit Ledger', prefix: 'TRC', defaultInputs: primarySpecId ? [primarySpecId] : [] },
          'review-agent': { cat: 'Review & Audit', type: 'Compliance Scan', prefix: 'REV', defaultInputs: primarySpecId ? [primarySpecId] : [] }
        };

        // 4. Map Generated SDLC Artefacts (Preserve unique ID per version!)
        rawArts.forEach(art => {
          const id = art.id || `${art.artefactId}-${art.version}`;
          const stage = art.stageKey || 'general';
          const meta = stageMeta[stage] || { cat: 'Specification', type: 'SDLC Output', prefix: 'ART', defaultInputs: primarySpecId ? [primarySpecId] : [] };

          const validInputs = meta.defaultInputs.filter(inpId => dynamicMap.has(inpId));
          if (validInputs.length === 0 && primarySpecId && dynamicMap.has(primarySpecId)) {
            validInputs.push(primarySpecId);
          }

          let snippet = 'Generated SDLC artifact.';
          if (typeof art.content === 'string') {
            snippet = art.content.substring(0, 200) + '...';
          } else if (art.content && typeof art.content === 'object') {
            snippet = JSON.stringify(art.content).substring(0, 200) + '...';
          }

          dynamicMap.set(id, {
            id,
            artefactId: art.artefactId || art.id,
            title: `${art.title} (${art.version || 'v1.0.0'})`,
            category: meta.cat,
            type: meta.type,
            version: art.version || 'v1.0.0',
            owner: art.metadata?.owner || 'AI Generation Agent',
            createdAt: art.createdAt ? art.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            status: art.status === 'LATEST' ? 'APPROVED' : art.status,
            inputs: validInputs,
            outputs: [],
            contentSnippet: snippet,
            fullContent: art.content
          });
        });

        // 5. Bi-directional Linker: Populate outputs array for parent nodes
        const allNodes = Array.from(dynamicMap.values());
        allNodes.forEach(node => {
          if (Array.isArray(node.inputs)) {
            node.inputs.forEach(inputId => {
              if (dynamicMap.has(inputId)) {
                const parent = dynamicMap.get(inputId);
                if (!parent.outputs.includes(node.id)) {
                  parent.outputs.push(node.id);
                }
              }
            });
          }
        });

        const dynamicArtifactsList = Array.from(dynamicMap.values());
        setArtifacts(dynamicArtifactsList);
        if (dynamicArtifactsList.length > 0) {
          const firstReq = dynamicArtifactsList.find(a => a.category === 'Requirements') || dynamicArtifactsList[0];
          setSelectedArtifactId(firstReq.id);
        } else {
          setSelectedArtifactId(null);
        }
      } catch (err) {
        console.warn('Failed to load dynamic lineage artifacts:', err);
        setArtifacts([]);
        setSelectedArtifactId(null);
      }
    };

    loadDynamicArtifacts();
    window.addEventListener('storage', loadDynamicArtifacts);
    window.addEventListener('activeProjectChanged', loadDynamicArtifacts);
    return () => {
      window.removeEventListener('storage', loadDynamicArtifacts);
      window.removeEventListener('activeProjectChanged', loadDynamicArtifacts);
    };
  }, []);

  // Filter ONLY Requirements & Ideas for Left Sidebar
  const filteredSidebarArtifacts = useMemo(() => {
    return artifacts.filter(art => {
      const isReq = art.category === 'Requirements' || art.type.includes('Requirement');
      if (!isReq) return false;

      const matchesSearch = searchQuery === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.version.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [artifacts, searchQuery]);

  const selectedArtifact = useMemo(() => {
    return artifacts.find(a => a.id === selectedArtifactId) || (artifacts.length > 0 ? artifacts[0] : null);
  }, [artifacts, selectedArtifactId]);

  // Compute active lineage subtree (selected requirement + recursively all child/descendant nodes)
  const activeSubtreeIds = useMemo(() => {
    const activeId = selectedArtifactId || (selectedArtifact ? selectedArtifact.id : null);
    if (!activeId) return new Set();

    const subtree = new Set([activeId]);
    let addedNew = true;

    while (addedNew) {
      addedNew = false;
      artifacts.forEach(node => {
        // If an input of this node is in the subtree, add this node as a child/descendant
        if (Array.isArray(node.inputs) && node.inputs.some(inpId => subtree.has(inpId))) {
          if (!subtree.has(node.id)) {
            subtree.add(node.id);
            addedNew = true;
          }
        }
        // If this node is in the subtree, add all its outputs
        if (subtree.has(node.id) && Array.isArray(node.outputs)) {
          node.outputs.forEach(outId => {
            if (!subtree.has(outId)) {
              subtree.add(outId);
              addedNew = true;
            }
          });
        }
      });
    }

    return subtree;
  }, [artifacts, selectedArtifactId, selectedArtifact]);

  // Compute levels/columns dynamically based on input-output dependencies (lineage depth)
  const columns = useMemo(() => {
    const activeNodes = artifacts.filter(a => activeSubtreeIds.has(a.id));
    
    // Map node ID to its computed level
    const levels = {};
    
    // Recursive helper to get level
    const getLevel = (nodeId, visited = new Set()) => {
      if (levels[nodeId] !== undefined) return levels[nodeId];
      if (visited.has(nodeId)) return 0; // Prevent cycle loops
      
      visited.add(nodeId);
      const node = artifacts.find(a => a.id === nodeId);
      if (!node || !node.inputs || node.inputs.length === 0) {
        levels[nodeId] = 0;
        return 0;
      }
      
      let maxParentLevel = -1;
      node.inputs.forEach(pId => {
        if (activeSubtreeIds.has(pId)) {
          const pLvl = getLevel(pId, visited);
          if (pLvl > maxParentLevel) {
            maxParentLevel = pLvl;
          }
        }
      });
      
      const lvl = maxParentLevel + 1;
      levels[nodeId] = lvl;
      return lvl;
    };
    
    // Compute level for all active nodes
    activeNodes.forEach(node => {
      getLevel(node.id);
    });
    
    // Group active nodes by level
    const maxLevel = Math.max(...Object.values(levels), 0);
    const cols = [];
    for (let i = 0; i <= maxLevel; i++) {
      cols.push([]);
    }
    
    activeNodes.forEach(node => {
      const lvl = levels[node.id] || 0;
      cols[lvl].push(node);
    });
    
    // Ensure we always have at least 4 default columns for visual symmetry if empty
    while (cols.length < 4) {
      cols.push([]);
    }
    
    return cols;
  }, [artifacts, activeSubtreeIds]);

  // Dynamic SVG Bezier Line Generator connecting ONLY active subtree parent and child nodes
  const updateLines = React.useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const lines = [];

    artifacts.forEach(targetNode => {
      if (!activeSubtreeIds.has(targetNode.id)) return;
      const targetEl = nodeRefs.current[targetNode.id];
      if (!targetEl) return;
      const targetRect = targetEl.getBoundingClientRect();

      (targetNode.inputs || []).forEach(inputId => {
        if (!activeSubtreeIds.has(inputId)) return;
        const sourceEl = nodeRefs.current[inputId];
        if (!sourceEl) return;
        const sourceRect = sourceEl.getBoundingClientRect();

        const start = {
          x: sourceRect.right - containerRect.left,
          y: sourceRect.top + sourceRect.height / 2 - containerRect.top
        };
        const end = {
          x: targetRect.left - containerRect.left,
          y: targetRect.top + targetRect.height / 2 - containerRect.top
        };

        const dx = Math.max(30, (end.x - start.x) / 2);
        const pathD = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
        
        const isSelected = targetNode.id === selectedArtifactId || inputId === selectedArtifactId;
        const color = isSelected ? '#10b981' : targetNode.category === 'User Stories' ? '#38bdf8' : '#6366f1';

        lines.push({
          id: `${inputId}->${targetNode.id}`,
          pathD,
          color,
          type: isSelected ? 'output' : 'input'
        });
      });
    });

    setSvgLines(lines);
  }, [artifacts, selectedArtifactId, activeSubtreeIds]);

  useEffect(() => {
    updateLines();
    const t1 = setTimeout(updateLines, 50);
    const t2 = setTimeout(updateLines, 200);
    window.addEventListener('resize', updateLines);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateLines);
    };
  }, [updateLines, isExpanded, isSidebarCollapsed, artifacts]);

  return (
    <div className={`flex bg-[#070a13] transition-all duration-300 ${
      isExpanded 
        ? 'fixed inset-0 z-[99999] h-screen w-screen p-0 m-0 rounded-none border-none shadow-none bg-[#070a13]' 
        : 'h-[calc(100vh-140px)] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative'
    }`}>
      
      {/* ---------------------------------------------------- */}
      {/* LEFT SIDEBAR: AVAILABLE REQUIREMENTS LIST            */}
      {/* ---------------------------------------------------- */}
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-80'} border-r border-slate-800 bg-[#0b0f19] flex flex-col shrink-0 transition-all duration-300`}>
        
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center space-x-2">
                <i className="fas fa-sitemap text-indigo-400"></i>
                <span>Available Requirements</span>
              </h3>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              title={isSidebarCollapsed ? "Expand Requirements Sidebar" : "Collapse Requirements Sidebar"}
            >
              <i className={`fas ${isSidebarCollapsed ? 'fa-indent text-indigo-400' : 'fa-outdent'}`}></i>
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-2.5 text-xs text-slate-500"></i>
              <input 
                type="text"
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition"
              />
            </div>
          )}
        </div>

        {/* Scrollable Requirements List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scroll">
          {filteredSidebarArtifacts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-sans">
              <i className="fas fa-folder-open text-3xl mb-2 opacity-40 block"></i>
              <p className="font-semibold text-slate-400 text-xs">No Requirements Found</p>
              <p className="text-[10px] text-slate-500 mt-1">Submit an idea or requirement in Layer 0 to populate the lineage graph.</p>
            </div>
          ) : (
            filteredSidebarArtifacts.map(art => {
              const isSelected = art.id === selectedArtifactId;
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArtifactId(art.id)}
                    title={`${art.title} (${art.version})`}
                    className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition ${
                      isSelected ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-file-alt text-xs"></i>
                  </button>
                );
              }
              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifactId(art.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                    isSelected 
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50' 
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-full"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {art.version}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">{art.createdAt}</span>
                  </div>

                  <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {art.title}
                  </h4>

                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Owner: <span className="text-slate-400">{art.owner}</span>
                  </p>

                  <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-800/60 text-[9px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <i className="fas fa-sign-in-alt text-blue-400"></i>
                      <span>{art.inputs ? art.inputs.length : 0} Inputs</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <i className="fas fa-sign-out-alt text-emerald-400"></i>
                      <span>{art.outputs ? art.outputs.length : 0} Outputs</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT CANVAS: MULTI-STAGE END-TO-END LINEAGE GRAPH   */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col bg-[#070a13] relative overflow-hidden">
        
        {/* Canvas Toolbar Header */}
        <div className="h-14 px-6 border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center space-x-2">
                <span>{selectedArtifact?.title || 'End-to-End SDLC Lineage Graph'}</span>
                {selectedArtifact && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {selectedArtifact.version}
                  </span>
                )}
              </h2>
              {selectedArtifact && (
                <p className="text-[10px] text-slate-400 font-mono">
                  Artifact ID: <span className="text-indigo-400">{selectedArtifact.id}</span> | Owner: <span className="text-slate-300">{selectedArtifact.owner}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {selectedArtifact && (
              <button
                onClick={() => setInspectModalArtifact(selectedArtifact)}
                className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="fas fa-search-plus text-indigo-400"></i>
                <span>Inspect Content</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-lg ${
                isExpanded 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title={isExpanded ? "Compress View" : "Expand to Fullscreen Lineage View"}
            >
              <i className={`fas ${isExpanded ? 'fa-compress' : 'fa-expand'}`}></i>
              <span>{isExpanded ? 'Exit Fullscreen' : 'Expand View'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Multi-Stage Pipeline Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6 custom-scroll relative bg-[#070a13]">
          
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"></div>

          {artifacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-3">
              <i className="fas fa-sitemap text-4xl text-slate-600"></i>
              <h3 className="text-sm font-bold text-slate-300">No Lineage Graph Data Available</h3>
              <p className="text-xs text-slate-500 max-w-sm">Submit a requirement or generate specification documents to visualize connected SDLC artifacts.</p>
            </div>
          ) : (
            <div ref={containerRef} className="relative min-w-[1100px] flex items-start justify-between space-x-12 py-4 px-6">
              
              {/* OVERLAY SVG FOR DYNAMIC BEZIER CONNECTOR CURVES */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <defs>
                  <marker id="marker-input" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <polygon points="0 0, 8 4, 0 8" fill="#6366f1" />
                  </marker>
                  <marker id="marker-output" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <polygon points="0 0, 8 4, 0 8" fill="#10b981" />
                  </marker>
                </defs>
                {svgLines.map(line => (
                  <g key={line.id}>
                    <path
                      d={line.pathD}
                      stroke={line.color}
                      strokeWidth="5"
                      opacity="0.2"
                      fill="none"
                    />
                    <path
                      d={line.pathD}
                      stroke={line.color}
                      strokeWidth="2"
                      fill="none"
                      markerEnd={`url(#marker-${line.type})`}
                    />
                  </g>
                ))}
              </svg>

            {columns.map((colNodes, colIdx) => {
              const colHeaders = [
                { title: '1. Requirement Intake', icon: 'fa-file-alt text-amber-400', border: 'border-amber-500/40' },
                { title: '2. Elicited Requirements', icon: 'fa-layer-group text-indigo-400', border: 'border-indigo-500/40' },
                { title: '3. System Specifications', icon: 'fa-code-branch text-emerald-400', border: 'border-emerald-500/40' },
                { title: '4. Derived SDLC Specs', icon: 'fa-database text-purple-400', border: 'border-purple-500/40' },
                { title: '5. Downstream DB & Tests', icon: 'fa-shield-alt text-cyan-400', border: 'border-cyan-500/40' }
              ];
              const header = colHeaders[colIdx] || { title: `Level ${colIdx + 1}`, icon: 'fa-link text-slate-400', border: 'border-slate-800' };

              if (colNodes.length === 0) return null;

              return (
                <div key={colIdx} className="flex flex-col space-y-4 w-64 shrink-0 z-10 relative">
                  <div className={`flex items-center space-x-2 pb-1.5 border-b ${header.border}`}>
                    <i className={`fas ${header.icon} text-xs`}></i>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{header.title}</span>
                  </div>
                  
                  {colNodes.map(node => {
                    const isSel = node.id === selectedArtifactId;
                    
                    // Choose theme colors dynamically based on category
                    let tagBg = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
                    let selectBorder = 'hover:border-slate-700/80 border-slate-800';
                    let selectBg = isSel ? 'bg-slate-900 border-2 border-slate-600' : 'bg-slate-900/60';
                    
                    if (node.category === 'Requirements') {
                      tagBg = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
                      selectBorder = 'hover:border-amber-500/50 border-slate-800';
                      selectBg = isSel ? 'bg-amber-950/60 border-2 border-amber-500 shadow-amber-950/50' : 'bg-slate-900/60';
                    } else if (node.category === 'Specification') {
                      tagBg = 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30';
                      selectBorder = 'hover:border-indigo-500/50 border-slate-800';
                      selectBg = isSel ? 'bg-indigo-950/60 border-2 border-indigo-500 shadow-indigo-950/50' : 'bg-slate-900/60';
                    } else if (node.category === 'User Stories' || node.category === 'UX Wireframe' || node.category === 'Functional Spec' || node.category === 'Tech Architecture') {
                      tagBg = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
                      selectBorder = 'hover:border-emerald-500/50 border-slate-800';
                      selectBg = isSel ? 'bg-emerald-950/60 border-2 border-emerald-500 shadow-emerald-950/50' : 'bg-slate-900/60';
                    } else if (node.category === 'Database Design' || node.category === 'Test Cases' || node.category === 'Traceability') {
                      tagBg = 'bg-purple-950/60 text-purple-300 border-purple-500/30';
                      selectBorder = 'hover:border-purple-500/50 border-slate-800';
                      selectBg = isSel ? 'bg-purple-950/60 border-2 border-purple-500 shadow-purple-950/50' : 'bg-slate-900/60';
                    }

                    return (
                      <div 
                        key={node.id} 
                        ref={el => (nodeRefs.current[node.id] = el)}
                        onClick={() => setSelectedArtifactId(node.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-lg space-y-2 ${selectBg} ${selectBorder}`}
                      >
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className={`px-2 py-0.5 rounded border uppercase font-mono tracking-wider text-[8px] ${tagBg}`}>
                            {node.type || node.category}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[8px]">{node.version}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug">{node.title}</h4>
                        {node.contentSnippet && (node.category === 'Requirements' || node.type.includes('Intent')) ? (
                          <p className="text-[9px] text-slate-400 line-clamp-2 italic font-mono">"{node.contentSnippet}"</p>
                        ) : (
                          <div className="flex items-center justify-between text-[8px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                            <span>ID: {node.artefactId || node.id.split('-')[0]}</span>
                            <span className="text-slate-500">{node.createdAt}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            </div>
          )}

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* INSPECTION MODAL (CONTENT & PROOF SNIPPET)            */}
      {/* ---------------------------------------------------- */}
      {inspectModalArtifact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative text-left">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold uppercase tracking-wider rounded">
                  {inspectModalArtifact.version}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{inspectModalArtifact.title}</h3>
                <p className="text-xs text-slate-400">Author: {inspectModalArtifact.owner}</p>
              </div>
              <button 
                onClick={() => setInspectModalArtifact(null)} 
                className="text-slate-400 hover:text-white transition cursor-pointer text-lg"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
              <h4 className="font-bold text-indigo-400 uppercase text-[10px]">Artifact Content Summary</h4>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">{inspectModalArtifact.contentSnippet}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectModalArtifact(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
