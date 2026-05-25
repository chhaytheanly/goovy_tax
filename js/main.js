import { convertToKhr, getSelectedCurrency } from "./utils/currency.js";
import { formatCurrencyInput } from "./utils/formatter.js";
import {
  getElements,
  getVatMode,
  getCurrencyRadios,
  getVatModeRadios,
} from "./utils/dom.js";
import { calculateSalaryDeductions, calculateSalaryTax } from "./tax/salary.js";
import {
  calculateVAT,
  calculateWHT,
  calculatePropertyTax,
  calculateRentalIncomeTax,
  calculateTransportationTax,
} from "./tax/other.js";
import { updateLanguage } from "./i18n/language.js";
import { setTranslations } from "./i18n/translations.js";
import { calculateAccommodationTax } from "./tax/accommodationTax.js";
import { calculateImportDuty } from "./tax/importDuty.js";
import { calculatePatentTax } from "./tax/patent.js";
import { calculatePublicLightingTax } from "./tax/publicLightingTax.js";
import { calculateSpecificTax } from "./tax/specificTax.js";
import { calculateUnusedLandTax } from "./tax/unusedLand.js";
import { calculateVehicleTax } from "./tax/vehicleTax.js";


let currentLanguage = "en";
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
  const isVat = category === "vat";
  const isRental = category === "rental";
  const isTransportation = category === "transportation";

  const isPatent = category === "patent";
  const isVehicle = category === "vehicle";
  const isImport = category === "import";
  const isSpecific = category === "specific";

  elements.baseAmountGroup.style.display =
    (isSalary || isRental || isTransportation || isPatent || isVehicle) ? "none" : "block";
  elements.vatModeGroup.style.display = isVat ? "block" : "none";
  elements.salaryDeductionsSection.style.display = isSalary ? "block" : "none";
  elements.rentalIncomeGroup.style.display = isRental ? "block" : "none";
  elements.transportationExpenseGroup.style.display = isTransportation ? "block" : "none";

  const dutyRateGroup = document.getElementById("dutyRateGroup");
  if(dutyRateGroup) dutyRateGroup.style.display = isImport ? "block" : "none";
  
  const patentGroup = document.getElementById("patentGroup");
  if(patentGroup) patentGroup.style.display = isPatent ? "block" : "none";
  
  const specificRateGroup = document.getElementById("specificRateGroup");
  if(specificRateGroup) specificRateGroup.style.display = isSpecific ? "block" : "none";
  
  const vehicleGroup = document.getElementById("vehicleGroup");
  if(vehicleGroup) vehicleGroup.style.display = isVehicle ? "block" : "none";

  if (isSalary) {
    updateDeductionSummary();
  }
}

