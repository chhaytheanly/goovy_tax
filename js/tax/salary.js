import {
  STANDARD_RELIEF,
  DEPENDENT_DEDUCTION,
  FOREIGNER_SALARY_RATE,
} from "../config/constants.js";

export function calculateSalaryDeductions({
  monthlySalary,
  spouseStatus,
  childrenCount,
  otherDependents,
  isForeigner,
}) {
  let standardRelief = isForeigner ? 0 : STANDARD_RELIEF;
  let spouseDeduction =
    !isForeigner && spouseStatus === "housewife" ? DEPENDENT_DEDUCTION : 0;
  let childrenDeduction = !isForeigner
    ? childrenCount * DEPENDENT_DEDUCTION
    : 0;
  let otherDeduction = !isForeigner ? otherDependents * DEPENDENT_DEDUCTION : 0;
  let totalDeductions =
    standardRelief + spouseDeduction + childrenDeduction + otherDeduction;

  return {
    monthlySalary,
    spouseDeduction,
    childrenDeduction,
    otherDeduction,
    standardRelief,
    totalDeductions,
    isForeigner,
    taxableIncome: Math.max(0, monthlySalary - totalDeductions),
  };
}

export function calculateSalaryTax(taxableIncome, isForeigner = false) {
  if (taxableIncome <= 0) return 0;

  if (isForeigner) {
    return Math.round(taxableIncome * FOREIGNER_SALARY_RATE);
  }

  let tax = 0;
  let remaining = taxableIncome;

  if (remaining > 1500000) {
    let tier1 = Math.min(remaining, 2000000) - 1500000;
    if (tier1 > 0) tax += tier1 * 0.05;
  }
  if (remaining > 2000000) {
    let tier2 = Math.min(remaining, 8500000) - 2000000;
    if (tier2 > 0) tax += tier2 * 0.1;
  }
  if (remaining > 8500000) {
    let tier3 = Math.min(remaining, 12500000) - 8500000;
    if (tier3 > 0) tax += tier3 * 0.15;
  }
  if (remaining > 12500000) {
    let tier4 = remaining - 12500000;
    tax += tier4 * 0.2;
  }

  return Math.round(tax);
}
