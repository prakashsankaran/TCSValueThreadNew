const API_BASE = 'http://localhost:7001/api/personas';
const STORAGE_KEY = 'sdd_personas';

export const personaService = {
  // 1. Fetch all personas from SQLite API
  getPersonas: async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.personas)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.personas));
          return data.personas;
        }
      }
    } catch (e) {
      console.warn('Backend SQLite offline, using fallback storage:', e);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  // 2. Create new persona in SQLite
  createPersona: async (persona) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona)
      });
      if (res.ok) {
        const data = await res.json();
        return data.persona;
      }
    } catch (e) {
      console.warn('Backend SQLite offline during create:', e);
    }
    return persona;
  },

  // 3. Update existing persona in SQLite
  updatePersona: async (id, persona) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona)
      });
      if (res.ok) {
        const data = await res.json();
        return data.persona;
      }
    } catch (e) {
      console.warn('Backend SQLite offline during update:', e);
    }
    return persona;
  },

  // 4. Delete persona from SQLite
  deletePersona: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend SQLite offline during delete:', e);
    }
    return { success: true };
  }
};
