export function calculateStampDuty({
  stampType,
  value,
  familyType,
  specialCase,
}) {
  let taxAmount = 0;
  let taxableBase = value;
  let rate = 0;
  let breakdown = "";

  if (stampType === "dissolution") {
    taxAmount = 1000000;
    taxableBase = 0;
    return {
      taxAmount,
      taxableBase,
      total: 0,
      breakdown: "Flat tax: 1,000,000 KHR",
    };
  }

  if (stampType === "transfer") {
    if (specialCase === "borey") {
      taxableBase = Math.max(0, value - 700000);
    }
    rate = familyType === "family" ? 0 : 0.04;
  } else if (stampType === "companyShare") {
    rate = familyType === "family" ? 0 : 0.001;
  }

  taxAmount = Math.round(taxableBase * rate);

  return {
    taxAmount,
    taxableBase,
    total: Math.round(value - taxAmount),
    breakdown: `Value: ${value.toLocaleString()} KHR, Taxable: ${taxableBase.toLocaleString()} KHR, Rate: ${(rate * 100).toFixed(1)}%`,
  };
}
