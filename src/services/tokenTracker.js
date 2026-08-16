// Dynamic Local Token Usage & History Tracking Service
const TOKEN_STORAGE_KEY = 'sdd_token_usage_history';

export const tokenTracker = {
  getHistory: () => {
    try {
      const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  getSummary: () => {
    const history = tokenTracker.getHistory();
    let grandTotalTokens = 0;
    let grandTotalPromptTokens = 0;
    let grandTotalCompletionTokens = 0;
    const modelMap = {};

    history.forEach(item => {
      grandTotalTokens += item.totalTokens || 0;
      grandTotalPromptTokens += item.promptTokens || 0;
      grandTotalCompletionTokens += item.completionTokens || 0;

      const m = item.model || 'unknown';
      if (!modelMap[m]) {
        modelMap[m] = { model: m, totalTokens: 0, promptTokens: 0, completionTokens: 0, callCount: 0 };
      }
      modelMap[m].totalTokens += item.totalTokens || 0;
      modelMap[m].promptTokens += item.promptTokens || 0;
      modelMap[m].completionTokens += item.completionTokens || 0;
      modelMap[m].callCount += 1;
    });

    return {
      grandTotalTokens,
      grandTotalPromptTokens,
      grandTotalCompletionTokens,
      totalCalls: history.length,
      byModel: Object.values(modelMap)
    };
  },

  recordCall: ({ agentName, model, promptText = '', outputText = '', promptTokens = null, completionTokens = null }) => {
    const pTokens = promptTokens !== null ? Number(promptTokens) : (promptText ? Math.ceil(promptText.length / 4) : 0);
    const cTokens = completionTokens !== null ? Number(completionTokens) : (outputText ? Math.ceil(outputText.length / 4) : 0);
    const total = pTokens + cTokens;

    const newRecord = {
      id: 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      agentName: agentName || 'SDLC Agent',
      model: model || 'gemini-2.5-pro',
      promptTokens: pTokens,
      completionTokens: cTokens,
      totalTokens: total,
      timestamp: new Date().toISOString()
    };

    const currentHistory = tokenTracker.getHistory();
    const updatedHistory = [newRecord, ...currentHistory];

    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(updatedHistory));
      window.dispatchEvent(new Event('token_usage_updated'));
      fetch('http://localhost:7001/api/tokens/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to save token record', e);
    }

    return newRecord;
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event('token_usage_updated'));
    } catch (e) {}
  }
};
