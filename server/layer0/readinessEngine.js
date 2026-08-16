/**
 * Layer 0 Dynamic 10-Dimension Quality & Readiness Audit Engine
 * Evaluates 10 weighted dimensions (Total 100 points).
 * Decision sequence: Readiness -> Review Board -> Human Decision -> Handoff
 */

export function evaluateReadiness(ideaState) {
  const brief = ideaState.ideaBrief || {};
  const discovery = ideaState.discovery || {};
  const enterprise = ideaState.enterpriseAnalysis || {};
  const finance = ideaState.financeAnalysis || {};
  const compiled = ideaState.compiledRequirement || {};
  const human = ideaState.humanDecision || {};
  const evidence = ideaState.evidence || [];

  const dimensions = [];
  const blockers = [];
  const conditions = [];
  const warnings = [];

  const threshold = Number(process.env.LAYER0_HANDOFF_READINESS_THRESHOLD) || 85;

  // Dimension 1: Discovery Completeness (15 points)
  const totalQ = (discovery.questionsAsked || []).length || 5;
  const answeredQ = (discovery.responses || []).filter(r => r && r.answer && typeof r.answer === 'string' && r.answer.trim().length > 0).length;
  const sufficiency = discovery.sufficiencyScore !== undefined ? discovery.sufficiencyScore : Math.round((answeredQ / totalQ) * 100);
  const discScore = Math.round((sufficiency / 100) * 15);
  dimensions.push({
    id: 'DIM-01',
    name: 'Discovery completeness',
    weight: 15,
    score: discScore,
    status: discScore >= 10 ? 'PASS' : 'WARN',
    detail: `Validated discovery sufficiency: ${sufficiency}% (${answeredQ} of ${totalQ} Q&A responses evaluated by LLM).`
  });
  if (answeredQ === 0) {
    blockers.push('Zero discovery questions answered. Elicitation must begin before review.');
  } else if (answeredQ < totalQ) {
    conditions.push(`Answer remaining ${totalQ - answeredQ} discovery questions to complete elicitation.`);
  }

  // Dimension 2: Problem & Objective Clarity (10 points)
  const problemLength = (brief.problemHypothesis || '').length;
  let probScore = 3;
  if (problemLength > 200) probScore = 10;
  else if (problemLength > 80) probScore = 7;
  dimensions.push({
    id: 'DIM-02',
    name: 'Problem and objective clarity',
    weight: 10,
    score: probScore,
    status: probScore >= 7 ? 'PASS' : 'WARN',
    detail: `Problem statement length: ${problemLength} chars.`
  });

  // Dimension 3: Stakeholder Coverage (8 points)
  const personas = (brief.targetPersonas || []).length;
  const personaScore = Math.min(8, Math.round(personas * 2.5));
  dimensions.push({
    id: 'DIM-03',
    name: 'Stakeholder coverage',
    weight: 8,
    score: personaScore,
    status: personas >= 2 ? 'PASS' : 'WARN',
    detail: `${personas} target personas identified.`
  });

  // Dimension 4: Evidence Coverage (10 points)
  const facts = evidence.filter(e => e.type === 'CONFIRMED_FACT' || e.type === 'STAKEHOLDER_STATEMENT' || e.type === 'ORIGINAL_INPUT').length;
  const evScore = Math.min(10, Math.max(2, facts * 2.5));
  dimensions.push({
    id: 'DIM-04',
    name: 'Evidence coverage',
    weight: 10,
    score: Math.round(evScore),
    status: evScore >= 5 ? 'PASS' : 'WARN',
    detail: `${facts} verified facts logged in evidence ledger.`
  });

  // Dimension 5: Scope Consistency (10 points)
  const scopeCount = (enterprise.scope || []).length;
  const scopeScore = Math.min(10, scopeCount * 2.5);
  dimensions.push({
    id: 'DIM-05',
    name: 'Scope consistency',
    weight: 10,
    score: Math.round(scopeScore),
    status: scopeCount >= 3 ? 'PASS' : 'WARN',
    detail: `${scopeCount} in-scope boundaries defined.`
  });

  // Dimension 6: Requirement Completeness (15 points)
  const markdown = compiled.markdown || '';
  let reqScore = 0;
  if (markdown.length > 2000) reqScore = 15;
  else if (markdown.length > 1000) reqScore = 12;
  else if (markdown.length > 400) reqScore = 8;
  else if (markdown.length > 0) reqScore = 4;
  dimensions.push({
    id: 'DIM-06',
    name: 'Requirement completeness',
    weight: 15,
    score: reqScore,
    status: reqScore >= 10 ? 'PASS' : 'WARN',
    detail: `Requirement document size: ${markdown.length} chars.`
  });
  if (!markdown || markdown.trim().length === 0) {
    blockers.push('Empty requirement specification document.');
  }

  // Dimension 7: Atomicity & Testability (10 points)
  const hasAC = markdown.includes('Acceptance Criteria') || markdown.includes('AC-');
  const testScore = hasAC ? 10 : 3;
  dimensions.push({
    id: 'DIM-07',
    name: 'Atomicity and testability',
    weight: 10,
    score: testScore,
    status: hasAC ? 'PASS' : 'WARN',
    detail: hasAC ? 'Testable acceptance criteria included.' : 'Acceptance criteria missing.'
  });
  if (!hasAC && markdown.length > 0) {
    conditions.push('Acceptance criteria (AC) should be synthesized for testability.');
  }

  // Dimension 8: NFR and Risk Coverage (10 points)
  const hasNFR = markdown.includes('NFR-') || markdown.includes('Non-Functional');
  const nfrScore = hasNFR ? 10 : 4;
  dimensions.push({
    id: 'DIM-08',
    name: 'NFR and risk coverage',
    weight: 10,
    score: nfrScore,
    status: hasNFR ? 'PASS' : 'WARN',
    detail: hasNFR ? 'NFRs and operational risks covered.' : 'NFR section missing.'
  });

  // Dimension 9: Traceability Coverage (7 points)
  const traceScore = (compiled.requirementId && brief.ideaId) ? 7 : 3;
  dimensions.push({
    id: 'DIM-09',
    name: 'Traceability coverage',
    weight: 7,
    score: traceScore,
    status: traceScore === 7 ? 'PASS' : 'WARN',
    detail: `Linked to Source Idea ${brief.ideaId || 'N/A'}.`
  });

  // Dimension 10: Financial Transparency (5 points)
  const finCalculated = finance.status === 'CALCULATED';
  const finScore = finCalculated ? 5 : 1;
  dimensions.push({
    id: 'DIM-10',
    name: 'Financial transparency',
    weight: 5,
    score: finScore,
    status: finCalculated ? 'PASS' : 'WARN',
    detail: finCalculated ? `ROI ${finance.roiPercentage}% calculated.` : 'Financial ROI requires stakeholder inputs.'
  });

  // Total Score Calculation (Sum of all 10 dimensions)
  const overallScore = Math.min(100, Math.round(
    dimensions.reduce((acc, d) => acc + d.score, 0)
  ));

  // Critical Non-Governance Blocker Checks
  if (!brief.submitter || brief.submitter === 'TBD') {
    blockers.push('Missing designated Business Sponsor / Submitting Persona.');
  }

  // Readiness Decision (Purely from score and non-governance blockers)
  let decision = 'EXPLORATION_REQUIRED';
  if (blockers.length === 0 && overallScore >= 85) {
    decision = 'READY_FOR_HUMAN_REVIEW';
  } else if (overallScore >= 70) {
    decision = 'READY_WITH_CONDITIONS';
  } else if (overallScore >= 40) {
    decision = 'DISCOVERY_INCOMPLETE';
  } else {
    decision = 'EXPLORATION_REQUIRED';
  }

  const humanApproved = human.status === 'APPROVED';
  const canHandoff = humanApproved && blockers.length === 0 && overallScore >= threshold;

  return {
    overallScore,
    threshold,
    decision,
    dimensions,
    blockers,
    conditions,
    warnings,
    canHandoff,
    auditedAt: new Date().toISOString()
  };
}
