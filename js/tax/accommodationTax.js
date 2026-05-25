import { ACCOMMODATION_TAX_RATE } from "../config/constants.js";

export function calculateAccommodationTax(amount) {
  const tax = amount * ACCOMMODATION_TAX_RATE;

  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: Math.round(amount + tax),
  };
}