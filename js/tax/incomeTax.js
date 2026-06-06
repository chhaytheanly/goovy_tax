import {
  INCOME_TAX_RATES,
  SOLE_PROPRIETOR_BRACKETS,
} from "../config/constants.js";

export function calculateIncomeTax(amount, type) {
  let taxAmount = 0;
  let taxableBase = amount;
  let total = amount;
  let rate = 0;
  let deduction = 0;

  switch (type) {
    case "general":
      rate = INCOME_TAX_RATES.GENERAL;
      taxAmount = Math.round(amount * rate);
      break;
    case "naturalResources":
      rate = INCOME_TAX_RATES.OIL_NATURAL_GAS_TIMBER_MINERALS_GOLD_GEMS;
      taxAmount = Math.round(amount * rate);
      break;
    case "qip":
      rate = INCOME_TAX_RATES.QIP;
      taxAmount = 0;
      break;
    case "generalInsurance":
      rate = INCOME_TAX_RATES.General_Insurance;
      taxAmount = Math.round(amount * rate);
      break;
    case "soleProprietorship":
      {
        const bracket = SOLE_PROPRIETOR_BRACKETS.find((item) => amount <= item.max);
        rate = bracket?.rate ?? 0;
        deduction = bracket?.deduction ?? 0;
        taxAmount = Math.max(0, Math.round(amount * rate - deduction));
      }
      break;
    default:
      rate = INCOME_TAX_RATES.GENERAL;
      taxAmount = Math.round(amount * rate);
      break;
  }

  total = amount - taxAmount;

  return {
    taxAmount,
    taxableBase,
    total,
    rate,
    deduction,
  };
}
