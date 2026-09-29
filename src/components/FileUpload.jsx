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
    <div className="bg-white p-5 rounded-[18px] flex flex-col space-y-4 shadow-2xs border border-[#ECEEF1]">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold tracking-wider text-[#17181C] uppercase">{title}</h3>
        <ComplexityBadge complexity={complexity} />
      </div>
      
      {/* Drag & Drop Area */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#D0D5DD] hover:border-[#7157F5] bg-[#FAFAF9] hover:bg-purple-50/40 rounded-[14px] p-6 text-center cursor-pointer transition group flex flex-col items-center justify-center space-y-2 shadow-2xs"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
        />
        <div className="p-3 bg-purple-50 text-[#7157F5] group-hover:scale-105 transition rounded-full border border-purple-100 shadow-2xs">
          <i className="fas fa-cloud-upload-alt text-xl"></i>
        </div>
        <p className="text-xs font-semibold text-[#17181C]">{subtitle}</p>
        <p className="text-[11px] text-[#667085]">Supports up to 50MB files</p>
      </div>

      {/* Inherited Inputs list */}
      {inheritedInputs.length > 0 && (
        <div className="space-y-2 pb-2">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center">
            <i className="fas fa-link mr-1.5"></i> Inherited Inputs
          </p>
          <div className="space-y-1.5">
            {inheritedInputs.map((input, idx) => (
              <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-2 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate">
                  <i className="fas fa-file-export text-emerald-600"></i>
                  <span className="text-emerald-800 font-medium truncate">{input.artifact}</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 bg-white">
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
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Uploaded Documents ({files.length})</p>
          <div className="max-h-28 overflow-y-auto space-y-1.5 custom-scroll">
            {files.map((file, idx) => (
              <div key={idx} className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[8px] p-2 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate">
                  <i className="far fa-file-alt text-[#7157F5]"></i>
                  <span className="text-[#17181C] font-medium truncate">{file.name}</span>
                  <span className="text-[10px] text-[#667085]">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  onClick={() => onFileDelete(idx)}
                  className="text-[#98A2B3] hover:text-rose-600 p-1 cursor-pointer transition"
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
            <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider flex items-center">
              <i className="fas fa-terminal mr-1 text-[#7157F5]"></i> Execution log console
            </p>
            {isLoading && (
              <span className="text-[10px] bg-purple-50 text-[#7157F5] border border-purple-200 px-2 py-0.5 rounded-full flex items-center">
                <i className="fas fa-circle-notch animate-spin mr-1"></i> Running Spec Compilation...
              </span>
            )}
          </div>
          <div className="bg-[#17181C] font-mono text-[10px] text-slate-300 p-3 rounded-[10px] border border-slate-800 h-44 overflow-y-auto custom-scroll flex flex-col space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className={`whitespace-pre-wrap ${
                log.includes('[Error]') ? 'text-rose-400' :
                log.includes('[Queue]') ? 'text-amber-400' :
                log.includes('[Worker]') ? 'text-emerald-400 font-medium' :
                log.includes('[Resiliency]') || log.includes('[HTML]') ? 'text-purple-400 font-medium' :
                'text-slate-300'
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
        className={`w-full py-3 font-semibold rounded-[10px] text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs ${
          isLoading
            ? 'bg-[#F8F8F7] text-[#98A2B3] border border-[#ECEEF1] cursor-not-allowed'
            : 'bg-[#7157F5] hover:bg-[#5F46D8] text-white'
        }`}
      >
        {isLoading ? (
          <>
            <i className="fas fa-circle-notch animate-spin text-sm"></i>
            <span>Compiling Agent Specifications...</span>
          </>
        ) : (
          <>
            <i className="fas fa-bolt text-sm text-amber-300"></i>
            <span>Execute AI Spec Generation</span>
          </>
        )}
      </button>
    </div>
  );
};
