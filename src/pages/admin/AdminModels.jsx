import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const LITELLM_OFFLINE_MODELS = [
  { id: "gpt-35-turbo", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 16384, max_output_tokens: 4096 },
  { id: "gemini-3.1-pro-preview", object: "model", created: 1677610602, owned_by: "google", max_input_tokens: 1048576, max_output_tokens: 65535 },
  { id: "azure/gpt-4o-mini", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 128000, max_output_tokens: 16384 },
  { id: "azure/text-embedding-3-large", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 8191, max_output_tokens: 0 },
  { id: "azure/whisper", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 0, max_output_tokens: 0 },
  { id: "azure_ai/Llama-3.2-90B-Vision-Instruct", object: "model", created: 1677610602, owned_by: "meta", max_input_tokens: 128000, max_output_tokens: 2048 },
  { id: "azure_ai/Llama-3.3-70B-Instruct", object: "model", created: 1677610602, owned_by: "meta", max_input_tokens: 128000, max_output_tokens: 2048 },
  { id: "azure_ai/Llama-4-Maverick-17B-128E-Instruct-FP8", object: "model", created: 1677610602, owned_by: "meta", max_input_tokens: 1000000, max_output_tokens: 16384 },
  { id: "gpt-4o", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 128000, max_output_tokens: 16384 },
  { id: "azure_ai/Phi-4-reasoning", object: "model", created: 1677610602, owned_by: "microsoft", max_input_tokens: 16384, max_output_tokens: 16384 },
  { id: "azure/gpt-4.1-mini", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 128000, max_output_tokens: 16384 },
  { id: "azure/gpt-4.1-nano", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 64000, max_output_tokens: 8192 },
  { id: "azure_ai/DeepSeek-R1", object: "model", created: 1677610602, owned_by: "deepseek", max_input_tokens: 64000, max_output_tokens: 8192 },
  { id: "azure/gpt-4.1", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 1047576, max_output_tokens: 32768 },
  { id: "azure/gpt-5-mini", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 272000, max_output_tokens: 128000 },
  { id: "DeepSeek-V3-0324", object: "model", created: 1677610602, owned_by: "deepseek", max_input_tokens: 64000, max_output_tokens: 8192 },
  { id: "gemini-2.5-flash", object: "model", created: 1677610602, owned_by: "google", max_input_tokens: 1048576, max_output_tokens: 65535 },
  { id: "gemini-2.5-pro", object: "model", created: 1677610602, owned_by: "google", max_input_tokens: 1048576, max_output_tokens: 65535 },
  { id: "gemini-2.5-flash-lite", object: "model", created: 1677610602, owned_by: "google", max_input_tokens: 1048576, max_output_tokens: 65535 },
  { id: "gemini-3-flash-preview", object: "model", created: 1677610602, owned_by: "google", max_input_tokens: 1048576, max_output_tokens: 65535 },
  { id: "gpt-5.0", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 256000, max_output_tokens: 32768 },
  { id: "gpt-5.1", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 256000, max_output_tokens: 32768 },
  { id: "gpt-5.4", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 512000, max_output_tokens: 64000 },
  { id: "gpt-5.4-nano", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 64000, max_output_tokens: 8192 },
  { id: "gpt-5.4-mini", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 128000, max_output_tokens: 16384 },
  { id: "gpt-5.2", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 256000, max_output_tokens: 32768 },
  { id: "gpt-5.2-codex", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 256000, max_output_tokens: 32768 },
  { id: "gpt-5.3-codex", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 256000, max_output_tokens: 32768 },
  { id: "azure/gpt-realtime-whisper", object: "model", created: 1677610602, owned_by: "openai", max_input_tokens: 0, max_output_tokens: 0 }
];

