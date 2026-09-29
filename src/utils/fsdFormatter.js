export function convertHtmlToLightTheme(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return htmlStr || '';

  const lightStyles = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      background-color: #FFFFFF !important;
      color: #344054 !important;
      padding: 14px 18px !important;
      margin: 0 !important;
      line-height: 1.6 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .fsd-document, .document-container { 
      width: 100% !important; 
      max-width: 100% !important; 
      margin: 0 !important; 
      padding: 0 !important; 
    }
    .header-banner { 
      background: #F8F8F7 !important; 
      border: 1px solid #ECEEF1 !important; 
      border-radius: 12px !important; 
      padding: 16px 20px !important; 
      margin-bottom: 18px !important; 
      width: 100% !important;
      max-width: 100% !important;
    }
    .header-title, h1 { 
      font-size: 20px !important; 
      font-weight: 800 !important; 
      color: #17181C !important; 
      margin: 0 0 4px 0 !important; 
      letter-spacing: -0.01em !important; 
      border-bottom: 2px solid #7157F5 !important;
      padding-bottom: 6px !important;
    }
    .header-subtitle { 
      font-size: 12px !important; 
      color: #7157F5 !important; 
      margin: 0 0 12px 0 !important; 
      font-weight: 600 !important; 
    }
    .meta-grid { 
      display: grid !important; 
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important; 
      gap: 8px !important; 
      font-size: 11px !important; 
      font-family: monospace !important; 
    }
    .meta-item { 
      background: #FFFFFF !important; 
      padding: 6px 10px !important; 
      border-radius: 8px !important; 
      border: 1px solid #ECEEF1 !important; 
    }
    .meta-label, .meta { 
      color: #667085 !important; 
      margin-bottom: 2px !important; 
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
    }
    .meta-val { 
      color: #17181C !important; 
      font-weight: bold !important; 
    }
    .section-title, h2 { 
      font-size: 14px !important; 
      font-weight: 700 !important; 
      color: #7157F5 !important; 
      border-bottom: 1px solid #ECEEF1 !important; 
      padding-bottom: 6px !important; 
      margin-top: 20px !important; 
      margin-bottom: 10px !important; 
      text-transform: uppercase !important; 
      letter-spacing: 0.05em !important; 
    }
    h3 { color: #17181C !important; font-size: 13px !important; font-weight: 700 !important; margin-top: 14px !important; }
    h4 { color: #344054 !important; font-size: 12px !important; font-weight: 700 !important; }
    table { width: 100% !important; border-collapse: collapse !important; margin-top: 10px !important; font-size: 12px !important; }
    th { 
      background: #F8F8F7 !important; 
      border-bottom: 1px solid #ECEEF1 !important; 
      border-right: 1px solid #ECEEF1 !important; 
      padding: 8px 10px !important; 
      text-align: left !important; 
      color: #667085 !important; 
      text-transform: uppercase !important; 
      font-size: 10px !important; 
      font-weight: 700 !important; 
    }
    td { 
      border-bottom: 1px solid #ECEEF1 !important; 
      border-right: 1px solid #ECEEF1 !important; 
      padding: 8px 10px !important; 
      vertical-align: top !important; 
      color: #344054 !important; 
      background: transparent !important; 
    }
    tr:hover td { background-color: #FAFAF9 !important; }
    code, pre { 
      background: #F8F8F7 !important; 
      color: #17181C !important; 
      border: 1px solid #ECEEF1 !important; 
      border-radius: 6px !important; 
      font-family: monospace !important;
      padding: 2px 5px !important;
    }
    pre { padding: 10px 12px !important; }
    .badge { 
      display: inline-block !important; 
      padding: 2px 6px !important; 
      border-radius: 4px !important; 
      font-size: 10px !important; 
      font-weight: bold !important; 
      font-family: monospace !important; 
      text-transform: uppercase !important; 
    }
    .badge-get, .badge-low { background: #ECFDF5 !important; color: #047857 !important; border: 1px solid #A7F3D0 !important; }
    .badge-post, .badge-medium { background: #EEF2FF !important; color: #4338CA !important; border: 1px solid #C7D2FE !important; }
    .badge-put { background: #FFFBEB !important; color: #B45309 !important; border: 1px solid #FDE68A !important; }
    .badge-delete, .badge-high { background: #FFF1F2 !important; color: #BE123C !important; border: 1px solid #FECDD3 !important; }
    .story-id { color: #7157F5 !important; font-weight: bold !important; font-family: monospace !important; }
    strong { color: #17181C !important; }
    p, li, span { color: inherit; }
  `;

  let converted = htmlStr
    .replace(/background(-color)?:\s*(#070a13|#0c1222|#0b0f19|#0f172a|#0b1120|#020617)/gi, 'background-color:#FFFFFF')
    .replace(/rgba\(15,\s*23,\s*42,\s*[\d.]+\)/gi, '#FFFFFF')
    .replace(/rgba\(99,\s*102,\s*241,\s*[\d.]+\)/gi, 'rgba(113, 87, 245, 0.08)')
    .replace(/rgba\(16,\s*185,\s*129,\s*[\d.]+\)/gi, 'rgba(16, 185, 129, 0.08)')
    .replace(/linear-gradient\([^)]+\)/gi, '#F8F8F7')
    .replace(/color:\s*(#ffffff|#f8fafc|#f1f5f9)/gi, 'color:#17181C')
    .replace(/color:\s*(#818cf8|#6366f1|#4f46e5)/gi, 'color:#7157F5')
    .replace(/color:\s*(#cbd5e1|#e2e8f0)/gi, 'color:#344054')
    .replace(/color:\s*(#94a3b8|#64748b)/gi, 'color:#667085')
    .replace(/border(-color)?:\s*(#1e293b|#334155|#1e1b4b|#312e81|rgba\(255,\s*255,\s*255,\s*[\d.]+\))/gi, 'border-color:#ECEEF1');

  if (converted.includes('</head>')) {
    converted = converted.replace('</head>', `<style>${lightStyles}</style></head>`);
  } else if (converted.includes('<!DOCTYPE html>')) {
    converted = converted.replace('<!DOCTYPE html>', `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${lightStyles}</style></head>`);
  } else {
    converted = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${lightStyles}</style></head><body>${converted}</body></html>`;
  }

  return converted;
}

export function renderMarkdownToHtml(mdStr, docTitle = '', docMeta = '') {
  let cleanMd = String(mdStr || '')
    .replace(/\\n/g, '\n')
    .replace(/^```(json|markdown|html)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  let html = cleanMd;

  // Process mermaid diagrams
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (m, code) => {
    return `<div style="background:#F8F8F7; border:1px solid #ECEEF1; padding:12px; border-radius:10px; margin:12px 0; font-family:monospace; color:#7157F5; font-size:11px; white-space:pre-wrap;">📊 [Architecture & Diagram]\n${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
  });

  // Process code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
    return `<pre style="background-color:#F8F8F7; border:1px solid #ECEEF1; padding:12px; border-radius:10px; font-family:monospace; color:#17181C; font-size:11px; overflow-x:auto; margin:10px 0;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });

  // Headers
  html = html.replace(/^# (.*?)$/gm, '<h1 style="color:#17181C; border-bottom:2px solid #7157F5; padding-bottom:6px; font-size:20px; font-weight:800; margin-top:18px; margin-bottom:10px;">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="color:#7157F5; font-size:14px; font-weight:700; border-bottom:1px solid #ECEEF1; padding-bottom:6px; margin-top:18px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 style="color:#17181C; font-size:13px; font-weight:700; margin-top:14px; margin-bottom:6px;">$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4 style="color:#344054; font-size:12px; font-weight:700; margin-top:12px; margin-bottom:4px;">$1</h4>');
  html = html.replace(/^---$/gm, '<hr style="border-color:#ECEEF1; margin:16px 0;"/>');
  
  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#17181C; font-weight:700;">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em style="color:#475467;">$1</em>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code style="background-color:#F8F8F7; border:1px solid #ECEEF1; padding:2px 5px; border-radius:4px; font-family:monospace; color:#7157F5; font-size:11px;">$1</code>');

  // Bullet lists
  html = html.replace(/^- (.*?)$/gm, '<li style="margin-left:16px; list-style-type:disc; color:#344054; margin-bottom:4px; font-size:12px; line-height:1.6;">$1</li>');
  html = html.replace(/^\* (.*?)$/gm, '<li style="margin-left:16px; list-style-type:disc; color:#344054; margin-bottom:4px; font-size:12px; line-height:1.6;">$1</li>');
  
  // Line breaks for double newlines
  html = html.replace(/\n\n/g, '<br/><br/>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #FFFFFF;
      color: #344054;
      padding: 14px 18px;
      margin: 0;
      line-height: 1.6;
      width: 100%;
      max-width: 100%;
    }
    .document-container {
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    .header-banner {
      background: #F8F8F7;
      border: 1px solid #ECEEF1;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 18px;
      width: 100%;
    }
    .header-title {
      font-size: 20px;
      font-weight: 800;
      color: #17181C;
      margin: 0 0 4px 0;
    }
    .header-meta {
      font-size: 11px;
      color: #667085;
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

  // If already HTML document string, run through light theme converter to guarantee no dark styles remain and full width is utilized
  if (typeof rawOutput === 'string' && (rawOutput.includes('<div class="fsd-document"') || rawOutput.includes('<!DOCTYPE html>') || rawOutput.includes('<html'))) {
    return convertHtmlToLightTheme(rawOutput);
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
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #FFFFFF;
      color: #344054;
      padding: 14px 18px;
      margin: 0;
      line-height: 1.6;
      width: 100%;
      max-width: 100%;
    }
    .fsd-document { width: 100%; max-width: 100%; margin: 0; padding: 0; }
    .header-banner { background: #F8F8F7; border: 1px solid #ECEEF1; border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; width: 100%; }
    .header-title { font-size: 20px; font-weight: 800; color: #17181C; margin: 0 0 4px 0; letter-spacing: -0.01em; }
    .header-subtitle { font-size: 12px; color: #7157F5; margin: 0 0 12px 0; font-weight: 600; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; font-size: 11px; font-family: monospace; }
    .meta-item { background: #FFFFFF; padding: 6px 10px; border-radius: 8px; border: 1px solid #ECEEF1; }
    .meta-label { color: #667085; margin-bottom: 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .meta-val { color: #17181C; font-weight: bold; }
    .section-title { font-size: 14px; font-weight: 700; color: #7157F5; border-bottom: 1px solid #ECEEF1; padding-bottom: 6px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background: #F8F8F7; border-bottom: 1px solid #ECEEF1; border-right: 1px solid #ECEEF1; padding: 8px 10px; text-align: left; color: #667085; text-transform: uppercase; font-size: 10px; font-weight: 700; }
    td { border-bottom: 1px solid #ECEEF1; border-right: 1px solid #ECEEF1; padding: 8px 10px; vertical-align: top; color: #344054; }
    tr:hover td { background-color: #FAFAF9; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; font-family: monospace; text-transform: uppercase; }
    .badge-get { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
    .badge-post { background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; }
    .badge-put { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
    .badge-delete { background: #FFF1F2; color: #BE123C; border: 1px solid #FECDD3; }
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
              <td style="font-weight:bold; color:#7157F5; font-family:monospace">${f.id || f.req_id || 'REQ-01'}</td>
              <td style="font-weight:bold; color:#17181C">${f.title || f.name || ''}</td>
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
                <td style="font-family:monospace; color:#17181C"><code>${apiItem.path || apiItem.endpoint}</code></td>
                <td>${apiItem.description || ''}</td>
                <td style="font-size:11px; color:#667085">${apiItem.access || apiItem.role || 'Authenticated'}</td>
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

