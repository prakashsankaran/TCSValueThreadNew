import React, { useState, useEffect } from 'react';

export default function AdminDebateCircles() {
  const [circles, setCircles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const [personas, setPersonas] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    rounds: 3,
    consensusMode: 'Majority',
    proponent: '',
    moderator: '',
    challenger: ''
  });

  useEffect(() => {
    try {
      const savedCircles = JSON.parse(localStorage.getItem('sdd_debate_circles')) || [];
      setCircles(savedCircles);

      const savedPersonas = JSON.parse(localStorage.getItem('sdd_personas')) || [
        { name: 'Solution Architect', role: 'System & Stack Alignment' },
        { name: 'Security Engineer', role: 'OWASP & Data Isolation' },
        { name: 'Neutral Moderator', role: 'Synthesizes arguments' },
        { name: 'Product Owner', role: 'Requirements Coverage' }
      ];
      setPersonas(savedPersonas);

      if (savedPersonas.length >= 3) {
        setFormData(prev => ({
          ...prev,
          proponent: savedPersonas[0].name,
          moderator: savedPersonas[1].name,
          challenger: savedPersonas[2].name
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.topic) return;

    const newCircle = { ...formData, id: Date.now() };
    const updated = [...circles, newCircle];
    setCircles(updated);
    localStorage.setItem('sdd_debate_circles', JSON.stringify(updated));
    setIsCreating(false);
    setFormData({
      name: '',
      topic: '',
      rounds: 3,
      consensusMode: 'Majority',
      proponent: personas[0]?.name || '',
      moderator: personas[1]?.name || '',
      challenger: personas[2]?.name || ''
    });
  };

  const handleDelete = (id) => {
    const updated = circles.filter(c => c.id !== id);
    setCircles(updated);
    localStorage.setItem('sdd_debate_circles', JSON.stringify(updated));
  };

  return (
    <div className="fade-in space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17181C] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-sm shrink-0">
              <i className="fas fa-balance-scale"></i>
            </div>
            <span>Debate Circles Configuration</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1 max-w-2xl leading-relaxed">
            Configure multi-agent debate circles to optimize generated artifacts. Assign proponent, challenger, and moderator personas to engage in iterative peer-review consensus loops.
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-[#7157F5] hover:bg-[#5F46D8] text-white text-xs font-semibold rounded-[10px] shadow-2xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <i className="fas fa-plus text-[10px]"></i>
            <span>Create Debate Circle</span>
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white p-6 rounded-[18px] border border-[#ECEEF1] shadow-2xs space-y-6">
          
          <div className="flex justify-between items-center border-b border-[#ECEEF1] pb-4">
            <h2 className="text-sm font-bold text-[#17181C] flex items-center gap-2">
              <i className="fas fa-sliders-h text-[#7157F5]"></i>
              <span>Debate Parameters</span>
            </h2>
            <button 
              onClick={() => setIsCreating(false)}
              className="text-[#98A2B3] hover:text-[#17181C] cursor-pointer p-1"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054]">Debate Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. SDLC Architecture Consensus Circle"
                className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] px-3 py-2 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054]">Topic / Artefact Focus</label>
              <input 
                type="text" 
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
                placeholder="e.g. SDLC Architecture & Security Artefacts"
                className="w-full bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px] px-3 py-2 text-xs text-[#17181C] focus:outline-none focus:border-[#7157F5] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#344054] flex justify-between">
                <span>Debate Rounds</span>
                <span className="text-[#7157F5] font-bold">{formData.rounds} Rounds</span>
              </label>
              <input 
                type="range" 
                min="1" max="10" 
                value={formData.rounds}
                onChange={e => setFormData({...formData, rounds: parseInt(e.target.value)})}
                className="w-full accent-[#7157F5] h-2 bg-[#ECEEF1] rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054]">Consensus Mode</label>
              <div className="flex p-1 bg-[#F8F8F7] border border-[#ECEEF1] rounded-[10px]">
                {['Majority', 'Unanimous', 'Moderated'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFormData({...formData, consensusMode: mode})}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-[8px] transition cursor-pointer ${
                      formData.consensusMode === mode 
                        ? 'bg-[#7157F5] text-white shadow-2xs' 
                        : 'text-[#667085] hover:text-[#17181C]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Persona Mapping Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            
            {/* Proponent */}
            <div className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[14px] p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Proponent</span>
              
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                P
              </div>
              
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#17181C]">Defends the Artifact</h4>
                <p className="text-[10px] text-[#667085] leading-relaxed">Presents the primary architectural argument</p>
              </div>

              <select 
                value={formData.proponent}
                onChange={e => setFormData({...formData, proponent: e.target.value})}
                className="w-full mt-auto bg-white border border-[#ECEEF1] text-[#17181C] text-xs rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#7157F5] cursor-pointer text-center font-semibold"
              >
                {personas.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Moderator */}
            <div className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[14px] p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#7157F5]"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Moderator</span>
              
              <div className="w-10 h-10 rounded-full bg-[#7157F5] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                M
              </div>
              
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#17181C]">Guides the Debate</h4>
                <p className="text-[10px] text-[#667085] leading-relaxed">Synthesises arguments & delivers consensus</p>
              </div>

              <select 
                value={formData.moderator}
                onChange={e => setFormData({...formData, moderator: e.target.value})}
                className="w-full mt-auto bg-white border border-[#ECEEF1] text-[#17181C] text-xs rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#7157F5] cursor-pointer text-center font-semibold"
              >
                {personas.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Challenger */}
            <div className="bg-[#F8F8F7] border border-[#ECEEF1] rounded-[14px] p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Challenger</span>
              
              <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                C
              </div>
              
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#17181C]">Critiques the Artifact</h4>
                <p className="text-[10px] text-[#667085] leading-relaxed">Challenges arguments from a risk lens</p>
              </div>

              <select 
                value={formData.challenger}
                onChange={e => setFormData({...formData, challenger: e.target.value})}
                className="w-full mt-auto bg-white border border-[#ECEEF1] text-[#17181C] text-xs rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer text-center font-semibold"
              >
                {personas.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-[#ECEEF1] flex justify-end gap-2">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-[#667085] hover:bg-[#F8F8F7] text-xs font-semibold rounded-[10px] border border-transparent transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!formData.name || !formData.topic}
              className={`px-5 py-2 text-xs font-semibold rounded-[10px] flex items-center gap-1.5 transition cursor-pointer ${
                !formData.name || !formData.topic 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#7157F5] hover:bg-[#5F46D8] text-white shadow-2xs'
              }`}
            >
              <i className="fas fa-save text-[10px]"></i>
              <span>Save Configuration</span>
            </button>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {circles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#ECEEF1] rounded-[18px] bg-white text-[#667085] shadow-2xs">
              <i className="fas fa-balance-scale text-3xl mb-3 text-[#98A2B3]"></i>
              <h2 className="text-sm font-bold text-[#17181C]">No Debate Circles Configured</h2>
              <p className="text-xs mt-1 max-w-md text-center text-[#667085]">
                Create a debate circle to assign proponent, challenger, and moderator personas for automated artifact optimization.
              </p>
            </div>
          ) : (
            circles.map(circle => (
              <div key={circle.id} className="bg-white border border-[#ECEEF1] rounded-[18px] p-5 flex flex-col space-y-3.5 shadow-2xs hover:border-purple-200 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-[#17181C]">{circle.name}</h3>
                    <p className="text-xs text-[#667085] mt-0.5 flex items-center gap-1.5">
                      <i className="fas fa-folder text-amber-500"></i>
                      <span>{circle.topic}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 rounded-[6px] text-[10px] font-bold text-purple-700">
                      {circle.rounds} Rounds
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-[6px] text-[10px] font-bold text-amber-700">
                      {circle.consensusMode}
                    </span>
                    <button 
                      onClick={() => handleDelete(circle.id)} 
                      className="w-7 h-7 rounded-[8px] bg-white text-rose-600 hover:bg-rose-50 flex items-center justify-center transition border border-[#ECEEF1] hover:border-rose-200 cursor-pointer shadow-2xs ml-1"
                      title="Delete debate circle"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#F8F8F7] p-3 rounded-[12px] border border-[#ECEEF1] overflow-x-auto">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0">P</span>
                    <span className="text-xs text-[#344054] font-semibold">{circle.proponent}</span>
                  </div>
                  <i className="fas fa-arrow-right text-[#98A2B3] text-[10px] shrink-0"></i>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-[#7157F5] text-[8px] font-bold text-white flex items-center justify-center shrink-0">M</span>
                    <span className="text-xs text-[#344054] font-semibold">{circle.moderator}</span>
                  </div>
                  <i className="fas fa-arrow-right text-[#98A2B3] text-[10px] shrink-0"></i>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0">C</span>
                    <span className="text-xs text-[#344054] font-semibold">{circle.challenger}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