function updateDeductionSummary() {
  const deductions = getSalaryDeductions();

  document.getElementById("standardReliefValue").innerHTML =
    `${deductions.standardRelief.toLocaleString()} KHR`;
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
  const foreignerStatus = elements.foreignerStatus
    ? elements.foreignerStatus.value
    : "local";
  const spouseStatus = elements.spouseStatus.value;
  const childrenCount = parseInt(elements.childrenCount.value, 10) || 0;
  const otherDependents = parseInt(elements.otherDependents.value, 10) || 0;
  const isForeigner = foreignerStatus === "foreigner";
  return calculateSalaryDeductions({
    monthlySalary,
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

  if (category === "vat") {
    const vatMode = getVatMode();
    const result = calculateVAT(amount, vatMode);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown =
      currentLanguage === "en"
        ? `VAT calculated at 10% (${vatMode === "exclusive" ? "added to base" : "included in amount"})`
        : `អាករគណនា ១០% (${vatMode === "exclusive" ? "បន្ថែមលើតម្លៃ" : "រួមបញ្ចូលក្នុងចំនួន"})`;
  } else if (category === "salary") {
    const deductions = getSalaryDeductions();
    grossAmount = deductions.monthlySalary;
    taxableBase = deductions.taxableIncome;
    taxAmount = calculateSalaryTax(taxableBase, deductions.isForeigner);
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
        ? `Tax Calculation (Official: Prakas No. 575, Sept 2024): Standard Relief: ${deductions.standardRelief.toLocaleString()} KHR, Spouse Deduction: ${deductions.spouseDeduction.toLocaleString()} KHR, Children (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} KHR, Other Dependents (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} KHR, ${taxRateDesc}`
        : `ការគណនាពន្ធ (ផ្លូវការ: Prakas No. 575, កញ្ញា 2024): ការកាត់បន្ថយស្តង់ដារ: ${deductions.standardRelief.toLocaleString()} រៀល, ការកាត់បន្ថយស្វាមី/ភរិយា: ${deductions.spouseDeduction.toLocaleString()} រៀល, កូន (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} រៀល, អ្នកនៅក្នុងបន្ទុក (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} រៀល, ${taxRateDesc}`;
  } else if (category === "withholding") {
    const result = calculateWHT(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown =
      currentLanguage === "en"
        ? `Withholding Tax (WHT) 15% on service payments`
        : `ពន្ធទុកដាក់ ១៥% លើការបង់ថ្លៃសេវា`;
  } else if (category === "property") {
    const result = calculatePropertyTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown =
      currentLanguage === "en"
        ? `Property Tax: 0.1% on value exceeding 100,000,000 KHR`
        : `ពន្ធអចលនទ្រព្យ: ០.១% លើតម្លៃលើស 100,000,000 រៀល`;
  } else if (category === "rental") {
    amountRaw = parseFloat(elements.rentalIncome.value.replace(/,/g, "")) || 0;
    amount = convertToKhr(amountRaw, getSelectedCurrency("rentalCurrency"));
    const result = calculateRentalIncomeTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    grossAmount = amount;
    totalDeductions = result.deduction;
    breakdown =
      currentLanguage === "en"
        ? `Rental Income Tax (Official: Prakas No. 576, Sept 2024): Progressive tax on property income. Business deduction (20%): ${result.deduction.toLocaleString()} KHR. Taxable income subject to progressive brackets: 0%→5%→10%→15%→20%`
        : `ពន្ធលើប្រាក់ឈ្នួល (ផ្លូវការ: Prakas No. 576, កញ្ញា 2024): ពន្ធរីកចម្រើននៅលើប្រាក់ចំណូលលើទ្រព្យ។ ការកាត់បន្ថយប្រព័ន្ធពាណិជ្ជកម្ម (20%): ${result.deduction.toLocaleString()} រៀល។ ប្រាក់ចំណូលដែលត្រូវបង់ពន្ធក្ខណ្ឌល: ០%→៥%→១០%→១៥%→២០%`;
  
  } else if (category === "accommodation") {
    const result = calculateAccommodationTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en" ? "Accommodation Tax: 2% on accommodation services" : "ពន្ធស្នាក់នៅ: ២% លើសេវាកម្មស្នាក់នៅ";
  } else if (category === "import") {
    const dutyRateStr = document.getElementById("dutyRate").value;
    const dutyRate = (parseFloat(dutyRateStr) || 0) / 100;
    const result = calculateImportDuty({ importValue: amount, dutyRate, vatRate: 0.1 });
    taxAmount = result.totalTax; // sum of duty and VAT
    taxableBase = amount;
    total = result.grandTotal;
    breakdown = currentLanguage === "en" 
        ? `Import Duty (${(dutyRate*100).toFixed(0)}%): ${result.importDuty.toLocaleString()} KHR, VAT (10%): ${result.vat.toLocaleString()} KHR` 
        : `ពន្ធគយ (${(dutyRate*100).toFixed(0)}%): ${result.importDuty.toLocaleString()} រៀល, អាករលើតម្លៃបន្ថែម (១០%): ${result.vat.toLocaleString()} រៀល`;
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
    const specRateStr = document.getElementById("specificRate").value;
    const specRate = (parseFloat(specRateStr) || 0) / 100;
    const result = calculateSpecificTax(amount, specRate);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en" ? `Specific Tax: ${(specRate*100).toFixed(0)}% on specific goods` : `អាករពិសេស: ${(specRate*100).toFixed(0)}% លើទំនិញពិសេស`;
  } else if (category === "unusedLand") {
    const result = calculateUnusedLandTax(amount);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown = currentLanguage === "en" ? "Unused Land Tax: 2% on market value of unused land" : "ពន្ធដីធ្លីមិនបានប្រើប្រាស់: ២% លើតម្លៃទីផ្សារនៃដីមិនបានប្រើប្រាស់";
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

  document.getElementById("grossAmountValue").innerHTML =
    `${Math.round(grossAmount).toLocaleString()} KHR`;
  document.getElementById("totalDeductionsValue").innerHTML =
    `${totalDeductions.toLocaleString()} KHR`;
  document.getElementById("taxableIncomeValue").innerHTML =
    `${Math.round(taxableBase).toLocaleString()} KHR`;
  document.getElementById("taxAmountValue").innerHTML =
    `${taxAmount.toLocaleString()} KHR`;
  document.getElementById("netPayableValue").innerHTML =
    `${Math.round(total).toLocaleString()} KHR`;

  const breakdownElement = document.getElementById("taxBreakdown");
  breakdownElement.innerHTML = breakdown;
  breakdownElement.style.display = "block";
}

elements.taxCategory.addEventListener("change", () => {
  updateCategoryVisibility();
  calculate();
});

elements.monthlySalary.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  updateDeductionSummary();
  calculate();
});

elements.foreignerStatus.addEventListener("change", () => {
  updateDeductionSummary();
  calculate();
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

elements.transportationExpense.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});

elements.baseAmount.addEventListener("input", (e) => {
  formatCurrencyInput(e);
  calculate();
});
getVatModeRadios().forEach((radio) => {
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
document.getElementById("specificRate")?.addEventListener("input", calculate);
document.getElementById("vehicleType")?.addEventListener("change", calculate);

elements.calculateBtn.addEventListener("click", calculate);

document.getElementById("btnEn").addEventListener("click", () => {
  currentLanguage = "en";
  document
    .querySelectorAll(".lang-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnEn").classList.add("active");
  updateLanguage(currentLanguage, elements);
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
