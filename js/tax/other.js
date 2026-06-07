import {
  WHT_RATES,
  PROPERTY_THRESHOLD,
  PROPERTY_RATE,
  TRANSPORTATION_TAX_RATE,
  DEPENDENT_DEDUCTION,
} from "../config/constants.js";

export function getWHTRate(subcategory, type) {
  return WHT_RATES[subcategory]?.[type] ?? WHT_RATES.resident.service;
}

export function calculateWHT(amount, rate) {
  const tax = Math.round(amount * rate);
  return {
    taxAmount: tax,
    taxableBase: amount,
    total: amount - tax,
  };
}

export function calculatePropertyTax(value) {
  if (value <= PROPERTY_THRESHOLD) {
    return { taxAmount: 0, taxableBase: 0, total: value };
  }
  const excess = value - PROPERTY_THRESHOLD;
  const tax = excess * PROPERTY_RATE;
  return {
    taxAmount: Math.round(tax),
    taxableBase: excess,
    total: value - tax,
  };
}

export function calculateUnregisteredRentalTax(amount) {
  const tax = amount < 500000 ? 0 : Math.round(amount * 0.1);
  return {
    taxAmount: tax,
    taxableBase: amount,
    total: Math.round(amount - tax),
    deduction: 0,
  };
}

export function calculateRentalPropertyDeductions({
  spouseStatus,
  childrenCount,
  otherDependents,
  varietySpending = 0,
}) {
  let spouseDeduction = spouseStatus === "housewife" ? DEPENDENT_DEDUCTION : 0;
  let childrenDeduction = childrenCount * DEPENDENT_DEDUCTION;
  let otherDeduction = otherDependents * DEPENDENT_DEDUCTION;
  let totalDeductions = spouseDeduction + childrenDeduction + otherDeduction + varietySpending;

  return {
    spouseDeduction,
    childrenDeduction,
    otherDeduction,
    varietySpending,
    totalDeductions,
  };
}

export function calculateSoleProprietorshipRentalTax(amount, deductions) {
  const taxableIncome = Math.max(0, amount - deductions.totalDeductions);

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

  return {
    taxAmount: Math.round(tax),
    taxableBase: Math.round(taxableIncome),
    total: Math.round(amount - tax),
    totalDeductions: deductions.totalDeductions,
  };
}

export function calculateTransportationTax(amount) {
  const tax = amount * TRANSPORTATION_TAX_RATE;
  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: amount - tax,
  };
}
