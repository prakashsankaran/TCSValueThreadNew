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
    <div className="space-y-6 fade-in pb-10">
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
            <i className="fas fa-balance-scale text-indigo-500 mr-3"></i> Debate Circles Config
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure multi-agent debate circles to optimize generated artifacts. Assign proponent, challenger, and moderator personas to engage in iterative peer-review consensus loops.
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl border border-indigo-500/30 shadow-lg flex items-center space-x-2 transition cursor-pointer"
          >
            <i className="fas fa-plus"></i>
            <span>Create Debate Circle</span>
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-8 bg-slate-950/50">
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center">
              <i className="fas fa-sliders-h text-indigo-400 mr-2"></i> Debate Parameters
            </h2>
            <button 
              onClick={() => setIsCreating(false)}
              className="text-slate-500 hover:text-white cursor-pointer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debate Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. SDLC Debate Circle"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic / Artefact</label>
              <input 
                type="text" 
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
                placeholder="e.g. SDLC Architecture & Security Artefacts"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debate Rounds: <span className="text-indigo-400">{formData.rounds}</span></label>
              <input 
                type="range" 
                min="1" max="10" 
                value={formData.rounds}
                onChange={e => setFormData({...formData, rounds: parseInt(e.target.value)})}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consensus Mode</label>
              <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
                {['Majority', 'Unanimous', 'Moderated'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFormData({...formData, consensusMode: mode})}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      formData.consensusMode === mode 
                        ? 'bg-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-500/20 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Persona Mapping Cards */}
          <div className="grid grid-cols-3 gap-6 pt-4">
            
            {/* Proponent */}
            <div className="bg-slate-900/40 border border-blue-900/40 rounded-2xl p-5 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Proponent</span>
              
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-slate-900 shadow-lg">
                P
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Defends the Artifact</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Presents the primary architectural argument and design perspective</p>
              </div>

              <select 
                value={formData.proponent}
                onChange={e => setFormData({...formData, proponent: e.target.value})}
                className="w-full mt-auto bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center font-bold"
              >
                {personas.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Moderator */}
            <div className="bg-slate-900/40 border border-purple-900/40 rounded-2xl p-5 flex flex-col items-center text-center space-y-4 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Moderator</span>
              
              <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl border-4 border-slate-900 shadow-lg">
                M
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Guides the Debate</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Synthesises arguments, consolidates pros/cons and delivers final recommendation</p>
              </div>

              <select 
                value={formData.moderator}
                onChange={e => setFormData({...formData, moderator: e.target.value})}
                className="w-full mt-auto bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 cursor-pointer appearance-none text-center font-bold"
              >
                {personas.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Challenger */}
            <div className="bg-slate-900/40 border border-rose-900/40 rounded-2xl p-5 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Challenger</span>
              
              <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-lg border-2 border-slate-900 shadow-lg">
                C
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Critiques the Artifact</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Reviews and challenges arguments from a security & risk perspective</p>
              </div>

              <select 
                value={formData.challenger}
                onChange={e => setFormData({...formData, challenger: e.target.value})}
                className="w-full mt-auto bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500 cursor-pointer appearance-none text-center font-bold"
              >
                {personas.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!formData.name || !formData.topic}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl border flex items-center transition cursor-pointer ${
                !formData.name || !formData.topic 
                  ? 'bg-indigo-900/30 text-indigo-500/50 border-indigo-900/30 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-lg'
              }`}
            >
              <i className="fas fa-save mr-2"></i> Save Configuration
            </button>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {circles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500">
              <i className="fas fa-balance-scale text-4xl mb-4 opacity-50"></i>
              <h2 className="text-lg font-bold text-slate-400">No Debate Circles Configured</h2>
              <p className="text-xs mt-2 max-w-md text-center">
                Create a debate circle to assign proponent, challenger, and moderator personas for automated artifact optimization.
              </p>
            </div>
          ) : (
            circles.map(circle => (
              <div key={circle.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 hover:border-indigo-500/30 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{circle.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1"><i className="fas fa-folder mr-1.5 text-amber-500"></i>{circle.topic}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-bold text-indigo-400 uppercase">
                      {circle.rounds} Rounds
                    </span>
                    <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-bold text-amber-400 uppercase">
                      {circle.consensusMode}
                    </span>
                    <button onClick={() => handleDelete(circle.id)} className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition border border-rose-500/20 cursor-pointer">
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 overflow-x-auto">
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0">P</span>
                    <span className="text-xs text-slate-300 font-semibold">{circle.proponent}</span>
                  </div>
                  <i className="fas fa-arrow-right text-slate-700 text-[10px] shrink-0"></i>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0">M</span>
                    <span className="text-xs text-slate-300 font-semibold">{circle.moderator}</span>
                  </div>
                  <i className="fas fa-arrow-right text-slate-700 text-[10px] shrink-0"></i>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0">C</span>
                    <span className="text-xs text-slate-300 font-semibold">{circle.challenger}</span>
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
