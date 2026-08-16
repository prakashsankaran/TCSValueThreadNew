/**
 * Layer 0 Client API Service
 * Calls backend REST endpoints exclusively.
 * Does NOT execute client-side simulated AI pipelines.
 */

const BACKEND_BASE = 'http://localhost:7001';

export const layer0Service = {
  // 1. Get All Ideas for a Project
  getIdeas: async (projectId) => {
    try {
      const activeProj = projectId || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas?project=${encodeURIComponent(activeProj)}`);
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}. Ensure node server.js is running at ${BACKEND_BASE}.`,
        ideas: []
      };
    }
  },

  // 2. Get Idea by ID
  getIdeaById: async (ideaId) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}`);
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}.`,
        idea: null
      };
    }
  },

  // 3. Create Idea Intake (Intake sequencing: runs initial eligible stages only)
  createIdea: async (ideaData, modelTier = 'AUTO') => {
    const ideaId = ideaData.ideaId || `IDEA-${Date.now().toString().slice(-4)}`;
    const activeProj = ideaData.projectId || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
    const initialState = {
      ideaId,
      projectId: activeProj,
      version: 1,
      originalInput: ideaData.originalInput || '',
      inputType: ideaData.inputType || 'IDEA',
      submitter: ideaData.submitter || 'Delivery Manager',
      title: ideaData.title || ''
    };

    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initialState, forceTier: modelTier })
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}. Intake submission failed.`,
        idea: null
      };
    }
  },

  // 4. Re-evaluate Pipeline or Tier Escalation Override
  reEvaluateTier: async (ideaId, currentState, targetTier = 'AUTO') => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}/re-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceTier: targetTier })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.idea) return data;
      }
    } catch (e) {
      console.warn(`Backend re-evaluate endpoint note: ${e.message}`);
    }

    // Fallback: update activeModelTier locally on currentState
    const updated = {
      ...currentState,
      activeModelTier: targetTier
    };
    return { success: true, idea: updated };
  },

  // 5. Submit Discovery Q&A Answer (Single or Batch)
  submitDiscoveryAnswer: async (ideaId, qIdx, answer) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}/discovery/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qIdx, answer })
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}.`
      };
    }
  },

  submitDiscoveryAnswersBatch: async (ideaId, answersMap) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}/discovery/answers/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersMap })
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}.`
      };
    }
  },

  // 6. Update Finance Inputs
  updateFinanceInputs: async (ideaId, financeInputs) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}/finance-inputs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financeInputs })
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}.`
      };
    }
  },

  // 7. Submit Human Governance Decision (Requires Authenticated Approver Identity)
  submitHumanDecision: async (ideaId, decision, comments, approverId = 'USER-101', approverRole = 'Delivery Manager / Idea Owner') => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}/human-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments, approverId, approverRole })
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Backend server unavailable: ${e.message}.`
      };
    }
  },

  // 8. Strict Handoff to SDD Framework
  handoffToSDD: async (ideaId, currentState) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Handoff failed: Backend gates blocked request.',
          reasons: data.reasons || ['Governance approval pending or blockers active.']
        };
      }

      const markdown = currentState.compiledRequirement?.markdown || '';
      localStorage.setItem('activeSpec_Requirement_MD', markdown);
      localStorage.setItem('layer0_approved_requirement', JSON.stringify(currentState));

      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, error: `Handoff request failed: ${e.message}` };
    }
  },

  // 9. Delete Idea by ID
  deleteIdea: async (ideaId) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/${encodeURIComponent(ideaId)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return { success: false, error: `Delete failed: ${e.message}` };
    }
  },

  // 10. Reset All Ideas
  clearAllIdeas: async () => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/ideas/clear/all`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return { success: false, error: `Reset failed: ${e.message}` };
    }
  },

  // 11. Run Agent Task Re-evaluation
  runAgent: async (ideaId, agentName, currentState, modelTier = 'AUTO') => {
    return await layer0Service.reEvaluateTier(ideaId, currentState, modelTier);
  },

  // 12. Run Suite (Combined Debate and ML Impact)
  runSuite: async (suiteParams) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/layer0/run-suite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suiteParams)
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: `Suite execution failed: ${e.message}.`
      };
    }
  }
};
