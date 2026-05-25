import { VEHICLE_TAX_RATES } from "../config/constants.js";

export function calculateVehicleTax(vehicleType) {
  const tax = VEHICLE_TAX_RATES[vehicleType] || 0;

  return {
    taxAmount: tax,
    taxableBase: 0,
    total: tax,
    vehicleType,
  };
}