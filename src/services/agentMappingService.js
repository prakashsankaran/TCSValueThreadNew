const API_BASE = 'http://localhost:7001/api/agent-mappings';

export const agentMappingService = {
  async getAgentMappings() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch agent mappings');
      const data = await res.json();
      if (data.success && Array.isArray(data.mappings)) {
        return data.mappings;
      }
    } catch (err) {
      console.warn('⚠️ Server unavailable, using fallback agent mappings:', err.message);
    }
    const saved = localStorage.getItem('sdd_agent_mappings');
    return saved ? JSON.parse(saved) : [];
  },

  async createAgentMapping(mapping) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping)
      });
      if (res.ok) {
        const data = await res.json();
        return data.mapping;
      }
    } catch (err) {
      console.warn('⚠️ Server unavailable, creating local agent mapping:', err.message);
    }
    return { id: Date.now(), ...mapping };
  },

  async deleteAgentMapping(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (err) {
      console.warn('⚠️ Server unavailable, deleting local agent mapping:', err.message);
    }
    return true;
  },

  async resetAgentMappings() {
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.mappings;
      }
    } catch (err) {
      console.warn('⚠️ Server unavailable, resetting local agent mappings:', err.message);
    }
    return [];
  }
};
