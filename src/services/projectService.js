const API_BASE = 'http://localhost:7001/api/projects';
const STORAGE_KEY = 'sdd_projects';

const DEFAULT_PROJECTS = [
  { id: 'proj-01', name: 'sdd-enterprise-dev', description: 'Enterprise platform core development', type: 'Green Field', status: 'Active' },
  { id: 'proj-02', name: 'mobile-app-v2', description: 'Next generation mobile application', type: 'Green Field', status: 'In Progress' },
  { id: 'proj-03', name: 'legacy-migration', description: 'Migration from legacy systems to cloud', type: 'Brown Field', status: 'Planning' }
];

export const projectService = {
  // 1. Fetch all projects from SQLite API
  getProjects: async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.projects));
          return data.projects;
        }
      }
    } catch (e) {
      console.warn('Backend SQLite offline during getProjects, using fallback storage:', e);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  },

  // 2. Create new project in SQLite
  createProject: async (project) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (res.ok) {
        const data = await res.json();
        return data.project;
      }
    } catch (e) {
      console.warn('Backend SQLite offline during createProject:', e);
    }
    return project;
  },

  // 3. Update existing project in SQLite
  updateProject: async (id, project) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (res.ok) {
        const data = await res.json();
        return data.project;
      }
    } catch (e) {
      console.warn('Backend SQLite offline during updateProject:', e);
    }
    return project;
  },

  // 4. Delete project from SQLite
  deleteProject: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend SQLite offline during deleteProject:', e);
    }
    return { success: true };
  }
};
