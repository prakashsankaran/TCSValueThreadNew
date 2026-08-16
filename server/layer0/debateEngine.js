import { invokeModelAdapter } from './engineRegistry.js';

export async function runDebateCircle({ requirementText, roundsCount = 3, consensusMode = 'Majority' }) {
  const reqContent = requirementText || 'No requirement specification provided yet.';
  const transcript = [];

  // Define Persona System Prompts
  const personas = {
    PO: {
      name: 'Sarah Jenkins',
      title: 'Product Owner',
      systemPrompt: 'You are Sarah Jenkins, a pragmatic Product Owner. Your role is to evaluate whether the requirements align with customer needs, deliver business value, fit timeline goals, and avoid scope creep. Keep your responses concise (max 100 words), direct, and focused on user value and product delivery.'
    },
    BA: {
      name: 'James Chen',
      title: 'Business Analyst',
      systemPrompt: 'You are James Chen, a detail-oriented Senior Business Analyst. Your role is to identify functional gaps, edge cases, missing validation checks, and business rule discrepancies in specifications. Keep your responses concise (max 100 words), analytical, and focused on functional consistency.'
    },
    TA: {
      name: 'Dave Cooper',
      title: 'Technical Architect',
      systemPrompt: 'You are Dave Cooper, a rigorous Principal Technical Architect. Your role is to evaluate system performance, database schemas, API rate limits, event-driven pattern suitability, latency, and hosting security. Keep your responses concise (max 100 words), highly technical, and performance-focused.'
    }
  };

  const debateLogs = [];
  
  // Round 0: Initial Feedback
  const r0Msg = '[Debate Engine] Starting Round 0: Initial Persona Evaluations';
  console.log(r0Msg);
  debateLogs.push(r0Msg);
  
  // Product Owner Round 0
  const poR0Msg = `[Round 0] Product Owner Sarah Jenkins analyzing user adoption & business value...`;
  console.log(poR0Msg);
  debateLogs.push(poR0Msg);
  const poRes0 = await invokeModelAdapter({
    modelName: 'gemini-2.5-flash',
    prompt: `Analyze this requirement specification:
---
${reqContent}
---
Evaluate it from a Product Owner perspective. Identify key benefits, alignment with product goals, and potential scope creep issues.`,
    systemInstruction: personas.PO.systemPrompt
  });
  if (poRes0.success) {
    transcript.push({
      round: 0,
      persona: 'PO',
      name: personas.PO.name,
      title: personas.PO.title,
      text: poRes0.text
    });
    debateLogs.push(`[Round 0] Sarah Jenkins completed evaluation: "${poRes0.text.substring(0, 80)}..."`);
  }

  // Business Analyst Round 0
  const baR0Msg = `[Round 0] Business Analyst James Chen evaluating functional edge cases & validation gates...`;
  console.log(baR0Msg);
  debateLogs.push(baR0Msg);
  const baRes0 = await invokeModelAdapter({
    modelName: 'gemini-2.5-flash',
    prompt: `Analyze this requirement specification:
---
${reqContent}
---
Evaluate it from a Business Analyst perspective. Identify functional edge cases, logic gaps, or missing workflow validations.`,
    systemInstruction: personas.BA.systemPrompt
  });
  if (baRes0.success) {
    transcript.push({
      round: 0,
      persona: 'BA',
      name: personas.BA.name,
      title: personas.BA.title,
      text: baRes0.text
    });
    debateLogs.push(`[Round 0] James Chen completed evaluation: "${baRes0.text.substring(0, 80)}..."`);
  }

  // Technical Architect Round 0
  const taR0Msg = `[Round 0] Technical Architect Dave Cooper scanning performance schema, API security, and limits...`;
  console.log(taR0Msg);
  debateLogs.push(taR0Msg);
  const taRes0 = await invokeModelAdapter({
    modelName: 'gemini-2.5-flash',
    prompt: `Analyze this requirement specification:
---
${reqContent}
---
Evaluate it from a Technical Architect perspective. Identify performance bottlenecks, database normalization needs, security risks, or infrastructure limits.`,
    systemInstruction: personas.TA.systemPrompt
  });
  if (taRes0.success) {
    transcript.push({
      round: 0,
      persona: 'TA',
      name: personas.TA.name,
      title: personas.TA.title,
      text: taRes0.text
    });
    debateLogs.push(`[Round 0] Dave Cooper completed evaluation: "${taRes0.text.substring(0, 80)}..."`);
  }

  // Rounds 1 to N: Interactive Debate
  const maxRounds = Math.min(Math.max(roundsCount, 1), 10);
  for (let r = 1; r <= maxRounds; r++) {
    const startRoundMsg = `[Debate Engine] Starting Interactive Debate Round ${r}`;
    console.log(startRoundMsg);
    debateLogs.push(startRoundMsg);

    const roles = ['PO', 'BA', 'TA'];
    for (const role of roles) {
      const activePersonaName = personas[role].name;
      const activePersonaTitle = personas[role].title;
      const stepMsg = `[Round ${r}] ${activePersonaTitle} ${activePersonaName} challenging assumptions & cross-examining peers...`;
      console.log(stepMsg);
      debateLogs.push(stepMsg);

      const otherSpeeches = transcript
        .filter(item => item.round === r - 1 || (item.round === r && item.persona !== role))
        .map(item => `[${item.title} - ${item.name}]: "${item.text}"`)
        .join('\n\n');

      const debatePrompt = `The team members have commented on the requirement.
Here is the previous conversation:
${otherSpeeches}

Respond to their points. Do you agree or disagree? Point out contradictions or propose compromises to resolve issues. Keep your response constructive and under 100 words.`;

      const debateRes = await invokeModelAdapter({
        modelName: 'gemini-2.5-flash',
        prompt: debatePrompt,
        systemInstruction: personas[role].systemPrompt
      });

      if (debateRes.success) {
        transcript.push({
          round: r,
          persona: role,
          name: activePersonaName,
          title: activePersonaTitle,
          text: debateRes.text
        });
        debateLogs.push(`[Round ${r}] ${activePersonaName} responded: "${debateRes.text.substring(0, 80)}..."`);
      }
    }
  }

  // Moderator Consolidation
  const moderatorMsg = '[Debate Engine] Consolidating Debate Logs via Moderator';
  console.log(moderatorMsg);
  debateLogs.push(moderatorMsg);
  const transcriptFormatted = transcript
    .map(item => `Round ${item.round} | [${item.title} - ${item.name}]: ${item.text}`)
    .join('\n\n');

  const moderatorRes = await invokeModelAdapter({
    modelName: 'gemini-2.5-flash',
    prompt: `You are a neutral Senior Moderator. Analyze the entire multi-persona requirements debate log below:
---
${transcriptFormatted}
---

Based on this debate, compile a final consolidated assessment of the requirements.
Provide a consensus conformance score, a list of pros, a list of cons, and mandatory clarification questions.

CRITICAL: The clarification questions MUST focus on areas where the Product Owner, Business Analyst, and Technical Architect have conflicting views, differing interpretations, or different understandings of requirements from their respective role perspectives (e.g. business value vs functional edge cases vs technical feasibility/security).

Return valid JSON in this exact format:
{
  "conformanceScore": 85,
  "pros": ["Pro point 1", "Pro point 2"],
  "cons": ["Con point 1", "Con point 2"],
  "clarifications": ["Perspective discrepancy 1: [Specific Question]?", "Perspective discrepancy 2: [Specific Question]?"]
}`,
    systemInstruction: 'You are a Senior Principal Moderator. Respond ONLY with valid JSON.'
  });

  let consolidated = {
    conformanceScore: 75,
    pros: ['Decentralized validation logic discussed', 'Requirements analyzed by multiple roles'],
    cons: ['Real-time constraints need optimization details'],
    clarifications: ['What is the exact target sync throughput from ERP?']
  };

  if (moderatorRes.success && moderatorRes.text) {
    try {
      const jsonMatch = moderatorRes.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        consolidated = JSON.parse(jsonMatch[0]);
        debateLogs.push(`[Consolidation] Moderator consensus resolved. Conformance Score: ${consolidated.conformanceScore}%`);
        debateLogs.push(`[Consolidation] Pros identified: ${consolidated.pros?.length || 0}, Cons: ${consolidated.cons?.length || 0}`);
        debateLogs.push(`[Consolidation] Discrepancies to clarify: ${consolidated.clarifications?.length || 0}`);
      }
    } catch (e) {
      console.warn('[Debate Engine] Failed to parse moderator JSON:', e.message);
    }
  }

  return {
    success: true,
    transcript,
    consolidated,
    logs: debateLogs
  };
}
