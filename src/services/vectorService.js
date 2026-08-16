const API_BASE = 'http://localhost:7001/api/vectors';

export const vectorService = {
  // 1. Fetch all vector-indexed artifacts
  getArtefacts: async () => {
    try {
      const res = await fetch(`${API_BASE}/artefacts`);
      if (res.ok) {
        const data = await res.json();
        return data.artefacts || [];
      }
    } catch (e) {
      console.warn('Vector DB offline during getArtefacts:', e);
    }
    return [];
  },

  // 2. Vectorize and store an artifact
  storeArtefact: async ({ artefactId, title, artefactType, content, metadata }) => {
    try {
      const res = await fetch(`${API_BASE}/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artefactId, title, artefactType, content, metadata })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Vector DB offline during storeArtefact:', e);
    }
    return null;
  },

  // 3. Perform Vector Semantic Search
  searchArtefacts: async (query, topK = 5) => {
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK })
      });
      if (res.ok) {
        const data = await res.json();
        return data.matches || [];
      }
    } catch (e) {
      console.warn('Vector DB offline during searchArtefacts:', e);
    }
    return [];
  },

  // 4. Delete vector artifact
  deleteArtefact: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Vector DB offline during deleteArtefact:', e);
    }
    return { success: true };
  }
};

export default vectorService;
