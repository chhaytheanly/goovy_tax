import { convertToKhr, getSelectedCurrency } from "./utils/currency.js";
import { formatCurrencyInput } from "./utils/formatter.js";
import {
  getElements,
  getPurchasingVatMode,
  getPurchasingVatCase,
  getOutputVatMode,
  getSellingVatCase,
  getCurrencyRadios,
} from "./utils/dom.js";
import { calculateSalaryDeductions, calculateSalaryTax } from "./tax/salary.js";
import {
  calculateWHT,
  getWHTRate,
  calculatePropertyTax,
  calculateUnregisteredRentalTax,
  calculateRentalPropertyDeductions,
  calculateSoleProprietorshipRentalTax,
  calculateTransportationTax,
} from "./tax/other.js";
import { calculateIncomeTax } from "./tax/incomeTax.js";
import { calculateVATAdvanced } from "./tax/VAT.js";
import { updateLanguage } from "./i18n/language.js?v=2";
import { setTranslations } from "./i18n/translations.js";
import { calculateAccommodationTax } from "./tax/accommodationTax.js";
import { calculateStampDuty } from "./tax/importDuty.js";
import { calculatePatentTax } from "./tax/patent.js";
import { calculatePublicLightingTax } from "./tax/publicLightingTax.js";
import { calculateSpecificTax } from "./tax/specificTax.js";
import { calculateVehicleTax } from "./tax/vehicleTax.js";


let currentLanguage = "en";
let lastResidentWhtType = "service";
const elements = getElements();

async function loadTranslations() {
  try {
    const result = await fetch("data/field.json");
    if (!result.ok) {
      throw new Error("Failed to load translations");
    }
    setTranslations(await result.json());
    updateCategoryVisibility();
    updateLanguage(currentLanguage, elements);
    updateDeductionSummary();
    calculate();
  } catch (error) {
    console.error("Error loading translations:", error);
  }
}

function updateCategoryVisibility() {
  const category = elements.taxCategory.value;
  const isSalary = category === "salary";
  const isIncomeTax = category === "incomeTax";
  const isVat = category === "vat";
  const isRental = category === "rental";
  const isWht = category === "withholding";
  const isTransportation = category === "transportation";

  const isPatent = category === "patent";
  const isVehicle = category === "vehicle";
  const isImport = category === "import";
  const isSpecific = category === "specific";
  const isProperty = category === "property";

  elements.baseAmountGroup.style.display =
    (isSalary || isRental || isTransportation || isPatent || isVehicle || isProperty || isVat || isSpecific || isImport) ? "none" : "block";
  const incomeTaxTypeGroup = document.getElementById("incomeTaxTypeGroup");
  if (incomeTaxTypeGroup) incomeTaxTypeGroup.style.display = isIncomeTax ? "block" : "none";
  const whtSubcategoryGroup = document.getElementById("whtSubcategoryGroup");
  if (whtSubcategoryGroup) whtSubcategoryGroup.style.display = isWht ? "block" : "none";
  const whtTypeGroup = document.getElementById("whtTypeGroup");
  if (whtTypeGroup) whtTypeGroup.style.display = isWht ? "block" : "none";
  elements.vatFormGroup.style.display = isVat ? "block" : "none";
  elements.salaryDeductionsSection.style.display = isSalary ? "block" : "none";
  elements.rentalPropertySection.style.display = isRental ? "block" : "none";
  if (isRental) {
    updateRentalVisibility();
  }
  elements.transportationExpenseGroup.style.display = isTransportation ? "block" : "none";

  elements.stampDutySection.style.display = isImport ? "block" : "none";
  if (isImport) {
    updateStampDutyVisibility();
  }
  
  const patentGroup = document.getElementById("patentGroup");
  if(patentGroup) patentGroup.style.display = isPatent ? "block" : "none";
  
  const specificDetailSection = document.getElementById("specificDetailSection");
  if(specificDetailSection) specificDetailSection.style.display = isSpecific ? "block" : "none";
  
  const vehicleGroup = document.getElementById("vehicleGroup");
  if(vehicleGroup) vehicleGroup.style.display = isVehicle ? "block" : "none";

  elements.propertyModeGroup.style.display = isProperty ? "block" : "none";
  elements.propertyValueGroup.style.display = isProperty ? "block" : "none";
  elements.propertySurfaceGroup.style.display =
    isProperty && getPropertyMode() === "unused" ? "block" : "none";

  if (isSalary) {
    updateDeductionSummary();
  }
  if (isIncomeTax) {
    updateIncomeTaxTypeOptions();
  }
  if (isWht) {
    updateWhtTypeOptions();
  }
}

