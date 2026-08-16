export function renderMarkdownToHtml(mdStr, docTitle = '', docMeta = '') {
  let cleanMd = String(mdStr || '')
    .replace(/\\n/g, '\n')
    .replace(/^```(json|markdown|html)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  let html = cleanMd;

  // Process mermaid diagrams
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (m, code) => {
    return `<div style="background:#0c1222; border:1px solid #334155; padding:16px; border-radius:8px; margin:16px 0; font-family:monospace; color:#818cf8; font-size:11px; white-space:pre-wrap;">📊 [Architecture & Diagram]\n${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
  });

  // Process code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
    return `<pre style="background-color:#0c1222; border:1px solid #1e293b; padding:14px; border-radius:8px; font-family:monospace; color:#a5b4fc; font-size:11px; overflow-x:auto; margin:12px 0;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });

  // Headers
  html = html.replace(/^# (.*?)$/gm, '<h1 style="color:#ffffff; border-bottom:2px solid #6366f1; padding-bottom:8px; font-size:22px; font-weight:900; margin-top:24px; margin-bottom:12px;">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="color:#818cf8; font-size:16px; font-weight:800; border-bottom:1px solid #1e293b; padding-bottom:6px; margin-top:22px; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 style="color:#38bdf8; font-size:14px; font-weight:700; margin-top:18px; margin-bottom:8px;">$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4 style="color:#a78bfa; font-size:13px; font-weight:700; margin-top:14px; margin-bottom:6px;">$1</h4>');
  html = html.replace(/^---$/gm, '<hr style="border-color:#1e293b; margin:20px 0;"/>');
  
  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f8fafc; font-weight:700;">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em style="color:#cbd5e1;">$1</em>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code style="background-color:#1e293b; padding:2px 6px; border-radius:4px; font-family:monospace; color:#f43f5e; font-size:11px;">$1</code>');

  // Bullet lists
  html = html.replace(/^- (.*?)$/gm, '<li style="margin-left:18px; list-style-type:disc; color:#cbd5e1; margin-bottom:5px; font-size:12px; line-height:1.6;">$1</li>');
  html = html.replace(/^\* (.*?)$/gm, '<li style="margin-left:18px; list-style-type:disc; color:#cbd5e1; margin-bottom:5px; font-size:12px; line-height:1.6;">$1</li>');
  
  // Line breaks for double newlines
  html = html.replace(/\n\n/g, '<br/><br/>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #070a13;
      color: #cbd5e1;
      padding: 28px;
      margin: 0;
      line-height: 1.6;
    }
    .document-container {
      max-width: 960px;
      margin: 0 auto;
    }
    .header-banner {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15));
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
    }
    .header-meta {
      font-size: 11px;
      color: #94a3b8;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="document-container">
    ${docTitle ? `
      <div class="header-banner">
        <div class="header-title">${docTitle}</div>
        ${docMeta ? `<div class="header-meta">${docMeta}</div>` : ''}
      </div>
    ` : ''}
    ${html}
  </div>
</body>
</html>`;
}

