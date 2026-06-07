
export function calculateSpecificTax(amount, rate, typeRate) {
  const tax = amount * rate * typeRate;

  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: Math.round(amount + tax),
    rate,
    typeRate,
  };
}