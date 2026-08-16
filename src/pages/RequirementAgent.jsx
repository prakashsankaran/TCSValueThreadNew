import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function RequirementAgent() {
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('spec.md');
  const [tabContent, setTabContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [notification, setNotification] = useState(null);
  const [isSavingDocument, setIsSavingDocument] = useState(false);

  useEffect(() => {
    const fetchActiveSpec = async () => {
      try {
        const res = await fetch('http://localhost:7001/api/specs/active');
        const data = await res.json();
        if (data.success && data.activeSpec && data.files && data.files.length > 0) {
          setResult({
            success: true,
            folderName: data.activeSpec,
            files: data.files
          });
          loadDocContent(data.activeSpec, 'spec.md');
        }
      } catch (err) {
        console.error('Failed to load active spec details on mount:', err);
      }
    };
    fetchActiveSpec();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setRequirements(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleExecute = async () => {
    if (!requirements.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setResult(null);
    setLogs(['[SpecKit] Starting Spec-Driven Development cycle...', '[SpecKit] Preparing prompt context...']);

    try {
      const response = await fetch('http://localhost:7001/api/specs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requirements })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setLogs(prev => [...prev, ...data.log, '🎉 Spec Kit directory created successfully!']);
        setResult(data);
        loadDocContent(data.folderName, 'spec.md');
      } else {
        throw new Error(data.error || 'Unknown generation error');
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  async function loadDocContent(folder, file) {
    setActiveTab(file);
    setIsLoadingContent(true);
    setTabContent('');
    try {
      const downloadUrl = `http://localhost:7001/api/specs/download/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const text = await res.text();
        setTabContent(text);
      } else {
        setTabContent(`Failed to load file contents: ${res.statusText}`);
      }
    } catch (err) {
      setTabContent(`Error reading file: ${err.message}`);
    } finally {
      setIsLoadingContent(false);
    }
  }

  const handleSelectActive = async (folderName) => {
    try {
      const response = await fetch('http://localhost:7001/api/specs/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activeSpec: folderName })
      });
      if (response.ok) {
        setNotification({
          type: 'success',
          message: `Active spec changed to: ${folderName}`
        });
        
        localStorage.removeItem('orchestrator_thread_id');

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Failed to set active spec: ${err.message}`
      });
    }
  };

  const handleSaveDocument = async () => {
    if (!result || !activeTab) return;
    setIsSavingDocument(true);
    try {
      const response = await fetch('http://localhost:7001/api/specs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder: result.folderName,
          file: activeTab,
          content: tabContent
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNotification({
          type: 'success',
          message: `${activeTab} has been successfully updated on disk.`
        });
      } else {
        throw new Error(data.error || 'Failed to save document.');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {notification && (
        <div className={`fixed top-6 right-6 z-[99999] flex items-center space-x-3 bg-slate-900/95 border ${
          notification.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
        } text-slate-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in`}>
          <div className={`w-6 h-6 rounded-full ${
            notification.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          } flex items-center justify-center shrink-0`}>
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xs`}></i>
          </div>
          <div>
            <p className="text-xs font-bold">{notification.type === 'success' ? 'Workspace Updated' : 'System Alert'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-300 transition ml-2 cursor-pointer"
          >
            <i className="fas fa-times text-[10px]"></i>
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
            <i className="fas fa-file-signature text-indigo-500 mr-3"></i> Requirement Specifier Agent
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Feed raw functional requirement briefs or upload a <code className="text-indigo-400 font-bold font-mono">Requirement.md</code> file. 
            This agent executes GitHub Spec Kit prompts to auto-compile the five foundational project files and initializes a new active spec workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Requirements Input</h3>
              <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold rounded-lg border border-slate-700 cursor-pointer flex items-center space-x-1.5 transition">
                <i className="fas fa-upload"></i>
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedFileName && (
              <div className="flex items-center space-x-2 text-[10px] bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-indigo-400 font-mono">
                <i className="fas fa-file-alt"></i>
                <span className="truncate">{uploadedFileName}</span>
              </div>
            )}

            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Paste raw requirements here... E.g., 'We need a portal where users can register using email and password, hash passwords, and view profile dashboards...'"
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 font-mono transition"
            />

            <button
              onClick={handleExecute}
              disabled={isGenerating || !requirements.trim()}
              className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer ${
                isGenerating || !requirements.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:from-indigo-500 hover:to-indigo-400 shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  <span>Executing Spec Kit Scaffolding...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  <span>Execute Spec Scaffolder</span>
                </>
              )}
            </button>
          </div>

          {(isGenerating || logs.length > 0) && (
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Execution Log Console</h4>
              <div className="h-40 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1 custom-scroll">
                {logs.map((log, idx) => (
                  <div key={idx} className={`${log.startsWith('❌') ? 'text-red-400' : log.startsWith('🎉') || log.startsWith('All') ? 'text-green-400' : 'text-slate-400'}`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3">
          {result ? (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 flex flex-col h-[580px] overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active Workspace Folder</span>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-folder text-amber-500 text-sm"></i>
                    <span className="text-xs font-bold text-white font-mono">{result.folderName}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveDocument}
                    disabled={isSavingDocument}
                    className="px-3.5 py-1.5 bg-green-950 hover:bg-green-900 border border-green-900 hover:border-green-800 text-[10px] text-green-400 font-bold rounded-lg transition flex items-center space-x-1.5 shadow cursor-pointer"
                  >
                    {isSavingDocument ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
                    <span>Save Document</span>
                  </button>
                  <button
                    onClick={() => handleSelectActive(result.folderName)}
                    className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 hover:border-indigo-800 text-[10px] text-indigo-400 font-bold rounded-lg transition flex items-center space-x-1.5 shadow cursor-pointer"
                  >
                    <i className="fas fa-check"></i>
                    <span>Set as Active Spec</span>
                  </button>
                </div>
              </div>

              <div className="flex border-b border-slate-800 overflow-x-auto shrink-0 mb-4 pb-0.5">
                {result.files.map((file) => (
                  <button
                    key={file}
                    onClick={() => loadDocContent(result.folderName, file)}
                    className={`px-3 py-1.5 text-[10px] font-bold border-b-2 whitespace-nowrap transition -mb-0.5 cursor-pointer ${
                      activeTab === file
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {file}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[10px] text-slate-300 leading-relaxed custom-scroll relative">
                {isLoadingContent ? (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <i className="fas fa-spinner animate-spin text-indigo-500 text-lg"></i>
                      <span className="text-[10px] text-slate-400">Loading document content...</span>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={tabContent}
                    onChange={(e) => setTabContent(e.target.value)}
                    className="w-full h-full bg-transparent text-slate-300 font-mono text-[10px] leading-relaxed resize-none focus:outline-none min-h-[440px] custom-scroll select-text"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center h-[580px] border-dashed">
              <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
                <i className="fas fa-file-invoice text-2xl"></i>
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Spec Kit Workspace Viewer</h3>
              <p className="text-[10px] text-slate-500 mt-2 max-w-sm leading-relaxed">
                Provide requirement details on the left and execute the spec builder. 
                The compiled Spec Kit files will be rendered here interactively.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
