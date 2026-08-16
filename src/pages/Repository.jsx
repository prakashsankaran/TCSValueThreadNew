import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Repository() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    setError(null);
    try {
      const data = await api.getDocuments();
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError('Failed to fetch documents listing.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while loading documents.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const data = await api.searchDocuments(searchQuery);
      if (data.success) {
        setSearchResults(data.hits || []);
      } else {
        setError('Search failed to retrieve results.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred during semantic search.');
    } finally {
      setIsSearching(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getAgentLabel = (agentId) => {
    const labels = {
      'functional-spec': 'Functional Spec Agent',
      'spec-to-story': 'Spec to Story Agent',
      'user-stories': 'User Stories Agent',
      'tech-architecture': 'Tech Architecture Agent',
      'database-design': 'Database Design Agent',
      'ux-wireframe': 'UX Wireframe Agent',
      'test-cases': 'Test Cases Agent',
      'traceability-matrix': 'Traceability Matrix Agent',
      'review-agent': 'Review Agent'
    };
    return labels[agentId] || agentId;
  };

  const getFileIcon = (format) => {
    switch (format) {
      case 'html': return 'fab fa-html5 text-orange-400';
      case 'sql': return 'fas fa-database text-blue-400';
      case 'md': return 'fab fa-markdown text-indigo-400';
      default: return 'far fa-file-alt text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center bg-slate-900/10 border border-slate-900 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center">
            <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mr-2.5">
              <i className="fas fa-search-dollar"></i>
            </span> 
            Semantic Document Repository
          </h2>
          <p className="text-xs text-slate-500">Query the workspace vector database and view archived agent generation files</p>
        </div>
        
        <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-brain text-[10px]"></i>
            <span>Vector Search</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-150 flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'documents' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="far fa-folder-open text-[10px]"></i>
            <span>All Documents ({documents.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-center space-x-2">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          <form onSubmit={handleSearchSubmit} className="glass-panel p-5 rounded-2xl flex flex-col space-y-4 shadow-xl border border-slate-800">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Semantic Query Engine</h3>
            
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="fas fa-search text-slate-500 text-xs"></i>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask a question or enter keywords (e.g. 'What are the rules for returns >= $100?')"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 transition"
                  disabled={isSearching}
                />
              </div>
              <button
                type="submit"
                className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
                  isSearching ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <i className="fas fa-circle-notch animate-spin"></i>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-location-arrow"></i>
                    <span>Execute</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-[10px] text-slate-500">
              <span><i className="fas fa-info-circle mr-1"></i> Powered by Gemini Embeddings & Local Cosine Index</span>
              <span>•</span>
              <span>Collection: <code>agent_documents</code></span>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto custom-scroll pr-1">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Retrieving matched vectors from database...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                <div className="p-4 bg-indigo-500/5 text-slate-600 rounded-full">
                  <i className="fas fa-vector-square text-3xl"></i>
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="text-xs font-bold text-slate-400">No Semantic Results</p>
                  <p className="text-[11px] text-slate-600">Enter a query above to search through enqueued specifications, stories, and database designs.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Found {searchResults.length} semantic matches</span>
                </div>
                
                {searchResults.map((hit) => {
                  const scorePercentage = Math.round(hit.score * 100);
                  const isHighMatch = hit.score > 0.6;
                  
                  return (
                    <div key={hit.id} className="bg-[#0b0f19] border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition duration-150 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                            <i className={getFileIcon(hit.payload.format) + " text-sm"}></i>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-wide">{hit.payload.filename}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">{getAgentLabel(hit.payload.agentId)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isHighMatch 
                              ? 'bg-green-950/30 text-green-400 border-green-900/50' 
                              : 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50'
                          }`}>
                            <i className="fas fa-bullseye mr-1"></i> Similarity: {scorePercentage}%
                          </div>
                          
                          <a
                            href={api.getDocumentDownloadUrl(hit.payload.filename)}
                            download
                            className="p-2 bg-slate-900 hover:bg-indigo-950/30 hover:border-indigo-900 text-slate-400 hover:text-indigo-400 border border-slate-800 rounded-lg transition"
                            title="Download File"
                          >
                            <i className="fas fa-download text-xs"></i>
                          </a>
                        </div>
                      </div>

                      <div className="bg-slate-950/50 border border-slate-900/50 rounded-xl p-3.5 text-xs text-slate-400 font-sans leading-relaxed whitespace-pre-wrap">
                        {hit.payload.text}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>Chunk index: #{hit.payload.chunkIndex}</span>
                        <span>Generated: {new Date(hit.payload.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="flex-1 overflow-y-auto custom-scroll">
          {isLoadingDocs ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              <div className="p-4 bg-indigo-500/5 text-slate-600 rounded-full">
                <i className="far fa-folder text-3xl"></i>
              </div>
              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-bold text-slate-400">Archive is Empty</p>
                <p className="text-[11px] text-slate-600">Run any developer agent (like Spec to Story or UX Wireframe) to compile files and archive them here.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const format = doc.filename.split('.').pop();
                return (
                  <div key={doc.filename} className="bg-[#0b0f19] border border-slate-800 hover:border-indigo-900 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:shadow-lg transition duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg shrink-0">
                          <i className={getFileIcon(format) + " text-base"}></i>
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white tracking-wide truncate" title={doc.filename}>
                            {doc.filename}
                          </h4>
                          <p className="text-[10px] text-slate-500">{formatBytes(doc.size)}</p>
                        </div>
                      </div>
                      
                      <a
                        href={api.getDocumentDownloadUrl(doc.filename)}
                        download
                        className="p-2 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition"
                        title="Download Original File"
                      >
                        <i className="fas fa-download text-xs"></i>
                      </a>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-900 pt-3 text-[9px] text-slate-500">
                      <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                      <span className="uppercase font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{format}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