function updateIncomeTaxTypeOptions() {
  if (!elements.incomeTaxType) return;
  const currentType = elements.incomeTaxType.value || "general";
  // if (!["general", "naturalResources", "qip", "soleProprietorship"].includes(currentType)) {
  if (!["general", "naturalResources", "qip", "generalInsurance", "soleProprietorship"].includes(currentType)) {
    elements.incomeTaxType.value = "general";
  }
}

function updateWhtTypeOptions() {
  if (!elements.whtSubcategory || !elements.whtType) return;

  const isResident = elements.whtSubcategory.value === "resident";
  const currentType = elements.whtType.value;

  Array.from(elements.whtType.options).forEach((option, index) => {
    const shouldShow = isResident ? index < 4 : index === 4;
    option.hidden = !shouldShow;
    option.disabled = !shouldShow;
  });

  if (isResident) {
    if (currentType !== "paymentNonResident") {
      lastResidentWhtType = currentType;
    }
    if (currentType === "paymentNonResident") {
      elements.whtType.value = lastResidentWhtType || "service";
    }
  } else {
    if (currentType !== "paymentNonResident") {
      lastResidentWhtType = currentType;
    }
    elements.whtType.value = "paymentNonResident";
  }
}

function getPropertyMode() {
  const selected = document.querySelector('input[name="propertyMode"]:checked');
  return selected ? selected.value : "used";
}

function getRentalBusinessType() {
  const selected = document.querySelector('input[name="rentalBusinessType"]:checked');
  return selected ? selected.value : "unregistered";
}

function updateRentalVisibility() {
  const type = getRentalBusinessType();
  const isUnregistered = type === "unregistered";
  document.getElementById("rentalTaxRateGroup").style.display = isUnregistered ? "block" : "none";
  document.getElementById("rentalSoleProprietorshipSection").style.display = isUnregistered ? "none" : "block";
  if (!isUnregistered) {
    updateRentalDeductionSummary();
  }
}

function updateRentalDeductionSummary() {
  const deductions = getRentalDeductions();
  document.getElementById("rentalVarietyDeductionValue").innerHTML =
    `${deductions.varietySpending.toLocaleString()} KHR`;
  document.getElementById("rentalSpouseDeductionValue").innerHTML =
    `${deductions.spouseDeduction.toLocaleString()} KHR`;
  document.getElementById("rentalChildrenDeductionValue").innerHTML =
    `${deductions.childrenDeduction.toLocaleString()} KHR`;
  document.getElementById("rentalOtherDeductionValue").innerHTML =
    `${deductions.otherDeduction.toLocaleString()} KHR`;
  document.getElementById("rentalTotalDeductionValue").innerHTML =
    `${deductions.totalDeductions.toLocaleString()} KHR`;
}

function getRentalDeductions() {
  const spouseStatus = elements.rentalSpouseStatus.value;
  const childrenCount = parseInt(elements.rentalChildrenCount.value, 10) || 0;
  const otherDependents = parseInt(elements.rentalOtherDependents.value, 10) || 0;
  const varietySpendingRaw = parseFloat(elements.rentalVarietySpending.value.replace(/,/g, "")) || 0;
  const varietySpending = convertToKhr(varietySpendingRaw, getSelectedCurrency("rentalVarietyCurrency"));
  return calculateRentalPropertyDeductions({
    spouseStatus,
    childrenCount,
    otherDependents,
    varietySpending,
  });
}

function getStampDutyType() {
  return elements.stampDutyType?.value || "transfer";
}

function updateStampDutyVisibility() {
  const type = getStampDutyType();
  const isTransfer = type === "transfer";
  const isCompanyShare = type === "companyShare";
  const isDissolution = type === "dissolution";

  document.getElementById("stampDutyValueGroup").style.display = isDissolution ? "none" : "block";
  document.getElementById("stampDutySpecialGroup").style.display = isTransfer ? "block" : "none";
  document.getElementById("stampDutyFixedGroup").style.display = isDissolution ? "block" : "none";
  document.getElementById("stampDutyNote").style.display = isDissolution ? "none" : "block";
}

