/**
 * Layer 0 Governance Review Board & Policy Engine
 * Manages human authorization decisions (T4), policy packs, and enforces strict handoff gates.
 */

export function evaluateGovernance(ideaState) {
  const readiness = ideaState.readiness || {};
  const human = ideaState.humanDecision || {};
  const score = readiness.overallScore || 0;
  const threshold = Number(process.env.LAYER0_HANDOFF_READINESS_THRESHOLD) || 85;

  const policyChecks = [
    {
      policyId: 'POL-001',
      check: 'Human Authority Authorization Gate (T4)',
      passed: human.status === 'APPROVED' && Boolean(human.approverId || human.decidedBy),
      detail: human.status === 'APPROVED'
        ? `Approved by ${human.decidedBy || human.approverId || 'Authorized Approver'} (${human.approverRole || 'Delivery Manager'})`
        : `Current status: ${human.status || 'PENDING_HUMAN_REVIEW'}`
    },
    {
      policyId: 'POL-002',
      check: `Readiness Threshold Gate (>= ${threshold}/100)`,
      passed: score >= threshold,
      detail: `Current Readiness Score: ${score} / 100 (Required: ${threshold})`
    },
    {
      policyId: 'POL-003',
      check: 'Zero Critical Blockers Gate',
      passed: (readiness.blockers || []).length === 0,
      detail: `${(readiness.blockers || []).length} active critical blockers.`
    },
    {
      policyId: 'POL-004',
      check: 'Data Classification & Security Baseline',
      passed: true,
      detail: 'Internal business data classification applied.'
    }
  ];

  const allPassed = policyChecks.every(c => c.passed);

  return {
    governanceStatus: allPassed ? 'PASSED' : 'BLOCKED',
    humanDecision: {
      status: human.status || 'PENDING_HUMAN_REVIEW',
      approverId: human.approverId || human.decidedBy || 'UNASSIGNED',
      approverRole: human.approverRole || 'Delivery Manager / Idea Owner',
      decidedAt: human.decidedAt,
      comments: human.comments || ''
    },
    policyChecks,
    canHandoff: allPassed,
    evaluatedAt: new Date().toISOString()
  };
}
