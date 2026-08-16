const BACKEND_BASE = 'http://localhost:7001';

async function request(path, options = {}) {
  const url = `${BACKEND_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Load workspace specification
  getWorkspaceSpec: async () => {
    return request('/workspace/spec');
  },

  // Save/sync specification contents
  updateWorkspaceSpec: async (content) => {
    return request('/sync-spec', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  // Enqueue agent generation job
  generate: async (type, instructions = '', activeProject = '') => {
    return request(`/generate/${type}`, {
      method: 'POST',
      body: JSON.stringify({ instructions, activeProject })
    });
  },

  // Poll agent job status
  getJobStatus: async (jobId) => {
    return request(`/generate/status/${jobId}`);
  },

  // Scan path for code quality audit
  scanRepo: async (repoPath) => {
    return request('/api/review/scan', {
      method: 'POST',
      body: JSON.stringify({ repoPath })
    });
  },

  // Search the indexed documents in vector DB
  searchDocuments: async (query) => {
    return request(`/api/search?query=${encodeURIComponent(query)}`);
  },

  // List all archived documents
  getDocuments: async () => {
    return request('/api/documents');
  },

  // Download URL path helper
  getDocumentDownloadUrl: (filename) => {
    return `${BACKEND_BASE}/api/documents/download/${encodeURIComponent(filename)}`;
  },

  // Fetch self-hosted LiteLLM models
  getLiteLLMModels: async () => {
    // No external LiteLLM provider — return empty and let UI fall back to offline models.
    return [];
  }
};