function updateDeductionSummary() {
  const deductions = getSalaryDeductions();

  // document.getElementById("standardReliefValue").innerHTML =
  //   `${deductions.standardRelief.toLocaleString()} KHR`;
  document.getElementById("spouseDeductionValue").innerHTML =
    `${deductions.spouseDeduction.toLocaleString()} KHR`;
  document.getElementById("childrenDeductionValue").innerHTML =
    `${deductions.childrenDeduction.toLocaleString()} KHR`;
  document.getElementById("otherDeductionValue").innerHTML =
    `${deductions.otherDeduction.toLocaleString()} KHR`;
  document.getElementById("totalDeductionValue").innerHTML =
    `${deductions.totalDeductions.toLocaleString()} KHR`;
}

function getSalaryDeductions() {
  const monthlySalaryRaw =
    parseFloat(elements.monthlySalary.value.replace(/,/g, "")) || 0;
  const monthlySalary = convertToKhr(
    monthlySalaryRaw,
    getSelectedCurrency("salaryCurrency"),
  );
  const fringeBenefitRaw =
    parseFloat(elements.fringeBenefit.value.replace(/,/g, "")) || 0;
  const fringeBenefit = convertToKhr(
    fringeBenefitRaw,
    getSelectedCurrency("fringeCurrency"),
  );
  const foreignerStatus =
    document.querySelector('input[name="foreignerStatus"]:checked')?.value ||
    "local";
  const spouseStatus = elements.spouseStatus.value;
  const childrenCount = parseInt(elements.childrenCount.value, 10) || 0;
  const otherDependents = parseInt(elements.otherDependents.value, 10) || 0;
  const isForeigner = foreignerStatus === "foreigner";
  return calculateSalaryDeductions({
    monthlySalary,
    fringeBenefit,
    spouseStatus,
    childrenCount,
    otherDependents,
    isForeigner,
  });
}

