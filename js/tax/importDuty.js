import { calculateImportVAT } from "./VAT.js";

export function calculateImportDuty({
  importValue,
  dutyRate,
}) {
  const importDuty = importValue * dutyRate;

  const vatBase = importValue + importDuty;
  const vat = calculateImportVAT(vatBase).taxAmount;

  const totalTax = importDuty + vat;

  return {
    importDuty: Math.round(importDuty),
    vat: Math.round(vat),
    totalTax: Math.round(totalTax),
    grandTotal: Math.round(importValue + totalTax),
  };
}
