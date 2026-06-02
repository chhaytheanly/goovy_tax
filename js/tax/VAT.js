import { VAT_RATE } from "../config/constants.js";

function roundTax(value) {
  return Math.round(value);
}

function getVatRate(vatType) {
  return vatType === "export" ? 0 : VAT_RATE;
}

export function calculateVAT(amount, mode = "exclusive", vatType = "domestic") {
  const baseAmount = Number(amount) || 0;
  const rate = getVatRate(vatType);

  if (mode === "inclusive") {
    const taxAmount = rate === 0 ? 0 : baseAmount * (rate / (1 + rate));
    const taxableBase = rate === 0 ? baseAmount : baseAmount - taxAmount;

    return {
      taxAmount: roundTax(taxAmount),
      taxableBase: roundTax(taxableBase),
      total: roundTax(baseAmount),
      rate,
      vatType,
      mode,
    };
  }

  const taxAmount = baseAmount * rate;

  return {
    taxAmount: roundTax(taxAmount),
    taxableBase: roundTax(baseAmount),
    total: roundTax(baseAmount + taxAmount),
    rate,
    vatType,
    mode,
  };
}

export function calculateImportVAT(amount, mode = "exclusive") {
  return calculateVAT(amount, mode, "import");
}

export function calculateExportVAT(amount, mode = "exclusive") {
  return calculateVAT(amount, mode, "export");
}