function calculate() {
  const category = elements.taxCategory.value;
  let amountRaw = parseFloat(elements.baseAmount.value.replace(/,/g, "")) || 0;
  let amount = convertToKhr(amountRaw, getSelectedCurrency("baseCurrency"));
  let taxAmount = 0;
  let taxableBase = 0;
  let total = 0;
  let breakdown = "";
  let grossAmount = amount;
  let totalDeductions = 0;
  let vatResult = null;

  if (category === "vat") {
    const purchasingAmountRaw = parseFloat(elements.purchasingAmount.value.replace(/,/g, "")) || 0;
    const purchasingAmount = convertToKhr(
      purchasingAmountRaw,
      getSelectedCurrency("purchasingCurrency"),
    );
    const purchasingVatMode = getPurchasingVatMode();
    const purchasingVatCase = getPurchasingVatCase();
    const sellingAmountRaw = parseFloat(elements.sellingAmount.value.replace(/,/g, "")) || 0;
    const sellingAmount = convertToKhr(
      sellingAmountRaw,
      getSelectedCurrency("sellingCurrency"),
    );
    const outputVatMode = getOutputVatMode();
    const sellingVatCase = getSellingVatCase();

    const result = calculateVATAdvanced(
      purchasingAmount,
      purchasingVatMode,
      purchasingVatCase,
      sellingAmount,
      outputVatMode,
      sellingVatCase,
    );

    taxAmount = result.tax;
    vatResult = result;
    taxableBase = purchasingAmount;
    total = purchasingAmount + sellingAmount;
    const purchasingCaseLabel =
      purchasingVatCase === "withVat"
        ? "Supply with VAT (10%)"
        : "Supply without VAT (0%)";
    const sellingCaseLabel =
      sellingVatCase === "domestic"
        ? "Domestic sale 10%"
        : sellingVatCase === "import"
          ? "Import 10%"
          : "Export 0%";
    const purchasingModeLabel =
      purchasingVatMode === "exclusive"
        ? "Exclusive(Without VAT)"
        : "Inclusive(With VAT)";
    const outputModeLabel =
      outputVatMode === "exclusive"
        ? "Exclusive(Without VAT)"
        : "Inclusive(With VAT)";

    breakdown =
      currentLanguage === "en"
        ? `Output VAT: ${result.outputVAT.toLocaleString()} KHR (${purchasingModeLabel}, ${purchasingCaseLabel}); Input VAT: ${result.inputVAT.toLocaleString()} KHR (${outputModeLabel}, ${sellingCaseLabel}); Tax = Output VAT - Input VAT`
        : `អាករលើធាតុចេញ (Output VAT): ${result.outputVAT.toLocaleString()} KHR (${purchasingModeLabel}, ${purchasingCaseLabel}); អាករលើធាតុចូល (Input VAT): ${result.inputVAT.toLocaleString()} KHR (${outputModeLabel}, ${sellingCaseLabel}); Tax = អាករលើធាតុចេញ (Output VAT) - អាករលើធាតុចូល (Input VAT)`;
  } else if (category === "salary") {
    const deductions = getSalaryDeductions();
    grossAmount = deductions.monthlySalary + deductions.fringeBenefit;
    taxableBase = deductions.taxableIncome;
    const baseSalaryTax = calculateSalaryTax(taxableBase, deductions.isForeigner);
    const fringeTax = Math.round(deductions.fringeBenefit * 0.2);
    taxAmount = baseSalaryTax + fringeTax;
    total = grossAmount - taxAmount;
    totalDeductions = deductions.totalDeductions;

    const taxRateDesc = deductions.isForeigner
      ? currentLanguage === "en"
        ? "Foreigner salary tax: flat 20% (no deductions)"
        : "ពន្ធលើប្រាក់ខែបរទេស: អត្រាប្រភេទថេរ ២០% (គ្មានការកាត់បន្ថយ)"
      : currentLanguage === "en"
        ? "Progressive rates: 0%→5%→10%→15%→20%"
        : "អត្រារីកចម្រើន: ០%→៥%→១០%→១៥%→២០%";

    breakdown =
      currentLanguage === "en"
        ? `Tax Calculation (Official: Prakas No. 575, Sept 2024): Spouse Deduction: ${deductions.spouseDeduction.toLocaleString()} KHR, Children (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} KHR, Other Dependents (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} KHR, ${taxRateDesc}; Fringe Benefit Tax: ${Math.round(deductions.fringeBenefit * 0.2).toLocaleString()} KHR`
        : `ការគណនាពន្ធ (ផ្លូវការ: Prakas No. 575, កញ្ញា 2024): ការកាត់បន្ថយស្វាមី/ភរិយា: ${deductions.spouseDeduction.toLocaleString()} រៀល, កូន (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} រៀល, អ្នកនៅក្នុងបន្ទុក (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} រៀល, ${taxRateDesc}; ពន្ធអត្រាអត្ថប្រយោជន៍: ${Math.round(deductions.fringeBenefit * 0.2).toLocaleString()} រៀល`;
  } else if (category === "incomeTax") {
    const incomeTaxType = elements.incomeTaxType?.value || "general";
    const result = calculateIncomeTax(amount, incomeTaxType);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    if (incomeTaxType === "soleProprietorship") {
      totalDeductions = result.deduction;
    }
    const typeLabel = elements.incomeTaxType?.selectedOptions[0]?.text || "";
    breakdown =
      currentLanguage === "en"
        ? `Income Tax: ${typeLabel}${incomeTaxType === "soleProprietorship" ? `; Bracket deduction: ${result.deduction.toLocaleString()} KHR` : ""}`
        : `ពន្ធលើប្រាក់ចំណូល: ${typeLabel}${incomeTaxType === "soleProprietorship" ? `; ការកាត់បន្ថយចំណាត់ថ្នាក់: ${result.deduction.toLocaleString()} រៀល` : ""}`;
  } else if (category === "withholding") {
    const whtSubcategory = elements.whtSubcategory?.value || "resident";
    const whtType = elements.whtType?.value || "service";
    const whtRate = getWHTRate(whtSubcategory, whtType);
    const result = calculateWHT(amount, whtRate);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    const whtSubcategoryLabel = elements.whtSubcategory?.selectedOptions[0]?.text || "";
    const whtTypeLabel = elements.whtType?.selectedOptions[0]?.text || "";
    breakdown =
      currentLanguage === "en"
        ? `Withholding Tax (WHT): ${whtSubcategoryLabel} - ${whtTypeLabel}`
        : `ពន្ធកាត់ទុក (WHT): ${whtSubcategoryLabel} - ${whtTypeLabel}`;
  } else if (category === "property") {
    const propertyMode = getPropertyMode();
    const propertyValueRaw = parseFloat(elements.propertyValue.value.replace(/,/g, "")) || 0;
    const propertyValue = convertToKhr(
      propertyValueRaw,
      getSelectedCurrency("propertyCurrency"),
    );

    if (propertyMode === "used") {
      const result = calculatePropertyTax(propertyValue);
      taxAmount = result.taxAmount;
      taxableBase = result.taxableBase;
      total = result.total;
      breakdown =
        currentLanguage === "en"
          ? `Property Tax (Used): ((value × 80%) - 100,000,000) × 0.1%`
          : `ពន្ធអចលនទ្រព្យប្រើប្រាស់: ០.១% លើតម្លៃលើស 100,000,000 រៀល`;
    } else {
      const propertySurface = parseFloat(elements.propertySurface.value) || 0;
      const taxableSurface = Math.max(propertySurface - 50000, 0);
      const tax = Math.round(taxableSurface * propertyValue * 0.02);
      taxAmount = tax;
      taxableBase = taxableSurface;
      total = Math.round(propertyValue * propertySurface - tax);
      breakdown =
        currentLanguage === "en"
          ? `Unused Property Tax: ((surface - 50,000) × value) × 2%`
          : `ពន្ធដីមិនប្រើប្រាស់: ((ផ្ទៃ - 50,000) × តម្លៃ) × 2%`;
    }
  } else if (category === "rental") {
    amountRaw = parseFloat(elements.rentalIncome.value.replace(/,/g, "")) || 0;
    amount = convertToKhr(amountRaw, getSelectedCurrency("rentalCurrency"));
    const businessType = getRentalBusinessType();
    if (businessType === "unregistered") {
      const result = calculateUnregisteredRentalTax(amount);
      taxAmount = result.taxAmount;
      taxableBase = result.taxableBase;
      total = result.total;
      grossAmount = amount;
      totalDeductions = 0;
      breakdown =
        currentLanguage === "en"
          ? `Tax on Immovable Property Rental (Unregistered Business): Flat rate 10%. Tax = ${amount.toLocaleString()} KHR × 10% = ${taxAmount.toLocaleString()} KHR`
          : `ពន្ធលើការជួលអចលនទ្រព្យ (អាជីវកម្មមិនបានចុះបញ្ជី): អត្រាថេរ ១០%. ពន្ធ = ${amount.toLocaleString()} រៀល × ១០% = ${taxAmount.toLocaleString()} រៀល`;
    } else {
      const deductions = getRentalDeductions();
      grossAmount = amount;
      totalDeductions = deductions.totalDeductions;
      const result = calculateSoleProprietorshipRentalTax(amount, deductions);
      taxAmount = result.taxAmount;
      taxableBase = result.taxableBase;
      total = result.total;
      breakdown =
        currentLanguage === "en"
          ? `Tax on Immovable Property Rental (Sole Proprietorship): Progressive rates 0%→5%→10%→15%→20%. Spouse Deduction: ${deductions.spouseDeduction.toLocaleString()} KHR, Children (${elements.rentalChildrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} KHR, Other Dependents (${elements.rentalOtherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} KHR`
          : `ពន្ធលើការជួលអចលនទ្រព្យ (សហគ្រាសឯកបុគ្គល): អត្រារីកចម្រើន ០%→៥%→១០%→១៥%→២០%. ការកាត់បន្ថយស្វាមី/ភរិយា: ${deductions.spouseDeduction.toLocaleString()} រៀល, កូន (${elements.rentalChildrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} រៀល, អ្នកនៅក្នុងបន្ទុក (${elements.rentalOtherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} រៀល`;
    }
  
  } else if (category === "accommodation") {
    const result = calculateAccommodationTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en" ? "Accommodation Tax: 2% on accommodation services" : "ពន្ធស្នាក់នៅ: ២% លើសេវាកម្មស្នាក់នៅ";
  } else if (category === "import") {
    const stampType = getStampDutyType();
    const valueRaw = parseFloat(elements.stampDutyValue.value.replace(/,/g, "")) || 0;
    const value = convertToKhr(valueRaw, getSelectedCurrency("stampDutyCurrency"));
    const familyType = document.querySelector('input[name="stampFamilyType"]:checked')?.value || "family";
    const specialCase = document.querySelector('input[name="stampSpecialCase"]:checked')?.value || "notBorey";

    const result = calculateStampDuty({ stampType, value, familyType, specialCase });
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = value;

    const typeLabel = elements.stampDutyType.selectedOptions[0]?.text || "";
    const familyLabel = familyType === "family" ? "Family" : "None Family";
    breakdown =
      currentLanguage === "en"
        ? `Stamp Duty (${typeLabel}): ${result.breakdown}`
        : `ពន្ធត្រា (${typeLabel}): ${result.breakdown}`;
  } else if (category === "patent") {
    const pType = document.getElementById("patentType").value;
    const result = calculatePatentTax(pType);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = 0;
    breakdown = currentLanguage === "en" ? `Patent Tax for ${pType}` : `ពន្ធប៉ាតង់សម្រាប់ ${pType}`;
  } else if (category === "publicLighting") {
    const result = calculatePublicLightingTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en" ? "Public Lighting Tax: 5% on alcohol and tobacco" : "ពន្ធបំភ្លឺសាធារណៈ: ៥% លើគ្រឿងស្រវឹង និងថ្នាំជក់";
  } else if (category === "specific") {
    amountRaw = parseFloat(document.getElementById("specificAmount").value.replace(/,/g, "")) || 0;
    amount = convertToKhr(amountRaw, getSelectedCurrency("specificCurrency"));
    const specStatus = document.querySelector('input[name="specificStatus"]:checked')?.value || "local";
    const specRate = specStatus === "local" ? 0.90 : 1;
    const specType = document.getElementById("specificType")?.value || "wine";
    const typeRates = {
      wine: 0.35,
      beer: 0.30,
      ciga: 0.25,
      cigaratte: 0.20,
      energy: 0.15,
      beverage: 0.10,
      cement: 0.05,
      telecom: 0.03,
    };
    const typeRate = typeRates[specType] || 0.35;
    const result = calculateSpecificTax(amount, specRate, typeRate);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    const statusLabel = specStatus === "local" ? "Local Company (90%)" : "Foreigner Company (100%)";
    const typeLabels = { wine: "Wine and Liquor (35%)", beer: "Beer (30%)", ciga: "Ciga (25%)", cigaratte: "Cigaratte (20%)", energy: "Energy Drinks (15%)", beverage: "Laverage, Entertainment Service, Air Travel (10%)", cement: "Cement (5%)", telecom: "Telecommunications (3%)" };
    const typeLabel = typeLabels[specType] || "Wine and Liquor (35%)";
    breakdown = currentLanguage === "en"
      ? `Specific Tax: Amount ${amount.toLocaleString()} KHR × ${statusLabel} × ${typeLabel} = ${taxAmount.toLocaleString()} KHR`
      : `អាករពិសេស: ទឹកប្រាក់ ${amount.toLocaleString()} រៀល × ${statusLabel} × ${typeLabel} = ${taxAmount.toLocaleString()} រៀល`;
  } else if (category === "vehicle") {
    const vType = document.getElementById("vehicleType").value;
    const result = calculateVehicleTax(vType);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = 0;
    breakdown = currentLanguage === "en" ? `Vehicle Tax for ${vType}` : `ពន្ធមធ្យោបាយដឹកជញ្ជូនសម្រាប់ ${vType}`;
} else if (category === "transportation") {
    amountRaw =
      parseFloat(elements.transportationExpense.value.replace(/,/g, "")) || 0;
    amount = convertToKhr(amountRaw, getSelectedCurrency("transportCurrency"));
    const result = calculateTransportationTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = amount;
    breakdown =
      currentLanguage === "en"
        ? `Transportation Tax: 5% on monthly transportation expenses`
        : `ពន្ធការដឹក: ៥% លើការចំណាយដឹកជញ្ជូនប្រចាំខែ`;
  }

  const taxAmountEl = document.getElementById("taxAmountValue");
  taxAmountEl.innerHTML = `${taxAmount.toLocaleString()} KHR`;

  const isVatCategory = category === "vat";
  if (isVatCategory && taxAmount < 0) {
    taxAmountEl.classList.add("negative");
  } else {
    taxAmountEl.classList.remove("negative");
  }
  document.getElementById("outputTaxRow").style.display = isVatCategory ? "flex" : "none";
  document.getElementById("inputTaxRow").style.display = isVatCategory ? "flex" : "none";

  if (isVatCategory && vatResult) {
    document.getElementById("outputTaxValue").innerHTML =
      `${vatResult.outputVAT.toLocaleString()} KHR`;
    document.getElementById("inputTaxValue").innerHTML =
      `${vatResult.inputVAT.toLocaleString()} KHR`;
  }

  const breakdownElement = document.getElementById("taxBreakdown");
  breakdownElement.innerHTML = breakdown;
  breakdownElement.style.display = "block";
}