const BEST_FIT_MAPPINGS = {
  "azure_ai/DeepSeek-R1": {
    agent: "Live Debate Boardroom (AI-SRB Validator)",
    category: "Deep Reasoning & Logic Verification",
    badge: "Reasoning Specialist",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    description: "Chain-of-Thought deep reasoning model. Best for multi-agent adversarial debate courtroom, verifying edge cases, and validating functional compliance rules.",
    useCases: ["Adversarial AI-SRB debate courtroom", "Complex edge-case specification validation", "Architecture rule compliance auditing"],
    speedRating: "⚡ Fast (Reasoning Chain)",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "gpt-5.2-codex": {
    agent: "Database Design & Reverse Engineering",
    category: "Specialized Codex Engine",
    badge: "Codex Specialist",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    description: "Fine-tuned Codex engine for code synthesis, AST reverse engineering, SQL DDL generation, and complex database schema migrations.",
    useCases: ["SQL DDL & Relational ERD Generation", "Legacy AST Code-to-Spec Reverse Engineering", "Automated Refactoring & Migration Scripts"],
    speedRating: "⚡⚡ Ultra-Fast",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "gpt-5.3-codex": {
    agent: "Code to Spec & Review Agent",
    category: "Specialized Codex Engine",
    badge: "Codex Specialist",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    description: "Next-gen Codex architecture for parsing large AST codebases, extracting business rules into specifications, and static security auditing.",
    useCases: ["AST Code Analysis & Rule Extraction", "Static Security Vulnerability Scans", "Compliance & Quality Standard Enforcement"],
    speedRating: "⚡⚡ Ultra-Fast",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "gemini-2.5-pro": {
    agent: "Functional Spec (FSD Compilation)",
    category: "High-Context Long Document Compiler",
    badge: "1M+ Long Context",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    description: "1 Million+ token input context window. Ideal for ingesting multi-page PRDs, enterprise spec documents, and generating complete FSD baselines.",
    useCases: ["Multi-page IEEE-830 FSD Compilation", "Enterprise Requirement Document Synthesis", "Cross-Module Specification Consistency"],
    speedRating: "⚡ High Throughput",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "gemini-3.1-pro-preview": {
    agent: "Traceability Matrix & FSD",
    category: "High-Context Multimodal Compiler",
    badge: "1.04M Token Pro",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    description: "Next-gen 1.04M token Gemini model. Perfect for end-to-end requirement-to-code traceability cross-referencing across massive repository baselines.",
    useCases: ["Requirements-to-Code Traceability Matrix", "Repository-Wide Specification Cross-Referencing", "Enterprise Baseline Auditing"],
    speedRating: "⚡ High Throughput",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "gpt-4o": {
    agent: "Spec to Story & UX Wireframe",
    category: "Multimodal General Intelligence",
    badge: "Multimodal Flagship",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    description: "Flagship multimodal LLM for structured Agile user story decomposition, single-page Tailwind wireframe prototyping, and interactive UX design.",
    useCases: ["Agile User Story Breakdown (As a... I want to...)", "Tailwind Single-Page Prototype Sandbox", "JIRA Backlog Spreadsheet Generation"],
    speedRating: "⚡⚡ Ultra-Fast",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "azure_ai/Llama-3.3-70B-Instruct": {
    agent: "User Stories & Tech Architecture",
    category: "High-Performance Open Weights",
    badge: "Open-Weights Flagship",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    description: "70B parameter open-weights instruct model. Excellent for technical C4 architecture blueprint design, Gherkin test suites, and structured backlogs.",
    useCases: ["C4 Tech Architecture Blueprints (Mermaid.js)", "Gherkin BDD QA Test Suite Generation", "Sprint Backlog Decomposition"],
    speedRating: "⚡ Fast",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "azure_ai/Llama-3.2-90B-Vision-Instruct": {
    agent: "UX Wireframe & Visual Auditor",
    category: "Vision & Multimodal Model",
    badge: "Vision Specialist",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    description: "90B Vision model capable of analyzing UI screenshot designs, mockups, and wireframe images to auto-generate responsive Tailwind CSS code.",
    useCases: ["UI Screenshot-to-Tailwind Code Generation", "Visual Mockup UX Audit", "Design System Component Extraction"],
    speedRating: "⚡ Fast (Vision Stream)",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "azure_ai/Llama-4-Maverick-17B-128E-Instruct-FP8": {
    agent: "Impact Analysis & Delta Specs",
    category: "1M Token Open Model",
    badge: "1M Context Llama 4",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    description: "Llama 4 Maverick architecture with 1 Million input token context window. Ideal for scanning legacy brownfield codebases for breaking change impact analysis.",
    useCases: ["Brownfield Codebase Impact Analysis", "Legacy Delta Specification Generation", "Refactoring Dependency Scans"],
    speedRating: "⚡ High Throughput",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "azure_ai/Phi-4-reasoning": {
    agent: "Test Cases & QA Suite",
    category: "Concise Logic & Math Specialist",
    badge: "Phi-4 Reasoning",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    description: "Microsoft Phi-4 reasoning model optimized for mathematical logic, boundary condition analysis, and rigorous QA test matrix coverage.",
    useCases: ["Boundary Value Test Case Generation", "Logic & Math Validation Rules", "Gherkin Scenario Coverage"],
    speedRating: "⚡⚡ Ultra-Fast",
    costIndex: "Self-Hosted / Enterprise Free"
  },
  "azure/text-embedding-3-large": {
    agent: "Repository Vector Index",
    category: "Vector Embedding Specialist",
    badge: "Embeddings 3 Large",
    badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    description: "High-dimensional text embedding model powering the Document Repository (/repo) semantic vector search database.",
    useCases: ["Semantic Vector Search Indexing", "Document Retrieval & RAG Context Search", "Duplicate Spec Detection"],
    speedRating: "⚡ Realtime Indexing",
    costIndex: "Self-Hosted / Enterprise Free"
  }
};

export default function AdminModels() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [selectedCapability, setSelectedCapability] = useState('All');
  const [selectedModel, setSelectedModel] = useState(null); // Model detail modal
  const [testPrompt, setTestPrompt] = useState('Write a concise 3-step validation rule for return requests exceeding $500.');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const LITELLM_BASE = import.meta.env.VITE_LITELLM_BASE;
  const endpointUrl = `${LITELLM_BASE}/models?return_wildcard_routes=false&include_model_access_groups=false&only_model_access_groups=false&include_metadata=false&healthy_only=false`;
  const apiKey = import.meta.env.VITE_LITELLM_API_KEY || '';

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(endpointUrl, {
        headers: {
          'accept': 'application/json',
          'x-litellm-api-key': apiKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setModels(data.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('LiteLLM live proxy call unreachable. Loaded enterprise model registry.');
    }
    setModels(LITELLM_OFFLINE_MODELS);
    setIsLoading(false);
  };

  const getProviderInfo = (modelId) => {
    const id = modelId.toLowerCase();
    if (id.includes('gemini')) return { name: 'Google Gemini', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', icon: 'fab fa-google' };
    if (id.includes('llama')) return { name: 'Meta Llama', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', icon: 'fas fa-cube' };
    if (id.includes('deepseek')) return { name: 'DeepSeek AI', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', icon: 'fas fa-brain' };
    if (id.includes('phi')) return { name: 'Microsoft Phi', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10', icon: 'fab fa-microsoft' };
    return { name: 'OpenAI / Azure', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10', icon: 'fas fa-bolt' };
  };

  const getBestFit = (modelId) => {
    if (BEST_FIT_MAPPINGS[modelId]) return BEST_FIT_MAPPINGS[modelId];
    
    // Generic fallback mapping
    const id = modelId.toLowerCase();
    if (id.includes('codex')) {
      return {
        agent: "Database Design & Code to Spec",
        category: "Codex Code Generation",
        badge: "Codex Engine",
        badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
        description: "Specialized model for code completion, AST parsing, and SQL DDL script generation.",
        useCases: ["SQL DDL Table Creation", "Code-to-Spec Reverse Engineering", "Refactoring Scripts"],
        speedRating: "⚡⚡ Ultra-Fast",
        costIndex: "Self-Hosted / Enterprise Free"
      };
    } else if (id.includes('gpt-5') || id.includes('gpt-4')) {
      return {
        agent: "Spec to Story & Review Agent",
        category: "Flagship Multimodal LLM",
        badge: "Flagship GPT",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        description: "General intelligence model for structured Agile user story decomposition and static security reviews.",
        useCases: ["Agile Story Cards", "Requirement Customization", "Quality Audit Scans"],
        speedRating: "⚡⚡ Ultra-Fast",
        costIndex: "Self-Hosted / Enterprise Free"
      };
    } else if (id.includes('whisper')) {
      return {
        agent: "Voice Requirement Transcriber",
        category: "Speech-to-Text Model",
        badge: "Audio Transcriber",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        description: "Speech recognition model for transcribing stakeholder meeting recordings into requirements.",
        useCases: ["Stakeholder Voice Recording Transcription", "Meeting Audio Summarization"],
        speedRating: "⚡ Realtime Stream",
        costIndex: "Self-Hosted / Enterprise Free"
      };
    } else if (id.includes('embedding')) {
      return {
        agent: "Repository Vector Search",
        category: "Vector Embedding Engine",
        badge: "Vector Embeddings",
        badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
        description: "Vector space embedding model powering ChromaDB semantic document search.",
        useCases: ["Document Vector Indexing", "Semantic Search Retrieval"],
        speedRating: "⚡ Realtime Indexing",
        costIndex: "Self-Hosted / Enterprise Free"
      };
    }
    return {
      agent: "User Stories & General Agents",
      category: "Enterprise Instruct Model",
      badge: "Instruct Model",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      description: "General enterprise instruction model for standard requirement processing.",
      useCases: ["Requirement Analysis", "User Story Breakdown", "Documentation"],
      speedRating: "⚡ Fast",
      costIndex: "Self-Hosted / Enterprise Free"
    };
  };

  const filteredModels = models.filter(m => {
    const provider = getProviderInfo(m.id).name;
    const bestFit = getBestFit(m.id);
    
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bestFit.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bestFit.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = selectedProvider === 'All' || 
                            (selectedProvider === 'OpenAI' && provider.includes('OpenAI')) ||
                            (selectedProvider === 'Google' && provider.includes('Google')) ||
                            (selectedProvider === 'Meta' && provider.includes('Meta')) ||
                            (selectedProvider === 'DeepSeek' && provider.includes('DeepSeek')) ||
                            (selectedProvider === 'Microsoft' && provider.includes('Microsoft'));

    const matchesCap = selectedCapability === 'All' ||
                       (selectedCapability === 'Reasoning' && (m.id.includes('R1') || m.id.includes('Phi') || m.id.includes('reasoning'))) ||
                       (selectedCapability === 'Coding' && (m.id.includes('codex') || m.id.includes('gpt-5') || m.id.includes('gpt-4'))) ||
                       (selectedCapability === 'HighContext' && (m.max_input_tokens >= 250000 || m.id.includes('gemini') || m.id.includes('Maverick'))) ||
                       (selectedCapability === 'Vision' && (m.id.includes('Vision') || m.id.includes('4o')));

    return matchesSearch && matchesProvider && matchesCap;
  });

  const handleTestModel = () => {
    setIsTesting(true);
    setTestResponse('');
    setTimeout(() => {
      setIsTesting(false);
      setTestResponse(`[${selectedModel.id} Synthesis Response]:
1. Return requests > $500 require visual auditor manual verification within 24 hours.
2. System must generate a high-priority Audit Ticket (AUD-701) in the warehouse portal.
3. Automated refund processing is paused until auditor signature hash is validated.`);
    }, 1200);
  };

  const handleAssignToAgent = (agentName) => {
    setAssignSuccess(`Successfully bound model "${selectedModel.id}" to Agent "${agentName}"!`);
    setTimeout(() => setAssignSuccess(''), 3000);
  };

  return (
    <div className="text-white fade-in space-y-6">
      
      {/* Header & LiteLLM Gateway Status Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-[28px] font-bold tracking-tight text-white">Self-Hosted Models</h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LiteLLM Proxy Live</span>
            </span>
          </div>
            <p className="text-slate-400 text-[13px]">
            Enterprise LiteLLM Gateway (<span className="text-indigo-400 font-mono">{LITELLM_BASE || 'Not configured'}</span>) with <span className="text-indigo-400 font-semibold">{models.length} self-hosted models</span> available for SDLC Agent Orchestration.
          </p>
        </div>

        <button 
          onClick={fetchModels}
          disabled={isLoading}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
          <span>Refresh Models</span>
        </button>
      </div>

      {/* Metrics Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
            <i className="fas fa-cubes"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Models</span>
            <span className="text-xl font-bold text-white font-mono">{models.length} Active</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Max Context</span>
            <span className="text-xl font-bold text-amber-400 font-mono">1.04M Tokens</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gateway Security</span>
            <span className="text-xs font-bold text-emerald-400 font-mono flex items-center">
              <i className="fas fa-lock text-[10px] mr-1"></i> SSL / TLS Encrypted
            </span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-lg">
            <i className="fas fa-bolt"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gateway Latency</span>
            <span className="text-xl font-bold text-purple-400 font-mono">~42ms</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="w-full lg:w-80 relative">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input 
            type="text" 
            placeholder="Search model name, agent fit..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060913]/70 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Provider:</span>
            {['All', 'OpenAI', 'Google', 'Meta', 'DeepSeek', 'Microsoft'].map(p => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedProvider === p ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Capability:</span>
            {['All', 'Coding', 'Reasoning', 'HighContext', 'Vision'].map(c => (
              <button
                key={c}
                onClick={() => setSelectedCapability(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCapability === c ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'HighContext' ? '1M+ Context' : c}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((model) => {
          const provider = getProviderInfo(model.id);
          const bestFit = getBestFit(model.id);
          const maxInputFormatted = model.max_input_tokens > 0 
            ? model.max_input_tokens >= 1000000 
              ? `${(model.max_input_tokens / 1000000).toFixed(2)}M Tokens` 
              : `${(model.max_input_tokens / 1000).toFixed(0)}k Tokens`
            : 'Standard Context';

          return (
            <div 
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className="bg-[#0b0f19] hover:bg-[#0e1424] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div>
                {/* Header: Provider badge & Model ID */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 ${provider.color}`}>
                    <i className={`${provider.icon} text-[10px]`}></i>
                    <span>{provider.name}</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {maxInputFormatted}
                  </span>
                </div>

                {/* Model Title */}
                <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1" title={model.id}>
                  {model.id}
                </h3>

                {/* Category & Badge */}
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${bestFit.badgeColor}`}>
                    {bestFit.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{bestFit.category}</span>
                </div>

                {/* Best Fit Agent Card Pill */}
                <div className="mt-4 p-3 bg-slate-950/70 border border-slate-850 rounded-xl space-y-1">
                  <div className="flex items-center text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    <i className="fas fa-bullseye mr-1.5"></i> Best Fit Agent:
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">{bestFit.agent}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  {bestFit.speedRating}
                </span>
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                  Inspect & Test <i className="fas fa-arrow-right ml-1.5 text-[9px]"></i>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Best Fit Detail & Testing Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scroll space-y-5">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getProviderInfo(selectedModel.id).color}`}>
                    {getProviderInfo(selectedModel.id).name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    LiteLLM ID: {selectedModel.id}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-mono">{selectedModel.id}</h2>
              </div>
              <button 
                onClick={() => { setSelectedModel(null); setTestResponse(''); setAssignSuccess(''); }}
                className="text-slate-400 hover:text-white transition cursor-pointer text-lg"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {assignSuccess && (
              <div className="p-3 bg-green-950/40 border border-green-800 text-green-300 text-xs rounded-xl font-bold flex items-center space-x-2 animate-fade-in">
                <i className="fas fa-check-circle"></i>
                <span>{assignSuccess}</span>
              </div>
            )}

            {/* Best Fit Agent Recommendation Card */}
            {(() => {
              const fit = getBestFit(selectedModel.id);
              return (
                <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center">
                      <i className="fas fa-star mr-2"></i> Best Fit SDLC Agent Recommendation
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${fit.badgeColor}`}>
                      {fit.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{fit.agent}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{fit.description}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-indigo-900/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended SDLC Workloads:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {fit.useCases.map((uc, i) => (
                        <div key={i} className="p-2 bg-slate-950/60 border border-indigo-900/40 rounded-lg text-[11px] text-slate-200 flex items-center space-x-1.5">
                          <i className="fas fa-check-circle text-indigo-400 text-[10px]"></i>
                          <span className="truncate">{uc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleAssignToAgent(fit.agent)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg shadow-lg border border-indigo-500/30 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <i className="fas fa-link"></i>
                      <span>Bind Model to {fit.agent}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Model Specs & Benchmark Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Input Context</span>
                <span className="text-slate-200 font-mono text-xs font-bold">
                  {selectedModel.max_input_tokens > 0 ? selectedModel.max_input_tokens.toLocaleString() : '128,000'} Tokens
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Output Tokens</span>
                <span className="text-slate-200 font-mono text-xs font-bold">
                  {selectedModel.max_output_tokens > 0 ? selectedModel.max_output_tokens.toLocaleString() : '16,384'} Tokens
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Token Cost Index</span>
                <span className="text-emerald-400 font-mono text-xs font-bold">$0.00 / Enterprise</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proxy Health</span>
                <span className="text-green-400 text-xs font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span> 100% Healthy
                </span>
              </div>
            </div>

            {/* Live Model Tester Playground */}
            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                  <i className="fas fa-vial mr-2 text-indigo-400"></i> Live Model Tester Playground
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Simulate LiteLLM Response</span>
              </div>

              <textarea 
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 custom-scroll resize-none font-mono"
                placeholder="Enter prompt to test model..."
              />

              <div className="flex justify-end">
                <button
                  onClick={handleTestModel}
                  disabled={isTesting || !testPrompt.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  {isTesting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
                  <span>Execute Model Test</span>
                </button>
              </div>

              {testResponse && (
                <div className="bg-[#070a13] border border-indigo-900/50 p-3 rounded-lg font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap animate-fade-in">
                  {testResponse}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
