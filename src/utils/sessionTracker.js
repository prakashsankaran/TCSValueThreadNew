/**
 * Utility to save and load user sessions, drafts, and configuration in localStorage.
 */
export const sessionTracker = {
  saveSession: (key, data) => {
    try {
      localStorage.setItem(`sdd_session_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save session state to storage', e);
    }
  },
  
  loadSession: (key) => {
    try {
      const data = localStorage.getItem(`sdd_session_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load session state from storage', e);
      return null;
    }
  },
  
  clearSession: (key) => {
    localStorage.removeItem(`sdd_session_${key}`);
  }
};
