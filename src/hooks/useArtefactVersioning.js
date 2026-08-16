import { useState, useEffect } from 'react';

export function useArtefactVersioning(stageKey, defaultTitle = 'SDLC Artefact', updatePageState = null) {
  const [savedVersions, setSavedVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const activeProject = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';

  const safeParseContent = (content) => {
    if (!content) return null;
    if (typeof content === 'object') return content;
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  };

  const loadVersions = async (proj) => {
    try {
      const targetProj = proj || activeProject || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      const res = await fetch(`http://localhost:7001/api/artefacts?project=${encodeURIComponent(targetProj)}&stage=${encodeURIComponent(stageKey)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.artefacts) && data.artefacts.length > 0) {
        setSavedVersions(data.artefacts);
        const latest = data.artefacts.find(a => a.status === 'LATEST') || data.artefacts[0];
        setSelectedVersionId(latest.id);
        
        // Auto-load latest content into page state output
        const parsed = safeParseContent(latest.content);
        if (typeof updatePageState === 'function' && parsed) {
          updatePageState(stageKey, { output: parsed });
        }
      }
    } catch (e) {
      console.warn('Failed to load artefact versions:', e);
    }
  };

  useEffect(() => {
    loadVersions(activeProject);

    const syncProject = (e) => {
      const current = e?.detail?.projectId || localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      loadVersions(current);
    };

    window.addEventListener('activeProjectChanged', syncProject);
    window.addEventListener('storage', syncProject);
    return () => {
      window.removeEventListener('activeProjectChanged', syncProject);
      window.removeEventListener('storage', syncProject);
    };
  }, [stageKey]);

  const selectVersion = (versionId) => {
    setSelectedVersionId(versionId);
    if (!savedVersions || savedVersions.length === 0) return;
    const item = savedVersions.find(v => v.id === versionId);
    if (item && item.content && typeof updatePageState === 'function') {
      const parsed = safeParseContent(item.content);
      updatePageState(stageKey, { output: parsed });
    }
  };

  const saveAndSyncArtefact = async ({ artefactId, title, content, metadata = {} }, onSuccess = null) => {
    if (!content) return null;
    setIsSyncing(true);
    try {
      const currentProj = localStorage.getItem('activeProject') || 'sdd-enterprise-dev';
      
      // Inject parent version dynamically if missing
      const parentId = metadata.parentArtefactId || metadata.specId;
      if (parentId && !metadata.parentArtefactVersion) {
        let parentVersion = 'v1.0.0';
        try {
          if (parentId.startsWith('SPEC-') || parentId.startsWith('REQ-')) {
            const specRes = await fetch(`http://localhost:7001/api/specs?project=${encodeURIComponent(currentProj)}`);
            const specData = await specRes.json();
            if (specData.success && Array.isArray(specData.specs)) {
              const match = specData.specs.find(s => 
                s.specId === parentId || 
                s.requirementId === parentId || 
                s.id === parentId
              );
              if (match && match.version) {
                parentVersion = match.version;
              }
            }
          } else {
            const artRes = await fetch(`http://localhost:7001/api/artefacts?project=${encodeURIComponent(currentProj)}`);
            const artData = await artRes.json();
            if (artData.success && Array.isArray(artData.artefacts)) {
              const match = artData.artefacts.find(a => 
                (a.artefactId === parentId || a.id === parentId) && a.status === 'LATEST'
              );
              if (match && match.version) {
                parentVersion = match.version;
              }
            }
          }
        } catch (specErr) {
          console.warn('Failed to fetch parent version inside hook:', specErr);
        }
        metadata.parentArtefactVersion = parentVersion;
      }

      const payload = {
        projectId: currentProj,
        stageKey,
        artefactId: artefactId || `ART-${Date.now().toString().slice(-4)}`,
        title: title || defaultTitle,
        content,
        metadata
      };

      const res = await fetch('http://localhost:7001/api/artefacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.artefact) {
        await loadVersions(currentProj);
        setSelectedVersionId(data.artefact.id);
        if (typeof updatePageState === 'function' && data.artefact.content) {
          updatePageState(stageKey, { output: data.artefact.content });
        }
        setSyncMessage(`Saved ${data.artefact.version} & Vectorized!`);
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3500);
        if (onSuccess) onSuccess(data.artefact);
        return data.artefact;
      }
    } catch (e) {
      console.error('Failed to save and sync artefact:', e);
    } finally {
      setIsSyncing(false);
    }
    return null;
  };

  const getSelectedArtefactContent = () => {
    if (!selectedVersionId || savedVersions.length === 0) return null;
    const item = savedVersions.find(v => v.id === selectedVersionId);
    return item ? item.content : null;
  };

  return {
    savedVersions,
    selectedVersionId,
    setSelectedVersionId: selectVersion,
    selectVersion,
    isSyncing,
    showSyncSuccess,
    syncMessage,
    saveAndSyncArtefact,
    getSelectedArtefactContent,
    loadVersions
  };
}

export default useArtefactVersioning;
