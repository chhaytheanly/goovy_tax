import { UNUSED_LAND_TAX_RATE } from "../config/constants.js";

export function calculateUnusedLandTax(landValue) {
  const tax = landValue * UNUSED_LAND_TAX_RATE;

  return {
    taxAmount: Math.round(tax),
    taxableBase: landValue,
    total: Math.round(landValue - tax),
  };
}
export const VEHICLE_TAX_RATES = {
  MOTORBIKE: 50000,
  CAR_SMALL: 150000,
  CAR_MEDIUM: 250000,
  CAR_LARGE: 400000,
  LUXURY: 1000000,
};