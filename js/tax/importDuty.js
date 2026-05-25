export function calculateImportDuty({
  importValue,
  dutyRate,
  vatRate = 0.1,
}) {
  const importDuty = importValue * dutyRate;

  const vatBase = importValue + importDuty;
  const vat = vatBase * vatRate;

  const totalTax = importDuty + vat;

  return {
    importDuty: Math.round(importDuty),
    vat: Math.round(vat),
    totalTax: Math.round(totalTax),
    grandTotal: Math.round(importValue + totalTax),
  };
}