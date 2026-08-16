/**
 * Layer 0 Client-Safe Metadata Constants
 * Production client code uses backend endpoints only.
 */

export const INPUT_TYPES = [
  { id: 'IDEA', label: 'New Idea / Business Concept', icon: 'fa-lightbulb text-amber-400' },
  { id: 'OPERATIONAL_INCIDENT', label: 'ServiceNow / ITSM Incident Ticket', icon: 'fa-exclamation-triangle text-rose-400' },
  { id: 'REGULATORY_MANDATE', label: 'Regulatory Policy / Mandatory Audit', icon: 'fa-gavel text-purple-400' },
  { id: 'TECHNICAL_DEBT', label: 'Technical Debt / Architecture Refactor', icon: 'fa-wrench text-cyan-400' }
];

export const SUBMITTER_PERSONAS = [
  { id: 'Delivery Manager', title: 'Delivery Manager', role: 'Delivery Manager' },
  { id: 'Business Sponsor / Idea Owner', title: 'Business Sponsor / Idea Owner', role: 'Business Sponsor / Idea Owner' },
  { id: 'Operations Lead / Incident Commander', title: 'Operations Lead / Incident Commander', role: 'Operations Lead / Incident Commander' },
  { id: 'Enterprise Architect', title: 'Enterprise Architect', role: 'Enterprise Architect' },
  { id: 'Store Associate', title: 'Store Associate / Retail Staff', role: 'Store Associate' },
  { id: 'Travel Lead', title: 'Travel Manager / Policy Admin', role: 'Travel Lead' },
  { id: 'Other', title: 'Other (Specify Custom Role)', role: 'Other' }
];

// Backward compatibility aliases
export const LAYER0_INPUT_TYPES = INPUT_TYPES;
export const LAYER0_PERSONAS = SUBMITTER_PERSONAS;

export const INTELLIGENCE_TIERS = {
  AUTO: {
    id: 'AUTO',
    label: 'AUTO (Task-Aware Minimum Sufficient Intelligence)',
    description: 'Minimum Sufficient Intelligence Router (T0 Rules -> T1 Vector Search -> T2 Local SLM -> T3 Enterprise LLM)',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    modelName: 'Task-Aware Router (T0 - T4)'
  },
  T0: {
    id: 'T0',
    label: 'T0 — Deterministic Rules & Calculators',
    description: 'Zero token cost deterministic rules, schema validation, policy checks & ROI calculators.',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    modelName: 'Deterministic Engine'
  },
  T1: {
    id: 'T1',
    label: 'T1 — Specialized Vector & Similarity Engine',
    description: 'Qdrant hybrid retrieval, embeddings, duplicate detection & reranking.',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    modelName: 'Vector & Similarity Engine'
  },
  T2: {
    id: 'T2',
    label: 'T2 — Local Cost-Optimized Model',
    description: 'Ollama / Local SLM (Qwen 7B/8B, Llama 8B, Gemma 9B).',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    modelName: 'Qwen 7B/8B (Local Cost-Optimized SLM)'
  },
  T3: {
    id: 'T3',
    label: 'T3 — Enterprise Large Language Model',
    description: 'Enterprise Reasoning LLM (DeepSeek-R1 / Enterprise GPT). Escalated only on section quality failure.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    modelName: 'DeepSeek-R1 / Enterprise GPT'
  },
  T4: {
    id: 'T4',
    label: 'T4 — Human Authority Gate',
    description: 'Human Review Board authorization & governance sign-off gate.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    modelName: 'Human Authority Gate'
  }
};