elements.taxCategory.addEventListener("change", () => {
  updateCategoryVisibility();
  calculate();
});

elements.incomeTaxType?.addEventListener("change", calculate);

elements.whtSubcategory?.addEventListener("change", () => {
  updateWhtTypeOptions();
  calculate();
});

elements.whtType?.addEventListener("change", calculate);

elements.monthlySalary.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  updateDeductionSummary();
  calculate();
});

elements.fringeBenefit.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

document.querySelectorAll('input[name="foreignerStatus"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    updateDeductionSummary();
    calculate();
  });
});

elements.spouseStatus.addEventListener("change", () => {
  updateDeductionSummary();
  calculate();
});

elements.childrenCount.addEventListener("input", () => {
  updateDeductionSummary();
  calculate();
});

elements.otherDependents.addEventListener("input", () => {
  updateDeductionSummary();
  calculate();
});

elements.rentalIncome.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

document.querySelectorAll('input[name="rentalBusinessType"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    updateRentalVisibility();
    calculate();
  });
});

elements.rentalSpouseStatus.addEventListener("change", () => {
  updateRentalDeductionSummary();
  calculate();
});

elements.rentalChildrenCount.addEventListener("input", () => {
  updateRentalDeductionSummary();
  calculate();
});

elements.rentalOtherDependents.addEventListener("input", () => {
  updateRentalDeductionSummary();
  calculate();
});

