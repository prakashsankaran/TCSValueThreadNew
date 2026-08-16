import React, { useRef, useState, useEffect } from 'react';
import { ComplexityBadge } from './ComplexityBadge';

export const FileUpload = ({ 
  pageKey, 
  title = "Upload Reference Specifications",
  subtitle = "Drag and drop PDF, Docx, or MD requirement documents", 
  files = [], 
  logs = [], 
  isLoading = false,
  complexity = null, 
  onFileSelect, 
  onFileDelete, 
  onTriggerGenerate 
}) => {
  const fileInputRef = useRef(null);

  const [inheritedInputs, setInheritedInputs] = useState([]);

  useEffect(() => {
    try {
      const activeProject = localStorage.getItem('activeProject');
      const saved = localStorage.getItem('sdd_project_workflows');
      if (saved && activeProject && pageKey) {
        const mappings = JSON.parse(saved);
        const workflowData = mappings[activeProject];
        if (workflowData && workflowData.nodes) {
          const { nodes, edges } = workflowData;
          const targetNode = nodes.find(n => n.data.id === pageKey);
          if (targetNode && edges) {
            const incomingEdges = edges.filter(e => e.target === targetNode.id);
            const inputs = [];
            incomingEdges.forEach(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              if (sourceNode) {
                inputs.push({
                  sourceAgent: sourceNode.data.label,
                  artifact: edge.sourceHandle ? edge.sourceHandle.replace('out-', '') : 'Data'
                });
              }
            });
            setInheritedInputs(inputs);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [pageKey]);


  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        onFileSelect(file);
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        onFileSelect(file);
      });
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4 shadow-xl border border-slate-800">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold tracking-wide text-slate-300 uppercase">{title}</h3>
        <ComplexityBadge complexity={complexity} />
      </div>
      
      {/* Drag & Drop Area */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-6 text-center cursor-pointer transition duration-300 group flex flex-col items-center justify-center space-y-2"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
        />
        <div className="p-3 bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition duration-300 rounded-full">
          <i className="fas fa-cloud-upload-alt text-2xl"></i>
        </div>
        <p className="text-xs font-semibold text-slate-300">{subtitle}</p>
        <p className="text-[10px] text-slate-500">Supports up to 50MB files</p>
      </div>

      {/* Inherited Inputs list */}
      {inheritedInputs.length > 0 && (
        <div className="space-y-2 pb-2">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
            <i className="fas fa-link mr-1.5"></i> Inherited Inputs
          </p>
          <div className="space-y-1.5">
            {inheritedInputs.map((input, idx) => (
              <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <i className="fas fa-file-export text-emerald-400"></i>
                  <span className="text-emerald-300 font-medium truncate">{input.artifact}</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10">
                  {input.sourceAgent}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploaded Documents ({files.length})</p>
          <div className="max-h-28 overflow-y-auto space-y-1.5 custom-scroll">
            {files.map((file, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <i className="far fa-file-alt text-indigo-400"></i>
                  <span className="text-slate-300 font-medium truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  onClick={() => onFileDelete(idx)}
                  className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compilation Console logs */}
      {(isLoading || logs.length > 0) && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <i className="fas fa-terminal mr-1 text-pink-400"></i> Execution log console
            </p>
            {isLoading && (
              <span className="text-[10px] bg-indigo-900/30 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded-full flex items-center">
                <i className="fas fa-circle-notch animate-spin mr-1"></i> Running Spec Compilation...
              </span>
            )}
          </div>
          <div className="bg-slate-950 font-mono text-[10px] text-slate-300 p-3 rounded-lg border border-slate-800/80 h-44 overflow-y-auto custom-scroll flex flex-col space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className={`whitespace-pre-wrap ${
                log.includes('[Error]') ? 'text-red-400' :
                log.includes('[Queue]') ? 'text-yellow-400' :
                log.includes('[Worker]') ? 'text-green-400 font-medium' :
                log.includes('[Resiliency]') || log.includes('[HTML]') ? 'text-pink-400 font-medium' :
                'text-slate-400'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Trigger Button */}
      <button
        onClick={onTriggerGenerate}
        disabled={isLoading}
        className={`w-full py-3 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition duration-300 cursor-pointer ${
          isLoading
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-500/20 glow-indigo border border-indigo-500/40'
        }`}
      >
        {isLoading ? (
          <>
            <i className="fas fa-circle-notch animate-spin text-sm"></i>
            <span>Compiling Agent Specifications...</span>
          </>
        ) : (
          <>
            <i className="fas fa-bolt text-sm"></i>
            <span>Execute AI Spec Generation</span>
          </>
        )}
      </button>
    </div>
  );
};
