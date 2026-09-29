// Google AI Studio Direct Gemini API Client
export const geminiApi = {
  getApiKey: () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('sdd_gemini_api_key') || '';
  },

  setApiKey: (key) => {
    if (key) {
      localStorage.setItem('sdd_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('sdd_gemini_api_key');
    }
  },

  generateContent: async (prompt, modelName = 'gemini-3.6-flash', systemInstruction = '') => {
    const apiKey = geminiApi.getApiKey();

    // 1. Try Direct Google AI Studio API first if key exists
    if (apiKey) {
      const activeModel = modelName.includes('2.5-') || modelName.includes('2.0-') ? 'gemini-3.6-flash' : modelName;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

      const contents = [];
      if (systemInstruction) {
        contents.push({
          role: 'user',
          parts: [{ text: `[System Instruction]: ${systemInstruction}` }]
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return candidateText;
          }
        } else {
          const errText = await res.text();
          console.warn(`[geminiApi] Direct Google AI Studio returned HTTP ${res.status}: ${errText}. Seamlessly falling back to Server Proxy...`);
        }
      } catch (err) {
        console.warn(`[geminiApi] Direct Google AI Studio fetch failed: ${err.message}. Falling back to Server Proxy...`);
      }
    }

    // 2. Fallback to Server Proxy via Local Express (/api/chat/completions)
    const proxyRes = await fetch('http://localhost:7001/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      const text = proxyData.choices?.[0]?.message?.content;
      if (text) {
        return text;
      }
    }

    throw new Error('Google Gemini API & LiteLLM Gateway both unavailable.');
  }
};
