
export function calculateSpecificTax(amount, rate) {
  const tax = amount * rate;

  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: Math.round(amount + tax),
    rate,
  };
}