export function formatFSDDocument(rawOutput) {
  if (!rawOutput) return '';

  // If already full HTML document
  if (typeof rawOutput === 'string' && (rawOutput.includes('<div class="fsd-document"') || rawOutput.includes('<!DOCTYPE html>'))) {
    return rawOutput;
  }

  let artifactObj = null;
  if (typeof rawOutput === 'object' && rawOutput !== null) {
    artifactObj = rawOutput;
  } else if (typeof rawOutput === 'string') {
    try {
      const match = rawOutput.match(/\{[\s\S]*\}/);
      if (match) artifactObj = JSON.parse(match[0]);
    } catch (e) {}
  }

  // If the payload object contains a markdown property (e.g. requirement or spec document object)
  if (artifactObj && (typeof artifactObj.markdown === 'string' || typeof artifactObj.contentMarkdown === 'string')) {
    const md = artifactObj.markdown || artifactObj.contentMarkdown;
    const title = artifactObj.title ? `Requirement Specification: ${artifactObj.title}` : 'Requirement Specification';
    const reqId = artifactObj.requirementId || artifactObj.specId || '';
    return renderMarkdownToHtml(md, title, reqId ? `Requirement ID: ${reqId} | IEEE-830 Standard` : '');
  }

  let textContent = typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput);

  // Try parsing JSON out of textContent
  let parsedJson = artifactObj;

  // If we have parsed JSON with spec_body or FrugalForgeArtifact structure
  const artifact = parsedJson?.FrugalForgeArtifact || parsedJson;
  if (artifact && (artifact.spec_body || artifact.metadata || artifact.functional_requirements)) {
    const meta = artifact.metadata || {};
    const body = artifact.spec_body || artifact;

    const title = meta.title || 'Functional Specification Document (FSD)';
    const author = meta.author || 'Frugal Forge AI SDLC Agent';
    const project = meta.project || 'Enterprise Application System';
    const timestamp = meta.timestamp ? meta.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    const version = artifact.version || 'v1.0.0';

    const intro = body.introduction || {};
    const purposeText = typeof intro === 'object' ? (intro.purpose || '') : '';
    const scopeText = typeof intro === 'object' ? (intro.scope || '') : '';

    const roles = Array.isArray(body.user_roles_and_permissions) ? body.user_roles_and_permissions : [];
    const funcReqs = Array.isArray(body.functional_requirements) ? body.functional_requirements : [];
    const dataModels = Array.isArray(body.data_models) ? body.data_models : [];
    const apiEndpoints = Array.isArray(body.api_endpoints) ? body.api_endpoints : [];
    const nfrs = Array.isArray(body.non_functional_requirements) ? body.non_functional_requirements : [];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #070a13;
      color: #cbd5e1;
      padding: 32px;
      margin: 0;
      line-height: 1.6;
    }
    .fsd-document { max-width: 960px; margin: 0 auto; }
    .header-banner { background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15)); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 16px; padding: 24px; margin-bottom: 28px; }
    .header-title { font-size: 24px; font-weight: 900; color: #ffffff; margin: 0 0 6px 0; letter-spacing: -0.02em; }
    .header-subtitle { font-size: 13px; color: #818cf8; margin: 0 0 16px 0; font-weight: 600; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 11px; font-family: monospace; }
    .meta-item { background: rgba(15, 23, 42, 0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
    .meta-label { color: #64748b; margin-bottom: 2px; }
    .meta-val { color: #f8fafc; font-weight: bold; }
    .section-title { font-size: 16px; font-weight: 800; color: #818cf8; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #0f172a; border-bottom: 1px solid #334155; padding: 12px 10px; text-align: left; color: #94a3b8; text-transform: uppercase; font-size: 10px; font-weight: 700; }
    td { border-bottom: 1px solid #1e293b; padding: 12px 10px; vertical-align: top; }
    tr:hover { background-color: rgba(30, 41, 59, 0.4); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; font-family: monospace; text-transform: uppercase; }
    .badge-get { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-post { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4); }
    .badge-put { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-delete { background: rgba(225, 29, 72, 0.2); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.4); }
  </style>
</head>
<body>
  <div class="fsd-document">
    <div class="header-banner">
      <div class="header-title">${title}</div>
      <div class="header-subtitle">Authoritative Specification Document Baseline</div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">AUTHOR / AGENT</div><div class="meta-val">${author}</div></div>
        <div class="meta-item"><div class="meta-label">PROJECT</div><div class="meta-val">${project}</div></div>
        <div class="meta-item"><div class="meta-label">VERSION</div><div class="meta-val">${version}</div></div>
        <div class="meta-item"><div class="meta-label">LAST UPDATED</div><div class="meta-val">${timestamp}</div></div>
      </div>
    </div>

    ${purposeText || scopeText ? `
      <div class="section-title">1. Introduction & System Scope</div>
      ${purposeText ? `<p><strong>Purpose:</strong> ${purposeText}</p>` : ''}
      ${scopeText ? `<p><strong>Scope:</strong> ${scopeText}</p>` : ''}
    ` : ''}

    ${funcReqs.length > 0 ? `
      <div class="section-title">2. Functional Requirements</div>
      <table>
        <thead>
          <tr><th>ID</th><th>Requirement Title</th><th>Description & Business Logic</th></tr>
        </thead>
        <tbody>
          ${funcReqs.map(f => `
            <tr>
              <td style="font-weight:bold; color:#818cf8; font-family:monospace">${f.id || f.req_id || 'REQ-01'}</td>
              <td style="font-weight:bold; color:#ffffff">${f.title || f.name || ''}</td>
              <td>${f.description || f.detail || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    ${apiEndpoints.length > 0 ? `
      <div class="section-title">3. Interface Contracts & API Endpoints</div>
      <table>
        <thead>
          <tr><th>Method</th><th>Endpoint Path</th><th>Description</th><th>Access Control</th></tr>
        </thead>
        <tbody>
          ${apiEndpoints.map(apiItem => {
            const method = (apiItem.method || 'GET').toUpperCase();
            let badgeClass = 'badge-get';
            if (method === 'POST') badgeClass = 'badge-post';
            else if (method === 'PUT') badgeClass = 'badge-put';
            else if (method === 'DELETE') badgeClass = 'badge-delete';

            return `
              <tr>
                <td><span class="badge ${badgeClass}">${method}</span></td>
                <td style="font-family:monospace; color:#f8fafc"><code>${apiItem.path || apiItem.endpoint}</code></td>
                <td>${apiItem.description || ''}</td>
                <td style="font-size:11px; color:#94a3b8">${apiItem.access || apiItem.role || 'Authenticated'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    ` : ''}

    ${nfrs.length > 0 ? `
      <div class="section-title">4. Non-Functional Specifications & Quality SLAs</div>
      <ul>
        ${nfrs.map(n => `<li>${typeof n === 'string' ? n : `${n.category ? `<strong>${n.category}:</strong> ` : ''}${n.description || n.detail}`}</li>`).join('')}
      </ul>
    ` : ''}
  </div>
</body>
</html>
    `;
  }

  // Otherwise, render textContent as Markdown
  return renderMarkdownToHtml(textContent, '', '');
}
