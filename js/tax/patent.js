import { PATENT_TAX } from "../config/constants.js";

export function calculatePatentTax(type) {
  const amount = PATENT_TAX[type] || 0;

  return {
    taxAmount: amount,
    taxableBase: 0,
    total: amount,
    taxpayerType: type,
  };
}