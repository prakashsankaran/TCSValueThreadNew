/**
 * Layer 0 Financial Scenario & Risk Assessment Engine
 * Deterministic financial calculator. Does not use LLMs for arithmetic.
 * Handles missing values (NOT_CALCULABLE), zero cost, negative benefits, and 3-scenario sensitivity.
 */

export function calculateFinanceScenarios(inputs = {}) {
  const userCount = (inputs.userCount !== undefined && !isNaN(Number(inputs.userCount))) ? Math.max(0, Number(inputs.userCount)) : undefined;
  const hoursSavedPerMonth = (inputs.hoursSavedPerMonth !== undefined && !isNaN(Number(inputs.hoursSavedPerMonth))) ? Math.max(0, Number(inputs.hoursSavedPerMonth)) : undefined;
  const hourlyRate = (inputs.hourlyRate !== undefined && !isNaN(Number(inputs.hourlyRate))) ? Math.max(0, Number(inputs.hourlyRate)) : undefined;
  const initialCost = (inputs.initialCost !== undefined && !isNaN(Number(inputs.initialCost))) ? Math.max(0, Number(inputs.initialCost)) : undefined;
  const recurringCost = (inputs.recurringCost !== undefined && !isNaN(Number(inputs.recurringCost))) ? Math.max(0, Number(inputs.recurringCost)) : 0;

  // Check if mandatory calculation parameters are missing
  if (userCount === undefined || hoursSavedPerMonth === undefined || hourlyRate === undefined || initialCost === undefined) {
    return {
      status: 'NOT_CALCULABLE',
      message: 'Financial ROI cannot be calculated because required cost/benefit parameters are missing. Requires stakeholder input.',
      inputs,
      annualBenefit: undefined,
      annualNetBenefit: undefined,
      roiPercentage: undefined,
      paybackMonths: undefined,
      scenarios: []
    };
  }

  const monthlyBenefit = userCount * hoursSavedPerMonth * hourlyRate;
  const annualBenefit = monthlyBenefit * 12;
  const annualNetBenefit = annualBenefit - recurringCost;
  const year1TotalCost = initialCost + recurringCost;

  // ROI calculation
  let roiPercentage;
  if (year1TotalCost > 0) {
    roiPercentage = Math.round(((annualBenefit - year1TotalCost) / year1TotalCost) * 100 * 10) / 10;
  } else {
    roiPercentage = 'NOT_APPLICABLE';
  }

  // Payback Period calculation
  let paybackMonths;
  if (annualNetBenefit > 0) {
    paybackMonths = Math.round((initialCost / (annualNetBenefit / 12)) * 10) / 10;
  } else {
    paybackMonths = 'NO_PAYBACK';
  }

  const calcScenario = (uMult, hMult, name) => {
    const u = Math.round(userCount * uMult);
    const h = Math.round(hoursSavedPerMonth * hMult);
    const b = Math.round(u * h * hourlyRate * 12);
    const net = b - recurringCost;
    let roi = year1TotalCost > 0 ? Math.round(((b - year1TotalCost) / year1TotalCost) * 100) : 'NOT_APPLICABLE';
    let pb = net > 0 ? Math.round((initialCost / (net / 12)) * 10) / 10 : 'NO_PAYBACK';

    return {
      name,
      users: u,
      hours: h,
      annualBenefit: b,
      annualNetBenefit: net,
      roiPercentage: roi,
      paybackMonths: pb
    };
  };

  const scenarios = [
    calcScenario(0.7, 0.6, 'CONSERVATIVE'),
    {
      name: 'EXPECTED',
      users: userCount,
      hours: hoursSavedPerMonth,
      annualBenefit,
      annualNetBenefit,
      roiPercentage,
      paybackMonths
    },
    calcScenario(1.3, 1.4, 'OPTIMISTIC')
  ];

  return {
    status: 'CALCULATED',
    currency: inputs.currency || 'INR',
    annualBenefit,
    annualNetBenefit,
    roiPercentage,
    paybackMonths,
    year1TotalCost,
    scenarios,
    calculatedAt: new Date().toISOString()
  };
}
