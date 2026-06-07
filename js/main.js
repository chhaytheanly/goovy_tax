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
import { calculateImportDuty } from "./tax/importDuty.js";
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
    (isSalary || isRental || isTransportation || isPatent || isVehicle || isProperty || isVat || isSpecific) ? "none" : "block";
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

  const dutyRateGroup = document.getElementById("dutyRateGroup");
  if(dutyRateGroup) dutyRateGroup.style.display = isImport ? "block" : "none";
  
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
    const modeLabel = (mode) =>
      mode === "exclusive" ? "Exclusive (Without VAT)" : "Inclusive (With VAT)";
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

    const vatOv = result.outputVAT.toLocaleString();
    const vatIv = result.inputVAT.toLocaleString();
    breakdown =
      currentLanguage === "en"
        ? `<div class="bd"><div class="bd-title">VAT (Value Added Tax)</div><div class="bd-row"><span class="bd-label">Output VAT (from Sales)</span><span class="bd-value">${vatOv} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Sales Amount</span><span class="bd-value">${sellingAmount.toLocaleString()} KHR (${modeLabel(outputVatMode)}, ${sellingCaseLabel})</span></div><div class="bd-row"><span class="bd-label">Input VAT (from Purchases)</span><span class="bd-value">${vatIv} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Purchases Amount</span><span class="bd-value">${purchasingAmount.toLocaleString()} KHR (${modeLabel(purchasingVatMode)}, ${purchasingCaseLabel})</span></div><div class="bd-formula">Tax Payable = Output VAT − Input VAT<br>= ${vatOv} − ${vatIv} = ${result.tax.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${result.tax.toLocaleString()} KHR</span></div></div>`
        : `<div class="bd"><div class="bd-title">អាករលើតម្លៃបន្ថែម (VAT)</div><div class="bd-row"><span class="bd-label">អាករលើធាតុចេញ (ពីការលក់)</span><span class="bd-value">${vatOv} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">ទឹកប្រាក់លក់</span><span class="bd-value">${sellingAmount.toLocaleString()} KHR (${modeLabel(outputVatMode)}, ${sellingCaseLabel})</span></div><div class="bd-row"><span class="bd-label">អាករលើធាតុចូល (ពីការទិញ)</span><span class="bd-value">${vatIv} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">ទឹកប្រាក់ទិញ</span><span class="bd-value">${purchasingAmount.toLocaleString()} KHR (${modeLabel(purchasingVatMode)}, ${purchasingCaseLabel})</span></div><div class="bd-formula">ពន្ធត្រូវបង់ = អាករលើធាតុចេញ − អាករលើធាតុចូល<br>= ${vatOv} − ${vatIv} = ${result.tax.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${result.tax.toLocaleString()} KHR</span></div></div>`;
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

    const fringeTaxVal = Math.round(deductions.fringeBenefit * 0.2);
    breakdown =
      currentLanguage === "en"
        ? `<div class="bd"><div class="bd-title">Tax on Salary</div><div class="bd-sub">Income</div><div class="bd-row"><span class="bd-label">Monthly Salary</span><span class="bd-value">${deductions.monthlySalary.toLocaleString()} KHR</span></div><div class="bd-sub">Deductions</div><div class="bd-row bd-indent"><span class="bd-label">Spouse</span><span class="bd-value">${deductions.spouseDeduction.toLocaleString()} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Children (${elements.childrenCount.value || 0} × 150,000)</span><span class="bd-value">${deductions.childrenDeduction.toLocaleString()} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Other Dependents (${elements.otherDependents.value || 0} × 150,000)</span><span class="bd-value">${deductions.otherDeduction.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Total Deductions</span><span class="bd-value">${deductions.totalDeductions.toLocaleString()} KHR</span></div><div class="bd-formula">Taxable Salary = ${deductions.monthlySalary.toLocaleString()} − ${deductions.totalDeductions.toLocaleString()} = ${taxableBase.toLocaleString()} KHR</div><div class="bd-row"><span class="bd-label">Taxable Salary</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-sub">Tax Calculation</div><div class="bd-row"><span class="bd-label">${taxRateDesc}</span></div><div class="bd-row"><span class="bd-label">Base Salary Tax</span><span class="bd-value">${baseSalaryTax.toLocaleString()} KHR</span></div>${deductions.fringeBenefit > 0 ? `<div class="bd-sub">Fringe Benefit</div><div class="bd-row"><span class="bd-label">Fringe Benefit Amount</span><span class="bd-value">${deductions.fringeBenefit.toLocaleString()} KHR</span></div><div class="bd-formula">Fringe Tax = ${deductions.fringeBenefit.toLocaleString()} × 20% = ${fringeTaxVal.toLocaleString()} KHR</div>` : ''}<div class="bd-row bd-divider"><span class="bd-result-label">Total Tax Payable</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
        : `<div class="bd"><div class="bd-title">ពន្ធលើប្រាក់ខែ</div><div class="bd-sub">ចំណូល</div><div class="bd-row"><span class="bd-label">ប្រាក់ខែប្រចាំខែ</span><span class="bd-value">${deductions.monthlySalary.toLocaleString()} រៀល</span></div><div class="bd-sub">ការកាត់បន្ថយ</div><div class="bd-row bd-indent"><span class="bd-label">ស្វាមី/ភរិយា</span><span class="bd-value">${deductions.spouseDeduction.toLocaleString()} រៀល</span></div><div class="bd-row bd-indent"><span class="bd-label">កូន (${elements.childrenCount.value || 0} × 150,000)</span><span class="bd-value">${deductions.childrenDeduction.toLocaleString()} រៀល</span></div><div class="bd-row bd-indent"><span class="bd-label">អ្នកនៅក្នុងបន្ទុក (${elements.otherDependents.value || 0} × 150,000)</span><span class="bd-value">${deductions.otherDeduction.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">ការកាត់បន្ថយសរុប</span><span class="bd-value">${deductions.totalDeductions.toLocaleString()} រៀល</span></div><div class="bd-formula">ប្រាក់ខែជាប់ពន្ធ = ${deductions.monthlySalary.toLocaleString()} − ${deductions.totalDeductions.toLocaleString()} = ${taxableBase.toLocaleString()} រៀល</div><div class="bd-row"><span class="bd-label">ប្រាក់ខែជាប់ពន្ធ</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-sub">ការគណនាពន្ធ</div><div class="bd-row"><span class="bd-label">${taxRateDesc}</span></div><div class="bd-row"><span class="bd-label">ពន្ធប្រាក់ខែគោល</span><span class="bd-value">${baseSalaryTax.toLocaleString()} រៀល</span></div>${deductions.fringeBenefit > 0 ? `<div class="bd-sub">អត្ថប្រយោជន៍</div><div class="bd-row"><span class="bd-label">ទឹកប្រាក់អត្ថប្រយោជន៍</span><span class="bd-value">${deductions.fringeBenefit.toLocaleString()} រៀល</span></div><div class="bd-formula">ពន្ធអត្ថប្រយោជន៍ = ${deductions.fringeBenefit.toLocaleString()} × 20% = ${fringeTaxVal.toLocaleString()} រៀល</div>` : ''}<div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធសរុបត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
    const ratePct = Math.round(result.rate * 100);
    if (incomeTaxType === "soleProprietorship") {
      breakdown =
        currentLanguage === "en"
          ? `<div class="bd"><div class="bd-title">Income Tax (Sole Proprietorship)</div><div class="bd-row"><span class="bd-label">Taxable Income</span><span class="bd-value">${amount.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Progressive Bracket Rate</span><span class="bd-value">${ratePct}%</span></div><div class="bd-row"><span class="bd-label">Bracket Deduction</span><span class="bd-value">${result.deduction.toLocaleString()} KHR</span></div><div class="bd-formula">Tax = (${amount.toLocaleString()} × ${ratePct}%) − ${result.deduction.toLocaleString()}<br>= ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
          : `<div class="bd"><div class="bd-title">ពន្ធលើប្រាក់ចំណូល (សហគ្រាសឯកបុគ្គល)</div><div class="bd-row"><span class="bd-label">ប្រាក់ចំណូលជាប់ពន្ធ</span><span class="bd-value">${amount.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រារីកចម្រើន</span><span class="bd-value">${ratePct}%</span></div><div class="bd-row"><span class="bd-label">ការកាត់បន្ថយតាមចំណាត់ថ្នាក់</span><span class="bd-value">${result.deduction.toLocaleString()} រៀល</span></div><div class="bd-formula">ពន្ធ = (${amount.toLocaleString()} × ${ratePct}%) − ${result.deduction.toLocaleString()}<br>= ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
    } else {
      breakdown =
        currentLanguage === "en"
          ? `<div class="bd"><div class="bd-title">Income Tax</div><div class="bd-row"><span class="bd-label">Taxpayer Type</span><span class="bd-value">${typeLabel}</span></div><div class="bd-row"><span class="bd-label">Taxable Income</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Tax Rate</span><span class="bd-value">${ratePct}%</span></div><div class="bd-formula">Tax = ${taxableBase.toLocaleString()} × ${ratePct}% = ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
          : `<div class="bd"><div class="bd-title">ពន្ធលើប្រាក់ចំណូល</div><div class="bd-row"><span class="bd-label">ប្រភេទអ្នកជាប់ពន្ធ</span><span class="bd-value">${typeLabel}</span></div><div class="bd-row"><span class="bd-label">ប្រាក់ចំណូលជាប់ពន្ធ</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាពន្ធ</span><span class="bd-value">${ratePct}%</span></div><div class="bd-formula">ពន្ធ = ${taxableBase.toLocaleString()} × ${ratePct}% = ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
    }
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
    const whtRatePct = Math.round(whtRate * 100);
    breakdown =
      currentLanguage === "en"
        ? `<div class="bd"><div class="bd-title">Withholding Tax (WHT)</div><div class="bd-row"><span class="bd-label">Subcategory</span><span class="bd-value">${whtSubcategoryLabel}</span></div><div class="bd-row"><span class="bd-label">Type</span><span class="bd-value">${whtTypeLabel}</span></div><div class="bd-row"><span class="bd-label">Taxable Amount</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Rate</span><span class="bd-value">${whtRatePct}%</span></div><div class="bd-formula">Tax = ${taxableBase.toLocaleString()} × ${whtRatePct}% = ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
        : `<div class="bd"><div class="bd-title">ពន្ធកាត់ទុក (WHT)</div><div class="bd-row"><span class="bd-label">ប្រភេទរង</span><span class="bd-value">${whtSubcategoryLabel}</span></div><div class="bd-row"><span class="bd-label">ប្រភេទ</span><span class="bd-value">${whtTypeLabel}</span></div><div class="bd-row"><span class="bd-label">ទឹកប្រាក់ជាប់ពន្ធ</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រា</span><span class="bd-value">${whtRatePct}%</span></div><div class="bd-formula">ពន្ធ = ${taxableBase.toLocaleString()} × ${whtRatePct}% = ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
      const eightyPct = Math.round(propertyValue * 0.8);
      breakdown =
        currentLanguage === "en"
          ? `<div class="bd"><div class="bd-title">Property Tax (Used Property)</div><div class="bd-row"><span class="bd-label">Property Value</span><span class="bd-value">${propertyValue.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">80% of Value</span><span class="bd-value">${eightyPct.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Threshold</span><span class="bd-value">100,000,000 KHR</span></div><div class="bd-formula">(Value × 80% − 100,000,000) × 0.1%<br>= (${eightyPct.toLocaleString()} − 100,000,000) × 0.1%<br>= ${taxableBase.toLocaleString()} × 0.1%<br>= ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
          : `<div class="bd"><div class="bd-title">ពន្ធអចលនទ្រព្យប្រើប្រាស់</div><div class="bd-row"><span class="bd-label">តម្លៃអចលនទ្រព្យ</span><span class="bd-value">${propertyValue.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">៨០% នៃតម្លៃ</span><span class="bd-value">${eightyPct.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">កម្រិតកំណត់</span><span class="bd-value">១០០,០០០,០០០ រៀល</span></div><div class="bd-formula">(តម្លៃ × ៨០% − ១០០,០០០,០០០) × ០.១%<br>= (${eightyPct.toLocaleString()} − ១០០,០០០,០០០) × ០.១%<br>= ${taxableBase.toLocaleString()} × ០.១%<br>= ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
    } else {
      const propertySurface = parseFloat(elements.propertySurface.value) || 0;
      const taxableSurface = Math.max(propertySurface - 50000, 0);
      const tax = Math.round(taxableSurface * propertyValue * 0.02);
      taxAmount = tax;
      taxableBase = taxableSurface;
      total = Math.round(propertyValue * propertySurface - tax);
      const areaValue = Math.round(taxableSurface * propertyValue);
      breakdown =
        currentLanguage === "en"
          ? `<div class="bd"><div class="bd-title">Property Tax (Unused Property)</div><div class="bd-row"><span class="bd-label">Surface Area</span><span class="bd-value">${propertySurface.toLocaleString()} m²</span></div><div class="bd-row"><span class="bd-label">Exempt Area (50,000 m²)</span><span class="bd-value">50,000 m²</span></div><div class="bd-row"><span class="bd-label">Taxable Area</span><span class="bd-value">${taxableSurface.toLocaleString()} m²</span></div><div class="bd-row"><span class="bd-label">Value per m²</span><span class="bd-value">${propertyValue.toLocaleString()} KHR</span></div><div class="bd-formula">(Taxable Area × Value per m²) × 2%<br>= (${taxableSurface.toLocaleString()} × ${propertyValue.toLocaleString()}) × 2%<br>= ${areaValue.toLocaleString()} × 2%<br>= ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
          : `<div class="bd"><div class="bd-title">ពន្ធដីមិនប្រើប្រាស់</div><div class="bd-row"><span class="bd-label">ផ្ទៃដី</span><span class="bd-value">${propertySurface.toLocaleString()} m²</span></div><div class="bd-row"><span class="bd-label">ផ្ទៃលើកលែង (៥០,០០០ m²)</span><span class="bd-value">៥០,០០០ m²</span></div><div class="bd-row"><span class="bd-label">ផ្ទៃជាប់ពន្ធ</span><span class="bd-value">${taxableSurface.toLocaleString()} m²</span></div><div class="bd-row"><span class="bd-label">តម្លៃក្នុងមួយ m²</span><span class="bd-value">${propertyValue.toLocaleString()} រៀល</span></div><div class="bd-formula">(ផ្ទៃជាប់ពន្ធ × តម្លៃក្នុងមួយ m²) × ២%<br>= (${taxableSurface.toLocaleString()} × ${propertyValue.toLocaleString()}) × ២%<br>= ${areaValue.toLocaleString()} × ២%<br>= ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
      const threshold = 500000;
      breakdown =
        currentLanguage === "en"
          ? `<div class="bd"><div class="bd-title">Rental Tax (Unregistered)</div><div class="bd-row"><span class="bd-label">Monthly Rental Income</span><span class="bd-value">${amount.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Tax Rate</span><span class="bd-value">10% (if > ${threshold.toLocaleString()} KHR)</span></div>${amount < threshold ? `<div class="bd-row"><span class="bd-label">Status</span><span class="bd-value">Below threshold — no tax</span></div>` : `<div class="bd-formula">Tax = ${amount.toLocaleString()} × 10% = ${taxAmount.toLocaleString()} KHR</div>`}<div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
          : `<div class="bd"><div class="bd-title">ពន្ធជួលអចលនទ្រព្យ (មិនបានចុះបញ្ជី)</div><div class="bd-row"><span class="bd-label">ចំណូលជួលប្រចាំខែ</span><span class="bd-value">${amount.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាពន្ធ</span><span class="bd-value">១០% (បើ &gt; ${threshold.toLocaleString()} រៀល)</span></div>${amount < threshold ? `<div class="bd-row"><span class="bd-label">ស្ថានភាព</span><span class="bd-value">ក្រោមកម្រិត — គ្មានពន្ធ</span></div>` : `<div class="bd-formula">ពន្ធ = ${amount.toLocaleString()} × ១០% = ${taxAmount.toLocaleString()} រៀល</div>`}<div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
          ? `<div class="bd"><div class="bd-title">Rental Tax (Sole Proprietorship)</div><div class="bd-row"><span class="bd-label">Gross Rental Income</span><span class="bd-value">${amount.toLocaleString()} KHR</span></div><div class="bd-sub">Deductions</div><div class="bd-row bd-indent"><span class="bd-label">Spouse</span><span class="bd-value">${deductions.spouseDeduction.toLocaleString()} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Children (${elements.rentalChildrenCount.value || 0} × 150,000)</span><span class="bd-value">${deductions.childrenDeduction.toLocaleString()} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Other Dependents (${elements.rentalOtherDependents.value || 0} × 150,000)</span><span class="bd-value">${deductions.otherDeduction.toLocaleString()} KHR</span></div><div class="bd-row bd-indent"><span class="bd-label">Variety Spending</span><span class="bd-value">${deductions.varietySpending.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Total Deductions</span><span class="bd-value">${deductions.totalDeductions.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Taxable Income</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Progressive Rates</span><span class="bd-value">0% → 5% → 10% → 15% → 20%</span></div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
          : `<div class="bd"><div class="bd-title">ពន្ធជួលអចលនទ្រព្យ (សហគ្រាសឯកបុគ្គល)</div><div class="bd-row"><span class="bd-label">ចំណូលជួលសរុប</span><span class="bd-value">${amount.toLocaleString()} រៀល</span></div><div class="bd-sub">ការកាត់បន្ថយ</div><div class="bd-row bd-indent"><span class="bd-label">ស្វាមី/ភរិយា</span><span class="bd-value">${deductions.spouseDeduction.toLocaleString()} រៀល</span></div><div class="bd-row bd-indent"><span class="bd-label">កូន (${elements.rentalChildrenCount.value || 0} × 150,000)</span><span class="bd-value">${deductions.childrenDeduction.toLocaleString()} រៀល</span></div><div class="bd-row bd-indent"><span class="bd-label">អ្នកនៅក្នុងបន្ទុក (${elements.rentalOtherDependents.value || 0} × 150,000)</span><span class="bd-value">${deductions.otherDeduction.toLocaleString()} រៀល</span></div><div class="bd-row bd-indent"><span class="bd-label">ការចំណាយផ្សេងៗ</span><span class="bd-value">${deductions.varietySpending.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">ការកាត់បន្ថយសរុប</span><span class="bd-value">${deductions.totalDeductions.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">ប្រាក់ចំណូលជាប់ពន្ធ</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រារីកចម្រើន</span><span class="bd-value">០% → ៥% → ១០% → ១៥% → ២០%</span></div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
    }
  
  } else if (category === "accommodation") {
    const result = calculateAccommodationTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en"
      ? `<div class="bd"><div class="bd-title">Accommodation Tax</div><div class="bd-row"><span class="bd-label">Room Charges</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Tax Rate</span><span class="bd-value">2%</span></div><div class="bd-formula">Tax = ${taxableBase.toLocaleString()} × 2% = ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
      : `<div class="bd"><div class="bd-title">ពន្ធស្នាក់នៅ</div><div class="bd-row"><span class="bd-label">តម្លៃបន្ទប់</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាពន្ធ</span><span class="bd-value">២%</span></div><div class="bd-formula">ពន្ធ = ${taxableBase.toLocaleString()} × ២% = ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
  } else if (category === "import") {
    const dutyRateStr = document.getElementById("dutyRate").value;
    const dutyRate = (parseFloat(dutyRateStr) || 0) / 100;
    const result = calculateImportDuty({ importValue: amount, dutyRate });
    taxAmount = result.totalTax; // sum of duty and VAT
    taxableBase = amount;
    total = result.grandTotal;
    const vatBase = amount + result.importDuty;
    breakdown = currentLanguage === "en"
        ? `<div class="bd"><div class="bd-title">Import Duty & VAT</div><div class="bd-row"><span class="bd-label">Import Value</span><span class="bd-value">${amount.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Duty Rate</span><span class="bd-value">${(dutyRate*100).toFixed(0)}%</span></div><div class="bd-formula">Customs Duty = ${amount.toLocaleString()} × ${(dutyRate*100).toFixed(0)}% = ${result.importDuty.toLocaleString()} KHR</div><div class="bd-row"><span class="bd-label">VAT Base (Value + Duty)</span><span class="bd-value">${vatBase.toLocaleString()} KHR</span></div><div class="bd-formula">VAT = ${vatBase.toLocaleString()} × 10% = ${result.vat.toLocaleString()} KHR</div><div class="bd-formula">Total Tax = ${result.importDuty.toLocaleString()} + ${result.vat.toLocaleString()} = ${result.totalTax.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Total Tax to Pay</span><span class="bd-result">${result.totalTax.toLocaleString()} KHR</span></div></div>`
        : `<div class="bd"><div class="bd-title">ពន្ធគយ និងអាករ</div><div class="bd-row"><span class="bd-label">តម្លៃនាំចូល</span><span class="bd-value">${amount.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាពន្ធគយ</span><span class="bd-value">${(dutyRate*100).toFixed(0)}%</span></div><div class="bd-formula">ពន្ធគយ = ${amount.toLocaleString()} × ${(dutyRate*100).toFixed(0)}% = ${result.importDuty.toLocaleString()} រៀល</div><div class="bd-row"><span class="bd-label">មូលដ្ឋានអាករ (តម្លៃ + ពន្ធគយ)</span><span class="bd-value">${vatBase.toLocaleString()} រៀល</span></div><div class="bd-formula">អាករ = ${vatBase.toLocaleString()} × ១០% = ${result.vat.toLocaleString()} រៀល</div><div class="bd-formula">ពន្ធសរុប = ${result.importDuty.toLocaleString()} + ${result.vat.toLocaleString()} = ${result.totalTax.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធសរុបត្រូវបង់</span><span class="bd-result">${result.totalTax.toLocaleString()} រៀល</span></div></div>`;
  } else if (category === "patent") {
    const pType = document.getElementById("patentType").value;
    const result = calculatePatentTax(pType);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = 0;
    const pTypeLabel = document.getElementById("patentType")?.selectedOptions[0]?.text || pType;
    breakdown = currentLanguage === "en"
      ? `<div class="bd"><div class="bd-title">Patent Tax</div><div class="bd-row"><span class="bd-label">Taxpayer Type</span><span class="bd-value">${pTypeLabel}</span></div><div class="bd-row"><span class="bd-label">Fixed Annual Amount</span><span class="bd-value">${taxAmount.toLocaleString()} KHR</span></div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
      : `<div class="bd"><div class="bd-title">ពន្ធប៉ាតង់</div><div class="bd-row"><span class="bd-label">ប្រភេទអ្នកជាប់ពន្ធ</span><span class="bd-value">${pTypeLabel}</span></div><div class="bd-row"><span class="bd-label">ចំនួនថេរប្រចាំឆ្នាំ</span><span class="bd-value">${taxAmount.toLocaleString()} រៀល</span></div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
  } else if (category === "publicLighting") {
    const result = calculatePublicLightingTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en"
      ? `<div class="bd"><div class="bd-title">Public Lighting Tax</div><div class="bd-row"><span class="bd-label">Taxable Amount</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Tax Rate</span><span class="bd-value">5%</span></div><div class="bd-formula">Tax = ${taxableBase.toLocaleString()} × 5% = ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
      : `<div class="bd"><div class="bd-title">ពន្ធបំភ្លឺសាធារណៈ</div><div class="bd-row"><span class="bd-label">ទឹកប្រាក់ជាប់ពន្ធ</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាពន្ធ</span><span class="bd-value">៥%</span></div><div class="bd-formula">ពន្ធ = ${taxableBase.toLocaleString()} × ៥% = ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
      ? `<div class="bd"><div class="bd-title">Specific Tax</div><div class="bd-row"><span class="bd-label">Base Amount</span><span class="bd-value">${amount.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Status Rate</span><span class="bd-value">${statusLabel}</span></div><div class="bd-row"><span class="bd-label">Type Rate</span><span class="bd-value">${typeLabel}</span></div><div class="bd-formula">Tax = ${amount.toLocaleString()} × ${Math.round(specRate * 100)}% × ${Math.round(typeRate * 100)}%<br>= ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
      : `<div class="bd"><div class="bd-title">អាករពិសេស</div><div class="bd-row"><span class="bd-label">ទឹកប្រាក់</span><span class="bd-value">${amount.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាស្ថានភាព</span><span class="bd-value">${statusLabel}</span></div><div class="bd-row"><span class="bd-label">អត្រាប្រភេទ</span><span class="bd-value">${typeLabel}</span></div><div class="bd-formula">ពន្ធ = ${amount.toLocaleString()} × ${Math.round(specRate * 100)}% × ${Math.round(typeRate * 100)}%<br>= ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
  } else if (category === "vehicle") {
    const vType = document.getElementById("vehicleType").value;
    const result = calculateVehicleTax(vType);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = 0;
    const vTypeLabel = document.getElementById("vehicleType")?.selectedOptions[0]?.text || vType;
    breakdown = currentLanguage === "en"
      ? `<div class="bd"><div class="bd-title">Vehicle Tax</div><div class="bd-row"><span class="bd-label">Vehicle Type</span><span class="bd-value">${vTypeLabel}</span></div><div class="bd-row"><span class="bd-label">Fixed Annual Amount</span><span class="bd-value">${taxAmount.toLocaleString()} KHR</span></div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
      : `<div class="bd"><div class="bd-title">ពន្ធមធ្យោបាយដឹកជញ្ជូន</div><div class="bd-row"><span class="bd-label">ប្រភេទយានយន្ត</span><span class="bd-value">${vTypeLabel}</span></div><div class="bd-row"><span class="bd-label">ចំនួនថេរប្រចាំឆ្នាំ</span><span class="bd-value">${taxAmount.toLocaleString()} រៀល</span></div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
        ? `<div class="bd"><div class="bd-title">Transportation Tax</div><div class="bd-row"><span class="bd-label">Monthly Transportation Expense</span><span class="bd-value">${taxableBase.toLocaleString()} KHR</span></div><div class="bd-row"><span class="bd-label">Tax Rate</span><span class="bd-value">5%</span></div><div class="bd-formula">Tax = ${taxableBase.toLocaleString()} × 5% = ${taxAmount.toLocaleString()} KHR</div><div class="bd-row bd-divider"><span class="bd-result-label">Tax to Pay</span><span class="bd-result">${taxAmount.toLocaleString()} KHR</span></div></div>`
        : `<div class="bd"><div class="bd-title">ពន្ធការដឹកជញ្ជូន</div><div class="bd-row"><span class="bd-label">ចំណាយដឹកជញ្ជូនប្រចាំខែ</span><span class="bd-value">${taxableBase.toLocaleString()} រៀល</span></div><div class="bd-row"><span class="bd-label">អត្រាពន្ធ</span><span class="bd-value">៥%</span></div><div class="bd-formula">ពន្ធ = ${taxableBase.toLocaleString()} × ៥% = ${taxAmount.toLocaleString()} រៀល</div><div class="bd-row bd-divider"><span class="bd-result-label">ពន្ធត្រូវបង់</span><span class="bd-result">${taxAmount.toLocaleString()} រៀល</span></div></div>`;
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
