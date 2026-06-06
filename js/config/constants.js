export const STANDARD_RELIEF = 1500000;
export const DEPENDENT_DEDUCTION = 150000;
export const VAT_RATE = 0.1;
export const WHT_RATES = {
  resident: {
    service: 0.15,
    rent: 0.1,
    interestResidentTerm: 0.06,
    interestResidentNoTerm: 0.04,
  },
  nonResident: {
    paymentNonResident: 0.14,
  },
};
export const WHT_RATE = WHT_RATES.resident.service;
export const INCOME_TAX_RATES = {
  GENERAL: 0.2,
  OIL_NATURAL_GAS_TIMBER_MINERALS_GOLD_GEMS: 0.3,
  QIP: 0,
  // Life_Insurance: 0.2,
  General_Insurance: 0.05
};
export const SOLE_PROPRIETOR_BRACKETS = [
  { max: 18000000, rate: 0, deduction: 0 },
  { max: 24000000, rate: 0.05, deduction: 900000 },
  { max: 102000000, rate: 0.1, deduction: 2100000 },
  { max: 150000000, rate: 0.15, deduction: 7200000 },
  { max: Infinity, rate: 0.2, deduction: 14200000 },
];
export const PROPERTY_THRESHOLD = 100000000;
export const PROPERTY_RATE = 0.001;
export const TRANSPORTATION_TAX_RATE = 0.05;
export const RENTAL_BUSINESS_DEDUCTION_RATE = 0.2;
export const USD_TO_KHR_RATE = 4100;
export const FOREIGNER_SALARY_RATE = 0.2;
export const PATENT_TAX = {
  SMALL: 400000,
  MEDIUM: 600000,
  LARGE: 1500000,
  LARGE_ENTERPRISE: 2500000,
};
export const ACCOMMODATION_TAX_RATE = 0.02;
export const PUBLIC_LIGHTING_TAX_RATE = 0.05;
export const UNUSED_LAND_TAX_RATE = 0.02;

export const VEHICLE_TAX_RATES = {
  MOTORBIKE: 50000,
  CAR_SMALL: 150000,
  CAR_MEDIUM: 250000,
  CAR_LARGE: 400000,
  LUXURY: 1000000,
};
