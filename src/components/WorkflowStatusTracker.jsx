import React, { useMemo } from 'react';
import { usePageContext } from '../context/PageContext';

export default function WorkflowStatusTracker({ activeProject }) {
  const { pages } = usePageContext();

  const workflowData = useMemo(() => {
    try {
      const saved = localStorage.getItem('sdd_project_workflows');
      if (saved) {
        const mappings = JSON.parse(saved);
        return mappings[activeProject] || { nodes: [], edges: [] };
      }
    } catch (e) {
      console.error(e);
    }
    return { nodes: [], edges: [] };
  }, [activeProject]);

  // Topological sort to determine sequence
  const sortedNodes = useMemo(() => {
    const { nodes, edges } = workflowData;
    if (!nodes || nodes.length === 0) return [];

    const adj = {};
    const inDegree = {};
    nodes.forEach(n => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    if (edges) {
      edges.forEach(e => {
        if (adj[e.source] && inDegree[e.target] !== undefined) {
          adj[e.source].push(e.target);
          inDegree[e.target]++;
        }
      });
    }

    const queue = [];
    nodes.forEach(n => {
      if (inDegree[n.id] === 0) queue.push(n.id);
    });

    const sorted = [];
    while(queue.length > 0) {
      const u = queue.shift();
      const node = nodes.find(n => n.id === u);
      if (node) sorted.push(node);

      if (adj[u]) {
        adj[u].forEach(v => {
          inDegree[v]--;
          if (inDegree[v] === 0) queue.push(v);
        });
      }
    }

    if (sorted.length < nodes.length) {
       nodes.forEach(n => {
         if (!sorted.find(s => s.id === n.id)) sorted.push(n);
       });
    }

    return sorted;
  }, [workflowData]);

  if (sortedNodes.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3 flex items-center overflow-x-auto custom-scroll shrink-0 shadow-inner z-10">
      <div className="flex items-center space-x-3 mr-6 shrink-0">
        <i className="fas fa-project-diagram text-indigo-400 text-sm"></i>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Sequence</span>
      </div>
      
      <div className="flex items-center space-x-3">
        {sortedNodes.map((node, idx) => {
          const agentId = node.data.id;
          const isGenerated = pages[agentId] && pages[agentId].output !== null;
          
          return (
            <React.Fragment key={node.id}>
              {idx > 0 && (
                <i className="fas fa-arrow-right text-slate-600 text-[10px] shrink-0"></i>
              )}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
                isGenerated 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
              }`}>
                <i className={`fas ${isGenerated ? 'fa-check-circle' : 'fa-hourglass-half'} text-xs`}></i>
                <span className="text-[11px] font-bold whitespace-nowrap">{node.data.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
