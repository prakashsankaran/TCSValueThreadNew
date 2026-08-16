/**
 * Layer 0 Engine Registry & Model Adapters
 * Manages execution across T0 (Deterministic), T1 (Retrieval/ML), T2 (Local Cost-Optimized Model), T3 (Enterprise LLM), T4 (Human Authority)
 * Connected via configured MODEL_GATEWAY_URL (set in environment) for model synthesis.
 */

export const ENGINE_REGISTRY = {
  T0_DETERMINISTIC: {
    tier: 'T0',
    id: 't0_deterministic_rule_engine',
    name: 'T0 Deterministic Rule, Schema & Policy Engine',
    executionMode: 'DETERMINISTIC',
    latencyMs: 5,
    costEst: 0
  },
  T1_RETRIEVAL: {
    tier: 'T1',
    id: 't1_vector_search_engine',
    name: 'T1 Specialized Vector & Hybrid Retrieval Engine',
    executionMode: 'RETRIEVAL',
    latencyMs: 120,
    costEst: 0
  },
  T2_LOCAL_SLM: {
    tier: 'T2',
    id: 't2_local_cost_optimized_model',
    name: 'T2 Cost-Optimized Gateway Model (Gemini 2.5 Flash)',
    executionMode: 'SLM',
    modelName: 'gemini-2.5-flash',
    latencyMs: 800,
    costEst: 0.0001
  },
  T3_ENTERPRISE_LLM: {
    tier: 'T3',
    id: 't3_enterprise_llm_reasoning',
    name: 'T3 Enterprise High Intelligence Model (Google Gemini 2.5 Pro)',
    executionMode: 'LLM',
    modelName: 'gemini-2.5-pro',
    latencyMs: 2400,
    costEst: 0.005
  },
  T4_HUMAN: {
    tier: 'T4',
    id: 't4_human_authority_gate',
    name: 'T4 Human Authority Sign-off Gate',
    executionMode: 'HUMAN',
    latencyMs: 0,
    costEst: 0
  }
};

/**
 * Adapter to call Server Proxy for Google Gemini 2.5 Pro tasks
 */
export async function invokeModelAdapter({ modelName, prompt, systemInstruction, temperature = 0.2 }) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY || '';
  const selectedModel = modelName || process.env.ENTERPRISE_LLM_MODEL || 'gemini-2.5-pro';

  if (!apiKey) {
    return { success: false, status: 'UNAVAILABLE', error: 'Server GEMINI_API_KEY not configured.', latencyMs: Date.now() - startTime };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const contents = [ ...(systemInstruction ? [{ role: 'user', parts: [{ text: `[System Instruction]: ${systemInstruction}` }] }] : []), { role: 'user', parts: [{ text: prompt }] } ];

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature } }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      if (text && text.trim().length > 0) {
        const cTokens = Math.max(20, Math.ceil(text.length / 4));
        const pTokens = Math.max(20, Math.ceil(prompt.length / 4));
        const tTokens = pTokens + cTokens;

        try {
          fetch('http://localhost:7001/api/tokens/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentName: `LLM Intelligence Adapter (${selectedModel})`,
              model: selectedModel,
              promptTokens: pTokens,
              completionTokens: cTokens,
              totalTokens: tTokens
            })
          }).catch(() => {});
        } catch (e) {}

        return {
          success: true,
          status: 'SUCCESS',
          text: text.trim(),
          modelUsed: `Google ${selectedModel} (Google Gemini)`,
          latencyMs: Date.now() - startTime,
          tokens: { prompt: pTokens, completion: cTokens, total: tTokens }
        };
      }
    } else {
      const errText = await res.text();
      console.warn(`[EngineRegistry] Google Gemini returned HTTP ${res.status}: ${errText}`);
    }
  } catch (err) {
    console.warn(`[EngineRegistry] Google Gemini invocation note (${selectedModel}): ${err.message}`);
  }

  return {
    success: false,
    text: null,
    status: 'UNAVAILABLE',
    error: 'Google Gemini Gateway execution unverified.',
    latencyMs: Date.now() - startTime
  };
}
