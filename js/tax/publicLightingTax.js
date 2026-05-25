import { PUBLIC_LIGHTING_TAX_RATE } from "../config/constants.js";

export function calculatePublicLightingTax(amount) {
  const tax = amount * PUBLIC_LIGHTING_TAX_RATE;

  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: Math.round(amount + tax),
  };
}