elements.rentalVarietySpending.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  updateRentalDeductionSummary();
  calculate();
});

elements.transportationExpense.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

elements.stampDutyType?.addEventListener("change", () => {
  updateStampDutyVisibility();
  calculate();
});

elements.stampDutyValue?.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

document.querySelectorAll('input[name="stampFamilyType"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

document.querySelectorAll('input[name="stampSpecialCase"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

elements.baseAmount.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});
elements.propertyValue.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});
elements.propertySurface.addEventListener("input", calculate);
document.querySelectorAll('input[name="propertyMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    updateCategoryVisibility();
    calculate();
  });
});

elements.purchasingAmount.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

elements.sellingAmount.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

document.querySelectorAll('input[name="purchasingVatMode"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

document.querySelectorAll('input[name="purchasingVatCase"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

document.querySelectorAll('input[name="outputVatMode"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

document.querySelectorAll('input[name="sellingVatCase"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

getCurrencyRadios().forEach((radio) => {
  radio.addEventListener("change", () => {
    updateDeductionSummary();
    calculate();
  });
});


document.getElementById("dutyRate")?.addEventListener("input", calculate);
document.getElementById("patentType")?.addEventListener("change", calculate);
document.getElementById("vehicleType")?.addEventListener("change", calculate);

const specificAmount = document.getElementById("specificAmount");
if (specificAmount) {
  specificAmount.addEventListener("input", (e) => {
    formatCurrencyInput(e);
    calculate();
  });
}
document.querySelectorAll('input[name="specificStatus"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});
document.getElementById("specificType")?.addEventListener("change", calculate);

elements.calculateBtn.addEventListener("click", calculate);

document.getElementById("btnEn").addEventListener("click", () => {
  currentLanguage = "en";
  document
    .querySelectorAll(".lang-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnEn").classList.add("active");
  updateLanguage(currentLanguage, elements);
  updateWhtTypeOptions();
  updateDeductionSummary();
  calculate();
});

document.getElementById("btnKh").addEventListener("click", () => {
  currentLanguage = "kh";
  document
    .querySelectorAll(".lang-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnKh").classList.add("active");
  updateLanguage(currentLanguage, elements);
  updateWhtTypeOptions();
  updateDeductionSummary();
  calculate();
});

document.getElementById("btnGov").addEventListener("click", () => {
  document.documentElement.setAttribute("data-theme", "government");
  document
    .querySelectorAll(".theme-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnGov").classList.add("active");
});

document.getElementById("btnDigital").addEventListener("click", () => {
  document.documentElement.setAttribute("data-theme", "digital");
  document
    .querySelectorAll(".theme-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnDigital").classList.add("active");
});

// Initialize
loadTranslations();
