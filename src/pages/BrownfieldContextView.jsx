import React, { useState, useEffect } from 'react';
import { usePageContext } from '../context/PageContext';

export default function BrownfieldContextView() {
  const { brownfieldContext, setBrownfieldContext, projectMode, setProjectMode } = usePageContext();

  const [activeTab, setActiveTab] = useState('code');
  const [codeAttachMethod, setCodeAttachMethod] = useState('zip');

  const [isIngesting, setIsIngesting] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [isUploadingSchema, setIsUploadingSchema] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [ingestStatus, setIngestStatus] = useState(null);

  const [localFolderPath, setLocalFolderPath] = useState('');
  const [newCodeFileName, setNewCodeFileName] = useState('');
  const [newCodeContent, setNewCodeContent] = useState('');
  
  const [dbSchemaText, setDbSchemaText] = useState(brownfieldContext.dbSchema || '');
  
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  
  const [frameworkVersion, setFrameworkVersion] = useState(brownfieldContext.legacyGuardrails?.frameworkVersion || '');
  const [apiPrefix, setApiPrefix] = useState(brownfieldContext.legacyGuardrails?.apiPrefix || '/api/v1');
  const [preservationRules, setPreservationRules] = useState(brownfieldContext.legacyGuardrails?.preservationRules || '');

  useEffect(() => {
    if (brownfieldContext.dbSchema) {
      setDbSchemaText(brownfieldContext.dbSchema);
    }
    if (brownfieldContext.legacyGuardrails) {
      setFrameworkVersion(brownfieldContext.legacyGuardrails.frameworkVersion || '');
      setApiPrefix(brownfieldContext.legacyGuardrails.apiPrefix || '/api/v1');
      setPreservationRules(brownfieldContext.legacyGuardrails.preservationRules || '');
    }
  }, [brownfieldContext]);

  const handleZipFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingZip(true);
    setIngestStatus({ type: 'info', message: `Extracting & parsing zipped codebase archive (${file.name})...` });

    const formData = new FormData();
    formData.append('zipFile', file);

    try {
      const res = await fetch('http://localhost:7001/api/brownfield/upload-zip', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.snippets) {
        const existingMap = new Map((brownfieldContext.codeSnippets || []).map(s => [s.fileName, s]));
        data.snippets.forEach(s => existingMap.set(s.fileName, s));

        setBrownfieldContext({
          ...brownfieldContext,
          codeSnippets: Array.from(existingMap.values())
        });

        setIngestStatus({ type: 'success', message: data.message });
      } else {
        setIngestStatus({ type: 'error', message: data.error || 'Failed extracting zip file' });
      }
    } catch (err) {
      console.error(err);
      setIngestStatus({ type: 'error', message: 'Failed uploading zip archive to server' });
    } finally {
      setIsUploadingZip(false);
      e.target.value = null;
    }
  };

  const handleScanFolder = async () => {
    if (!localFolderPath.trim()) return;

    setIsScanningFolder(true);
    setIngestStatus({ type: 'info', message: `Scanning directory path: ${localFolderPath}...` });

    try {
      const res = await fetch('http://localhost:7001/api/brownfield/scan-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: localFolderPath.trim() })
      });

      const data = await res.json();
      if (data.success && data.snippets) {
        const existingMap = new Map((brownfieldContext.codeSnippets || []).map(s => [s.fileName, s]));
        data.snippets.forEach(s => existingMap.set(s.fileName, s));

        setBrownfieldContext({
          ...brownfieldContext,
          codeSnippets: Array.from(existingMap.values())
        });

        setIngestStatus({ type: 'success', message: data.message });
      } else {
        setIngestStatus({ type: 'error', message: data.error || 'Failed scanning folder' });
      }
    } catch (err) {
      console.error(err);
      setIngestStatus({ type: 'error', message: 'Failed scanning directory at server' });
    } finally {
      setIsScanningFolder(false);
    }
  };

  const handleSchemaFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingSchema(true);
    setIngestStatus({ type: 'info', message: `Uploading & parsing schema file (${file.name})...` });

    const formData = new FormData();
    formData.append('schemaFile', file);

    try {
      const res = await fetch('http://localhost:7001/api/brownfield/upload-schema-file', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.schema) {
        setDbSchemaText(prev => prev ? `${prev}\n\n-- --- LOADED FROM ${file.name} ---\n${data.schema}` : data.schema);
        setIngestStatus({ type: 'success', message: data.message });
      } else {
        setIngestStatus({ type: 'error', message: data.error || 'Failed loading schema file' });
      }
    } catch (err) {
      console.error(err);
      setIngestStatus({ type: 'error', message: 'Failed uploading schema file to server' });
    } finally {
      setIsUploadingSchema(false);
      e.target.value = null;
    }
  };

  const handleDocFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setIngestStatus({ type: 'info', message: `Uploading & extracting document file (${file.name})...` });

    const formData = new FormData();
    formData.append('docFile', file);

    try {
      const res = await fetch('http://localhost:7001/api/brownfield/upload-doc-file', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.documents) {
        const updatedDocs = [...(brownfieldContext.documents || []), ...data.documents];
        setBrownfieldContext({ ...brownfieldContext, documents: updatedDocs });
        setIngestStatus({ type: 'success', message: data.message });
      } else {
        setIngestStatus({ type: 'error', message: data.error || 'Failed uploading document file' });
      }
    } catch (err) {
      console.error(err);
      setIngestStatus({ type: 'error', message: 'Failed uploading document file to server' });
    } finally {
      setIsUploadingDoc(false);
      e.target.value = null;
    }
  };

  const handleAddCodeSnippet = () => {
    if (!newCodeFileName.trim() || !newCodeContent.trim()) return;
    const updatedSnippets = [
      ...(brownfieldContext.codeSnippets || []),
      { id: Date.now().toString(), fileName: newCodeFileName.trim(), content: newCodeContent.trim() }
    ];
    setBrownfieldContext({ ...brownfieldContext, codeSnippets: updatedSnippets });
    setNewCodeFileName('');
    setNewCodeContent('');
  };

  const handleRemoveCodeSnippet = (id) => {
    const updatedSnippets = (brownfieldContext.codeSnippets || []).filter(s => s.id !== id);
    setBrownfieldContext({ ...brownfieldContext, codeSnippets: updatedSnippets });
  };

  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    const updatedDocs = [
      ...(brownfieldContext.documents || []),
      { id: Date.now().toString(), title: newDocTitle.trim(), content: newDocContent.trim() }
    ];
    setBrownfieldContext({ ...brownfieldContext, documents: updatedDocs });
    setNewDocTitle('');
    setNewDocContent('');
  };

  const handleRemoveDocument = (id) => {
    const updatedDocs = (brownfieldContext.documents || []).filter(d => d.id !== id);
    setBrownfieldContext({ ...brownfieldContext, documents: updatedDocs });
  };

  const handleSaveAndIngest = async () => {
    setIsIngesting(true);
    setIngestStatus({ type: 'info', message: 'Ingesting and vectorizing brownfield context into Qdrant/Vector database...' });

    const updatedContext = {
      ...brownfieldContext,
      dbSchema: dbSchemaText,
      legacyGuardrails: {
        frameworkVersion,
        apiPrefix,
        preservationRules
      }
    };

    setBrownfieldContext(updatedContext);

    try {
      const res = await fetch('http://localhost:7001/api/brownfield/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: updatedContext })
      });

      const data = await res.json();
      if (data.success) {
        setIngestStatus({
          type: 'success',
          message: `Success! Indexed ${data.stats?.totalItems || 0} context items into Qdrant/Vector store.`
        });
      } else {
        setIngestStatus({ type: 'error', message: data.error || 'Failed to ingest context' });
      }
    } catch (err) {
      console.error(err);
      setIngestStatus({ type: 'error', message: 'Failed connecting to server backend at http://localhost:7001' });
    } finally {
      setIsIngesting(false);
    }
  };

  const totalSnippets = (brownfieldContext.codeSnippets || []).length;
  const totalDocs = (brownfieldContext.documents || []).length;
  const hasSchema = !!dbSchemaText.trim();

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      {/* Top Banner Card */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <i className="fas fa-cubes text-lg"></i>
              </div>
              <div>
                <h1 className="text-base font-bold text-[#17181C] tracking-tight">Brownfield Application Context</h1>
                <p className="text-xs text-[#667085] font-medium">Attach existing codebase zip/folder, database DDL files, legacy doc files, and rules for AI agents</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleSaveAndIngest}
              disabled={isIngesting}
              className={`px-4 py-2 rounded-[8px] font-semibold text-xs flex items-center space-x-2 transition shadow-2xs cursor-pointer ${
                isIngesting 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-wait' 
                  : 'bg-[#7157F5] hover:bg-[#5E43E2] text-white'
              }`}
            >
              {isIngesting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin text-xs"></i>
                  <span>Indexing Context...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-database text-xs"></i>
                  <span>Save & Index Context</span>
                </>
              )}
            </button>
          </div>
        </div>

        {ingestStatus && (
          <div className={`mt-4 p-3 rounded-[10px] border text-xs flex items-center justify-between transition ${
            ingestStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : ingestStatus.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`fas ${ingestStatus.type === 'success' ? 'fa-check-circle text-emerald-600' : ingestStatus.type === 'error' ? 'fa-exclamation-triangle text-rose-600' : 'fa-info-circle text-amber-600'}`}></i>
              <span className="font-medium">{ingestStatus.message}</span>
            </div>
            <button onClick={() => setIngestStatus(null)} className="text-[#667085] hover:text-[#17181C] ml-3 cursor-pointer">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] overflow-hidden shadow-2xs">
        <div className="flex border-b border-[#ECEEF1] bg-[#FAFAF9] px-3 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'code'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-code text-xs"></i>
            <span>Source Code</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-50 text-[#7157F5] border border-purple-200 font-semibold">{totalSnippets}</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'schema'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-database text-xs"></i>
            <span>Database Schema</span>
            {hasSchema && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5"></span>}
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'docs'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-file-alt text-xs"></i>
            <span>Existing Docs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-50 text-[#7157F5] border border-purple-200 font-semibold">{totalDocs}</span>
          </button>

          <button
            onClick={() => setActiveTab('guardrails')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer rounded-t-[8px] ${
              activeTab === 'guardrails'
                ? 'border-[#7157F5] text-[#7157F5] bg-white shadow-2xs'
                : 'border-transparent text-[#667085] hover:text-[#17181C] hover:bg-white/60'
            }`}
          >
            <i className="fas fa-shield-alt text-xs"></i>
            <span>Legacy Guardrails & Tech Stack</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'code' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Attach Source Code</h3>
                  <p className="text-xs text-[#667085]">Upload a `.zip` file of your project, specify a local directory path, or paste snippets manually.</p>
                </div>

                <div className="flex p-1 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] gap-1 shrink-0">
                  <button
                    onClick={() => setCodeAttachMethod('zip')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                      codeAttachMethod === 'zip'
                        ? 'bg-white text-[#7157F5] border border-[#ECEEF1] shadow-2xs'
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    <i className="fas fa-file-archive text-xs"></i>
                    <span>Upload Zip Archive</span>
                  </button>

                  <button
                    onClick={() => setCodeAttachMethod('folder')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                      codeAttachMethod === 'folder'
                        ? 'bg-white text-[#7157F5] border border-[#ECEEF1] shadow-2xs'
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    <i className="fas fa-folder-open text-xs"></i>
                    <span>Local Folder Path</span>
                  </button>

                  <button
                    onClick={() => setCodeAttachMethod('manual')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                      codeAttachMethod === 'manual'
                        ? 'bg-white text-[#7157F5] border border-[#ECEEF1] shadow-2xs'
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    <i className="fas fa-code text-xs"></i>
                    <span>Paste Snippet</span>
                  </button>
                </div>
              </div>

              {codeAttachMethod === 'zip' && (
                <div className="bg-[#FAFAF9] border-2 border-dashed border-[#D0D5DD] hover:border-[#7157F5] rounded-[14px] p-8 text-center space-y-3 transition">
                  <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 text-[#7157F5] flex items-center justify-center mx-auto text-xl shadow-2xs">
                    <i className={`fas ${isUploadingZip ? 'fa-circle-notch fa-spin' : 'fa-file-archive'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#17181C]">Upload Zipped Codebase (.zip)</h4>
                    <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
                      Upload your application source code archive. The backend will automatically extract and parse your source files.
                    </p>
                  </div>
                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-[#7157F5] hover:bg-[#5E43E2] text-white font-semibold text-xs rounded-[8px] cursor-pointer shadow-2xs transition">
                    <i className="fas fa-upload text-xs"></i>
                    <span>Select & Extract Zip Archive</span>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleZipFileUpload}
                      disabled={isUploadingZip}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {codeAttachMethod === 'folder' && (
                <div className="bg-[#FAFAF9] border border-[#ECEEF1] rounded-[12px] p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#17181C]">Scan Local Project Folder</h4>
                    <p className="text-xs text-[#667085] mt-0.5">Enter an absolute or relative directory path on your filesystem to recursively scan and attach source files.</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. /Users/workspace/my-legacy-app or ./server"
                      value={localFolderPath}
                      onChange={(e) => setLocalFolderPath(e.target.value)}
                      className="flex-1 bg-white border border-[#ECEEF1] focus:border-[#7157F5] rounded-[8px] px-3.5 py-2 text-xs font-mono text-[#17181C] focus:outline-none shadow-2xs"
                    />
                    <button
                      onClick={handleScanFolder}
                      disabled={isScanningFolder || !localFolderPath.trim()}
                      className="px-4 py-2 bg-white border border-[#ECEEF1] hover:border-[#7157F5] text-[#7157F5] font-semibold text-xs rounded-[8px] transition disabled:opacity-40 flex items-center space-x-2 cursor-pointer shadow-2xs shrink-0"
                    >
                      {isScanningFolder ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-search"></i>}
                      <span>Scan & Attach Folder</span>
                    </button>
                  </div>
                </div>
              )}

              {codeAttachMethod === 'manual' && (
                <div className="bg-[#FAFAF9] border border-[#ECEEF1] rounded-[12px] p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="File path e.g. server/src/services/userService.js"
                    value={newCodeFileName}
                    onChange={(e) => setNewCodeFileName(e.target.value)}
                    className="w-full bg-white border border-[#ECEEF1] focus:border-[#7157F5] rounded-[8px] px-3 py-2 text-xs font-mono text-[#17181C] focus:outline-none shadow-2xs"
                  />
                  <textarea
                    rows={6}
                    placeholder="Paste existing source code content here..."
                    value={newCodeContent}
                    onChange={(e) => setNewCodeContent(e.target.value)}
                    className="w-full bg-white border border-[#ECEEF1] focus:border-[#7157F5] rounded-[8px] p-3 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll shadow-2xs"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddCodeSnippet}
                      disabled={!newCodeFileName.trim() || !newCodeContent.trim()}
                      className="px-4 py-2 bg-[#7157F5] hover:bg-[#5E43E2] text-white font-semibold text-xs rounded-[8px] transition disabled:opacity-40 cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <i className="fas fa-plus text-xs"></i>
                      <span>Add Code Snippet</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Attached Codebase Files ({totalSnippets})</h4>
                  {totalSnippets > 0 && (
                    <button
                      onClick={() => setBrownfieldContext({ ...brownfieldContext, codeSnippets: [] })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Clear All Files
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto custom-scroll pr-1">
                  {(brownfieldContext.codeSnippets || []).map((snippet) => (
                    <div key={snippet.id || snippet.fileName} className="bg-white border border-[#ECEEF1] rounded-[12px] p-3.5 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          <i className="fas fa-file-code text-[#7157F5] text-xs"></i>
                          <span className="text-xs font-bold font-mono text-[#17181C] truncate">{snippet.fileName}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveCodeSnippet(snippet.id)}
                          className="text-[#98A2B3] hover:text-rose-600 p-1 transition shrink-0 ml-2 cursor-pointer"
                          title="Remove file"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                      <pre className="bg-[#F8F8F7] border border-[#ECEEF1] p-2.5 rounded-[8px] text-[11px] font-mono text-[#344054] overflow-x-auto max-h-28 custom-scroll">
                        {snippet.content}
                      </pre>
                    </div>
                  ))}
                  {(brownfieldContext.codeSnippets || []).length === 0 && (
                    <div className="text-center py-8 text-[#667085] text-xs border border-dashed border-[#ECEEF1] rounded-[12px] bg-[#FAFAF9]">
                      No source code files attached yet. Choose Zip upload, local folder path, or manual paste above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Database DDL Schema & Data Models</h3>
                  <p className="text-xs text-[#667085]">Upload `.sql`/`.prisma`/`.json`/`.zip` schema files, or paste SQL DDL statements directly below.</p>
                </div>

                <label className="px-3.5 py-2 bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#7157F5] text-[#7157F5] font-semibold text-xs rounded-[8px] cursor-pointer transition flex items-center space-x-1.5 shrink-0 shadow-2xs">
                  <i className={`fas ${isUploadingSchema ? 'fa-circle-notch fa-spin' : 'fa-upload'} text-xs`}></i>
                  <span>Upload Schema File (.sql, .prisma, .zip)</span>
                  <input
                    type="file"
                    accept=".sql,.prisma,.json,.yaml,.yml,.zip"
                    onChange={handleSchemaFileUpload}
                    disabled={isUploadingSchema}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={14}
                placeholder="-- Paste SQL DDL or DB Schema here&#10;CREATE TABLE users (&#10;  id SERIAL PRIMARY KEY,&#10;  email VARCHAR(255) UNIQUE NOT NULL,&#10;  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP&#10;);"
                value={dbSchemaText}
                onChange={(e) => setDbSchemaText(e.target.value)}
                className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[12px] p-4 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll leading-relaxed shadow-2xs"
              />
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Existing Specifications & Documentation</h3>
                  <p className="text-xs text-[#667085]">Upload `.md`/`.txt`/`.json`/`.zip` document files or paste legacy specification text.</p>
                </div>

                <label className="px-3.5 py-2 bg-[#F8F8F7] border border-[#ECEEF1] hover:border-[#7157F5] text-[#7157F5] font-semibold text-xs rounded-[8px] cursor-pointer transition flex items-center space-x-1.5 shrink-0 shadow-2xs">
                  <i className={`fas ${isUploadingDoc ? 'fa-circle-notch fa-spin' : 'fa-file-upload'} text-xs`}></i>
                  <span>Upload Document File (.md, .txt, .zip)</span>
                  <input
                    type="file"
                    accept=".md,.txt,.json,.yaml,.yml,.zip"
                    onChange={handleDocFileUpload}
                    disabled={isUploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-[#FAFAF9] border border-[#ECEEF1] rounded-[12px] p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Document Title e.g. Legacy Auth Architecture & OpenAPI v1 Spec"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full bg-white border border-[#ECEEF1] focus:border-[#7157F5] rounded-[8px] px-3 py-2 text-xs font-medium text-[#17181C] focus:outline-none shadow-2xs"
                />
                <textarea
                  rows={5}
                  placeholder="Paste document text or markdown specification content..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full bg-white border border-[#ECEEF1] focus:border-[#7157F5] rounded-[8px] p-3 text-xs font-mono text-[#17181C] focus:outline-none custom-scroll shadow-2xs"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddDocument}
                    disabled={!newDocTitle.trim() || !newDocContent.trim()}
                    className="px-4 py-2 bg-[#7157F5] hover:bg-[#5E43E2] text-white font-semibold text-xs rounded-[8px] transition disabled:opacity-40 cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <i className="fas fa-plus text-xs"></i>
                    <span>Add Document</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(brownfieldContext.documents || []).map((doc) => (
                  <div key={doc.id} className="bg-white border border-[#ECEEF1] rounded-[12px] p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-file-alt text-[#7157F5] text-xs"></i>
                        <span className="text-xs font-bold text-[#17181C]">{doc.title}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="text-[#98A2B3] hover:text-rose-600 p-1 transition cursor-pointer"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                    <p className="text-xs text-[#475467] line-clamp-3 bg-[#F8F8F7] border border-[#ECEEF1] p-2.5 rounded-[8px] font-mono">
                      {doc.content}
                    </p>
                  </div>
                ))}
                {(brownfieldContext.documents || []).length === 0 && (
                  <div className="text-center py-8 text-[#667085] text-xs border border-dashed border-[#ECEEF1] rounded-[12px] bg-[#FAFAF9]">
                    No legacy documents attached yet. Upload a file above or paste document text manually.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guardrails' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-[#17181C] uppercase tracking-wider">Legacy Architecture & Non-Negotiable Rules</h3>
                <p className="text-xs text-[#667085]">Specify existing tech versions, API route rules, and backward-compatibility guardrails for AI agents.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#344054]">Existing Tech Stack & Versions</label>
                  <input
                    type="text"
                    placeholder="e.g. Node.js 18, Express 4.18, PostgreSQL 14, React 18"
                    value={frameworkVersion}
                    onChange={(e) => setFrameworkVersion(e.target.value)}
                    className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[8px] px-3 py-2 text-xs text-[#17181C] focus:outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#344054]">API Prefix & Versioning Pattern</label>
                  <input
                    type="text"
                    placeholder="e.g. /api/v1"
                    value={apiPrefix}
                    onChange={(e) => setApiPrefix(e.target.value)}
                    className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[8px] px-3 py-2 text-xs text-[#17181C] focus:outline-none font-mono shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#344054]">Preservation Rules & Non-Negotiable Guardrails</label>
                <textarea
                  rows={5}
                  placeholder="e.g. 1. Do not break backward compatibility on existing POST /api/v1/login endpoint.&#10;2. Preserve JWT Auth Bearer token headers."
                  value={preservationRules}
                  onChange={(e) => setPreservationRules(e.target.value)}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] focus:border-[#7157F5] focus:bg-white rounded-[8px] p-3 text-xs text-[#17181C] focus:outline-none custom-scroll shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
