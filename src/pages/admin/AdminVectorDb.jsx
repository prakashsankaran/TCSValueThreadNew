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
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17181C] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-sm shrink-0">
              <i className="fas fa-database"></i>
            </div>
            <span>Vector Store & Semantic Index Explorer</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Browse ChromaDB vector embeddings, examine 384-D vector payloads, and execute live cosine similarity queries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-[#F8F8F7] text-[#344054] border border-[#ECEEF1] font-semibold py-2 px-3 rounded-[10px] shadow-2xs transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="Refresh Vector Points from ChromaDB"
          >
            <i className={`fas fa-sync-alt text-[10px] text-[#7157F5] ${isRefreshing ? 'animate-spin' : ''}`}></i>
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#7157F5] hover:bg-[#5F46D8] text-white font-semibold py-2 px-3.5 rounded-[10px] shadow-2xs transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <i className="fas fa-plus text-[10px]"></i>
            <span>Upsert Point</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Explorer View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Column: Collections Tree Sidebar */}
        <div className="lg:col-span-1 bg-white border border-[#ECEEF1] rounded-[18px] p-4 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center border-b border-[#F2F4F7] pb-3">
            <span className="text-xs font-bold text-[#17181C] uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-cubes text-[#7157F5]"></i>
              <span>Collections ({collectionsList.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {collectionsList.map((col) => (
              <button
                key={col.name}
                onClick={() => setSelectedCollection(col.name)}
                className={`w-full text-left p-3 rounded-[12px] border transition cursor-pointer flex flex-col space-y-1 ${
                  selectedCollection === col.name
                    ? 'bg-purple-50 border-purple-300 text-[#17181C] shadow-2xs'
                    : 'bg-[#F8F8F7] border-[#ECEEF1] text-[#667085] hover:bg-white hover:border-[#D0D5DD]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-xs truncate ${selectedCollection === col.name ? 'text-purple-800' : 'text-[#17181C]'}`}>{col.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#ECEEF1] text-[10px] text-[#344054] font-mono">
                    {col.name === 'frugalforge_artifacts' ? artefacts.length : col.pointsCount} pts
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#667085]">
                  <span>Size: {col.dimension}-D</span>
                  <span>•</span>
                  <span>Dist: {col.distance}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Collection Metadata Tree */}
          <div className="pt-3 border-t border-[#F2F4F7] space-y-2">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block font-sans">
              Collection Schema Info
            </span>
            <pre className="bg-[#17181C] text-emerald-400 border border-slate-800 rounded-[12px] p-3 text-[10px] overflow-x-auto custom-scroll">
{JSON.stringify({
  collection: selectedCollection,
  engine: "ChromaDB",
  status: "active",
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
        <div className="lg:col-span-3 bg-white border border-[#ECEEF1] rounded-[18px] p-5 space-y-4 shadow-2xs flex flex-col">
          
          {/* Explorer Sub-Tabs */}
          <div className="flex justify-between items-center border-b border-[#F2F4F7] pb-3 flex-wrap gap-2">
            <div className="flex bg-[#F8F8F7] p-1 rounded-[10px] border border-[#ECEEF1]">
              <button
                onClick={() => setActiveTab('points')}
                className={`px-3.5 py-1.5 rounded-[8px] font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'points'
                    ? 'bg-[#7157F5] text-white shadow-2xs'
                    : 'text-[#667085] hover:text-[#17181C]'
                }`}
              >
                <i className="fas fa-stream text-[10px]"></i>
                <span>Raw Vector Points ({artefacts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`px-3.5 py-1.5 rounded-[8px] font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'search'
                    ? 'bg-[#7157F5] text-white shadow-2xs'
                    : 'text-[#667085] hover:text-[#17181C]'
                }`}
              >
                <i className="fas fa-terminal text-[10px]"></i>
                <span>Vector Query Console</span>
              </button>
            </div>

            <span className="text-xs text-[#667085] hidden sm:inline">
              Payload: <span className="text-[#7157F5] font-semibold">Normalized JSON</span>
            </span>
          </div>

          {/* TAB 1: RAW VECTOR POINTS (JSON TREE VIEWER) */}
          {activeTab === 'points' && (
            <div className="space-y-4 flex-1">
              {artefacts.length === 0 ? (
                <div className="text-center py-12 text-[#667085]">
                  <i className="fas fa-box-open text-3xl mb-2 text-[#98A2B3]"></i>
                  <p className="text-xs">No vector points indexed in collection "{selectedCollection}".</p>
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
                    <div key={art.id || idx} className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[14px] overflow-hidden shadow-2xs">
                      {/* Point Header Bar */}
                      <div className="bg-white p-3 flex justify-between items-center border-b border-[#ECEEF1]">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 font-mono font-bold text-[10px] border border-purple-200">
                            Point #{idx + 1}
                          </span>
                          <span className="font-bold text-[#17181C] text-xs">{art.title}</span>
                          <span className="px-2 py-0.5 rounded-[6px] bg-[#F8F8F7] text-[#667085] text-[10px] border border-[#ECEEF1]">
                            {art.artefactType}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedPointId(isExpanded ? null : art.id)}
                            className="bg-white hover:bg-[#F8F8F7] border border-[#ECEEF1] text-[#7157F5] px-2.5 py-1 rounded-[6px] text-[10px] font-semibold transition cursor-pointer shadow-2xs"
                          >
                            {isExpanded ? 'Collapse Vector Array' : 'Expand Full Vector Array'}
                          </button>
                          <button
                            onClick={() => handleDelete(art.id)}
                            className="w-6 h-6 rounded-[6px] bg-white hover:bg-rose-50 border border-[#ECEEF1] hover:border-rose-200 text-rose-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            title="Delete Point"
                          >
                            <i className="fas fa-trash-alt text-[9px]"></i>
                          </button>
                        </div>
                      </div>

                      {/* Raw JSON Code Block */}
                      <pre className="p-4 text-[11px] text-[#17181C] font-mono overflow-x-auto custom-scroll leading-relaxed bg-[#FAFAF9]">
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
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder='Enter search query prompt e.g. "RMA refund workflow"...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition"
                />
                <button
                  type="submit"
                  className="bg-[#7157F5] hover:bg-[#5F46D8] text-white px-5 py-2.5 rounded-[10px] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-play text-[10px]"></i>}
                  <span>Execute Query</span>
                </button>
              </form>

              {/* Raw JSON Response Output */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                      Vector Query JSON Response ({searchResults.length} Points Matched)
                    </span>
                  </div>
                  <pre className="bg-[#17181C] text-emerald-400 border border-slate-800 rounded-[14px] p-4 text-[11px] font-mono overflow-x-auto custom-scroll max-h-[500px]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#ECEEF1] rounded-[20px] p-6 w-full max-w-lg shadow-2xl space-y-4 my-8 font-sans">
            <div className="flex justify-between items-center border-b border-[#F2F4F7] pb-3">
              <h2 className="text-sm font-bold text-[#17181C] flex items-center gap-2">
                <i className="fas fa-plus-circle text-[#7157F5]"></i>
                <span>Upsert Point to Collection: {selectedCollection}</span>
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#17181C] transition cursor-pointer p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddPoint} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#344054] font-semibold mb-1">Document Title</label>
                <input 
                  type="text"
                  required
                  value={newPoint.title}
                  onChange={(e) => setNewPoint({...newPoint, title: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white text-xs"
                  placeholder="e.g. Authentication ADR-006"
                />
              </div>

              <div>
                <label className="block text-[#344054] font-semibold mb-1">Artifact Type Payload</label>
                <select 
                  value={newPoint.artefactType}
                  onChange={(e) => setNewPoint({...newPoint, artefactType: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] cursor-pointer text-xs"
                >
                  <option value="Specification">Specification</option>
                  <option value="Architecture ADR">Architecture ADR</option>
                  <option value="User Story">User Story</option>
                  <option value="Code Artifact">Code Artifact</option>
                </select>
              </div>

              <div>
                <label className="block text-[#344054] font-semibold mb-1">Content Text Payload</label>
                <textarea 
                  rows="4"
                  required
                  value={newPoint.content}
                  onChange={(e) => setNewPoint({...newPoint, content: e.target.value})}
                  className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] p-2.5 text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white custom-scroll text-xs resize-none"
                  placeholder="Enter document content to generate 384-D vector point embedding..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ECEEF1]">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#667085] hover:bg-[#F8F8F7] border border-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#7157F5] hover:bg-[#5F46D8] text-white px-5 py-2 rounded-[10px] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <i className="fas fa-database text-[10px]"></i>
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
