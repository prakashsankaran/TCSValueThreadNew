import React, { useState, useEffect } from 'react';
import { vectorService } from '../../services/vectorService';

export default function AdminVectorDb() {
  const [artefacts, setArtefacts] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('frugalforge_artifacts');
  const [activeTab, setActiveTab] = useState('points'); // 'points' | 'search' | 'schema'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedPointId, setExpandedPointId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPoint, setNewPoint] = useState({
    title: '',
    artefactType: 'Specification',
    content: ''
  });

  const fetchArtefacts = async () => {
    const list = await vectorService.getArtefacts();
    setArtefacts(list);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchArtefacts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchArtefacts();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await vectorService.searchArtefacts(searchQuery, 5);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPoint.title || !newPoint.content) return;
    await vectorService.storeArtefact(newPoint);
    setNewPoint({ title: '', artefactType: 'Specification', content: '' });
    setIsAddModalOpen(false);
    fetchArtefacts();
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Delete vector point "${id}" from ChromaDB?`)) {
      await vectorService.deleteArtefact(id);
      fetchArtefacts();
      setSearchResults(searchResults.filter(r => r.id !== id));
    }
  };

  const collectionsList = [
    { name: 'frugalforge_artifacts', pointsCount: artefacts.length, dimension: 384, distance: 'Cosine' },
    { name: 'sdlc_user_stories', pointsCount: 14, dimension: 384, distance: 'Cosine' },
    { name: 'architecture_adrs', pointsCount: 8, dimension: 384, distance: 'Cosine' }
  ];

  return (
    <div className="text-white fade-in space-y-4 font-mono text-xs p-1">
      {/* Main 2-Column Explorer View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column: Collections Tree Sidebar */}
        <div className="lg:col-span-1 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans flex items-center space-x-1.5">
              <i className="fas fa-cubes text-purple-400"></i>
              <span>Collections ({collectionsList.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {collectionsList.map((col) => (
              <button
                key={col.name}
                onClick={() => setSelectedCollection(col.name)}
                className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col space-y-1 ${
                  selectedCollection === col.name
                    ? 'bg-purple-950/40 border-purple-500/50 text-white'
                    : 'bg-[#060913]/60 border-slate-800 text-slate-400 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs truncate text-purple-300">{col.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {col.name === 'frugalforge_artifacts' ? artefacts.length : col.pointsCount} pts
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                  <span>Size: {col.dimension}-D</span>
                  <span>•</span>
                  <span>Dist: {col.distance}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Collection Metadata Tree */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              Collection Schema Info
            </span>
            <pre className="bg-[#060913] border border-slate-800/80 rounded-xl p-3 text-[10px] text-emerald-400 overflow-x-auto custom-scroll">
{JSON.stringify({
  collection: selectedCollection,
  engine: "ChromaDB",
  status: "green",
  vectors_count: artefacts.length,
  config: {
    params: {
      vectors: { size: 384, distance: "Cosine" }
    }
  }
}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Right Main Explorer: Point & Payload JSON Inspector */}
        <div className="lg:col-span-3 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl flex flex-col">
          
          {/* Explorer Sub-Tabs */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('points')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-2 font-sans ${
                  activeTab === 'points'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <i className="fas fa-stream"></i>
                <span>Raw Vector Points ({artefacts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-2 font-sans ${
                  activeTab === 'search'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <i className="fas fa-terminal"></i>
                <span>Vector Query Console</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline mr-1">
                Format: <span className="text-purple-400 font-bold">JSON Payload</span>
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold py-1.5 px-3 rounded-xl shadow transition flex items-center space-x-1.5 text-[11px] cursor-pointer font-sans"
                title="Refresh Vector Points from ChromaDB"
              >
                <i className={`fas fa-sync-alt text-[10px] ${isRefreshing ? 'animate-spin text-purple-400' : ''}`}></i>
                <span>Refresh Data</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3.5 rounded-xl shadow transition flex items-center space-x-1.5 text-[11px] cursor-pointer font-sans"
              >
                <i className="fas fa-plus text-[10px]"></i>
                <span>Upsert Point</span>
              </button>
            </div>
          </div>

          {/* TAB 1: RAW VECTOR POINTS (JSON TREE VIEWER) */}
          {activeTab === 'points' && (
            <div className="space-y-4 flex-1">
              {artefacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <i className="fas fa-box-open text-3xl mb-2 opacity-40"></i>
                  <p>No vector points indexed in collection "{selectedCollection}".</p>
                </div>
              ) : (
                artefacts.map((art, idx) => {
                  const isExpanded = expandedPointId === art.id;
                  const mockVector = art.vector || new Array(384).fill(0.042);
                  const vectorSnippet = `[ ${mockVector.slice(0, 5).map(v => Number(v).toFixed(4)).join(', ')}, ... ${mockVector.length - 5} more floats ]`;

                  const pointJsonObject = {
                    id: art.id || `vec-${idx + 1}`,
                    vector: isExpanded ? mockVector : vectorSnippet,
                    payload: {
                      artefactId: art.artefactId || `art-${idx + 1}`,
                      title: art.title,
                      artefactType: art.artefactType,
                      content: art.content,
                      createdAt: art.createdAt || new Date().toISOString()
                    }
                  };

                  return (
                    <div key={art.id || idx} className="bg-[#060913] border border-slate-800 rounded-xl overflow-hidden shadow">
                      {/* Point Header Bar */}
                      <div className="bg-slate-900/60 p-3 flex justify-between items-center border-b border-slate-800">
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">
                            Point #{idx + 1}
                          </span>
                          <span className="font-bold text-white font-sans text-xs">{art.title}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            {art.artefactType}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setExpandedPointId(isExpanded ? null : art.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-purple-300 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            {isExpanded ? 'Collapse Vector Array' : 'Expand Full Vector Array'}
                          </button>
                          <button
                            onClick={() => handleDelete(art.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-[10px] transition cursor-pointer"
                            title="Delete Point"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>

                      {/* Raw JSON Code Block */}
                      <pre className="p-4 text-[11px] text-indigo-300 font-mono overflow-x-auto custom-scroll leading-relaxed">
{JSON.stringify(pointJsonObject, null, 2)}
                      </pre>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: VECTOR QUERY CONSOLE */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <input
                  type="text"
                  placeholder='Enter search query prompt e.g. "RMA refund workflow"...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#060913] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition flex items-center space-x-2 cursor-pointer font-sans"
                >
                  {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-play"></i>}
                  <span>Execute Vector Query</span>
                </button>
              </form>

              {/* Raw JSON Response Output */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 font-sans uppercase tracking-wider">
                      Vector Query JSON Response ({searchResults.length} Points Matched)
                    </span>
                  </div>
                  <pre className="bg-[#060913] border border-purple-500/40 rounded-xl p-4 text-[11px] text-emerald-400 font-mono overflow-x-auto custom-scroll max-h-[500px]">
{JSON.stringify({
  query: searchQuery,
  collection: selectedCollection,
  top_k: 5,
  result_count: searchResults.length,
  result_points: searchResults.map(r => ({
    id: r.id,
    similarity_score: r.similarityScore,
    payload: {
      title: r.title,
      artefactType: r.artefactType,
      content: r.content
    }
  }))
}, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Upsert Vector Point Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-8 font-sans">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <i className="fas fa-plus-circle text-purple-400"></i>
              <span>Upsert Point to Collection: {selectedCollection}</span>
            </h2>

            <form onSubmit={handleAddPoint} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wide">Document Title</label>
                <input 
                  type="text"
                  required
                  value={newPoint.title}
                  onChange={(e) => setNewPoint({...newPoint, title: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
                  placeholder="e.g. Authentication ADR-006"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wide">Artifact Type Payload</label>
                <select 
                  value={newPoint.artefactType}
                  onChange={(e) => setNewPoint({...newPoint, artefactType: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer font-mono text-xs"
                >
                  <option value="Specification">Specification</option>
                  <option value="Architecture ADR">Architecture ADR</option>
                  <option value="User Story">User Story</option>
                  <option value="Code Artifact">Code Artifact</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wide">Content Text Payload</label>
                <textarea 
                  rows="4"
                  required
                  value={newPoint.content}
                  onChange={(e) => setNewPoint({...newPoint, content: e.target.value})}
                  className="w-full bg-[#060913] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 custom-scroll font-mono text-xs"
                  placeholder="Enter document content to generate 384-D vector point embedding..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
                >
                  <i className="fas fa-database"></i>
                  <span>Upsert Point</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
