const API_BASE = 'http://localhost:7001/api/users';
const STORAGE_KEY = 'sdd_users';

const DEFAULT_USERS = [
  { id: 'user-01', name: 'Prasanna', email: 'prasanna@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Platform Admin'] }, { projectId: 'mobile-app-v2', personas: ['Platform Admin'] }, { projectId: 'legacy-migration', personas: ['Platform Admin'] }] },
  { id: 'user-02', name: 'Prakash', email: 'prakash@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Project Admin'] }, { projectId: 'mobile-app-v2', personas: ['Project Admin'] }] },
  { id: 'user-03', name: 'Vignesh', email: 'vignesh@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Business Analyst'] }] },
  { id: 'user-04', name: 'Mithra', email: 'mithra@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Product Owner'] }] },
  { id: 'user-05', name: 'Karthik', email: 'karthik@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Solution Architect'] }] },
  { id: 'user-06', name: 'Saravanan', email: 'saravanan@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['QA Engineer'] }] },
  { id: 'user-07', name: 'Rajesh Sharma', email: 'sponsor@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Business Sponsor'] }] },
  { id: 'user-08', name: 'Deepa Venkat', email: 'sme@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Business SME'] }] },
  { id: 'user-09', name: 'Anand Kumar', email: 'dm@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Delivery Manager'] }] },
  { id: 'user-10', name: 'Ananya Sundaram', email: 'ux@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['UX Designer'] }] },
  { id: 'user-11', name: 'Siddharth Rao', email: 'data.architect@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Data Architect'] }] },
  { id: 'user-12', name: 'Suresh Iyer', email: 'security@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Security Reviewer'] }] },
  { id: 'user-13', name: 'Vikram Patel', email: 'techlead@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Technical Lead'] }] },
  { id: 'user-14', name: 'Arjun Nair', email: 'developer@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Developer'] }] },
  { id: 'user-15', name: 'Rohan Gupta', email: 'devops@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['DevOps Engineer'] }] },
  { id: 'user-16', name: 'Priya Natarajan', email: 'releasemanager@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Release Manager'] }] },
  { id: 'user-17', name: 'Ganesh Raman', email: 'deploymentmanager@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Deployment Manager'] }] },
  { id: 'user-18', name: 'Lakshmi Narayanan', email: 'auditor@frugalforge.io', isSuperAdmin: false, projectAccess: [{ projectId: 'sdd-enterprise-dev', personas: ['Auditor'] }] }
];

export const userService = {
  // 1. Fetch all users from SQLite API
  getUsers: async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users) && data.users.length >= 18) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
          return data.users;
        }
      }
    } catch (e) {
      console.warn('Backend SQLite offline during getUsers, using fallback storage:', e);
    }
    const savedStr = localStorage.getItem(STORAGE_KEY);
    if (savedStr) {
      try {
        const saved = JSON.parse(savedStr);
        if (Array.isArray(saved) && saved.length >= 18) return saved;
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  },

  // 2. Reset Users in SQLite DB
  resetUsers: async () => {
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
          return data.users;
        }
      }
    } catch (e) {
      console.warn('Backend SQLite offline during resetUsers:', e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  },

  // 3. Create new user in SQLite
  createUser: async (user) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {
      console.warn('Backend SQLite offline during createUser:', e);
    }
    return user;
  },

  // 4. Update existing user in SQLite
  updateUser: async (id, user) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {
      console.warn('Backend SQLite offline during updateUser:', e);
    }
    return user;
  },

  // 5. Delete user from SQLite
  deleteUser: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend SQLite offline during deleteUser:', e);
    }
    return { success: true };
  }
};
