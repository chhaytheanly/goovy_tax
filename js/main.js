let translations = {};

async function loadTranslations() {
  try {
    const result = await fetch("data/field.json");
    if (!result.ok) {
      throw new Error("Failed to load translations");
    }
    translations = await result.json();
    updateCategoryVisibility();
    updateLanguage();
  } catch (error) {
    console.error("Error loading translations:", error);
  }
}

let currentLanguage = "en";

// Constants 
const STANDARD_RELIEF = 1500000;
const DEPENDENT_DEDUCTION = 150000;
const VAT_RATE = 0.1;
const WHT_RATE = 0.15;
const PROPERTY_THRESHOLD = 100000000;
const PROPERTY_RATE = 0.001;
const TRANSPORTATION_TAX_RATE = 0.05; 
const RENTAL_BUSINESS_DEDUCTION_RATE = 0.20; 
const USD_TO_KHR_RATE = 4100;
const elements = {
  baseAmountGroup: document.getElementById("baseAmountGroup"),
  baseAmount: document.getElementById("baseAmount"),
  taxCategory: document.getElementById("taxCategory"),
  vatModeGroup: document.getElementById("vatModeGroup"),
  salaryDeductionsSection: document.getElementById("salaryDeductionsSection"),
  monthlySalary: document.getElementById("monthlySalary"),
  foreignerStatus: document.getElementById("foreignerStatus"),
  spouseStatus: document.getElementById("spouseStatus"),
  childrenCount: document.getElementById("childrenCount"),
  otherDependents: document.getElementById("otherDependents"),
  rentalIncomeGroup: document.getElementById("rentalIncomeGroup"),
  rentalIncome: document.getElementById("rentalIncome"),
  transportationExpenseGroup: document.getElementById("transportationExpenseGroup"),
  transportationExpense: document.getElementById("transportationExpense"),
  calculateBtn: document.getElementById("calculateBtn"),
};

function updateCategoryVisibility() {
  const category = elements.taxCategory.value;
  const isSalary = category === "salary";
  const isVat = category === "vat";
  const isRental = category === "rental";
  const isTransportation = category === "transportation";

  elements.baseAmountGroup.style.display = isSalary || isRental || isTransportation ? "none" : "block";
  elements.vatModeGroup.style.display = isVat ? "block" : "none";
  elements.salaryDeductionsSection.style.display = isSalary ? "block" : "none";
  elements.rentalIncomeGroup.style.display = isRental ? "block" : "none";
  elements.transportationExpenseGroup.style.display = isTransportation ? "block" : "none";

  if (isSalary) {
    updateDeductionSummary();
  }
}

function convertToKhr(amount, currency) {
  if (currency === "usd") {
    return amount * USD_TO_KHR_RATE;
  }
  return amount;
}

function getSelectedCurrency(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "khr";
}

function calculateSalaryDeductions() {
  const monthlySalaryRaw =
    parseFloat(elements.monthlySalary.value.replace(/,/g, "")) || 0;
  const monthlySalary = convertToKhr(
    monthlySalaryRaw,
    getSelectedCurrency("salaryCurrency"),
  );
  const foreignerStatus = elements.foreignerStatus ? elements.foreignerStatus.value : "local";
  const spouseStatus = elements.spouseStatus.value;
  const childrenCount = parseInt(elements.childrenCount.value) || 0;
  const otherDependents = parseInt(elements.otherDependents.value) || 0;

  // Both residents and foreigners get the same deductions per official tax law
  let standardRelief = STANDARD_RELIEF;
  let spouseDeduction = spouseStatus === "housewife" ? DEPENDENT_DEDUCTION : 0;
  let childrenDeduction = childrenCount * DEPENDENT_DEDUCTION;
  let otherDeduction = otherDependents * DEPENDENT_DEDUCTION;
  let totalDeductions = standardRelief + spouseDeduction + childrenDeduction + otherDeduction;

  return {
    monthlySalary,
    spouseDeduction,
    childrenDeduction,
    otherDeduction,
    standardRelief,
    totalDeductions,
    isForeigner: foreignerStatus === "foreigner",
    taxableIncome: Math.max(0, monthlySalary - totalDeductions),
  };
}

function updateDeductionSummary() {
  const deductions = calculateSalaryDeductions();

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

function calculateSalaryTax(taxableIncome, isForeigner = false) {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let remaining = taxableIncome;

  if (remaining > 1500000) {
    let tier1 = Math.min(remaining, 2000000) - 1500000;
    if (tier1 > 0) tax += tier1 * 0.05;
  }
  if (remaining > 2000000) {
    let tier2 = Math.min(remaining, 8500000) - 2000000;
    if (tier2 > 0) tax += tier2 * 0.1;
  }
  if (remaining > 8500000) {
    let tier3 = Math.min(remaining, 12500000) - 8500000;
    if (tier3 > 0) tax += tier3 * 0.15;
  }
  if (remaining > 12500000) {
    let tier4 = remaining - 12500000;
    tax += tier4 * 0.2;
  }

  return Math.round(tax);
}

function calculateVAT(amount, mode) {
  if (mode === "exclusive") {
    const vat = amount * VAT_RATE;
    return {
      taxAmount: Math.round(vat),
      taxableBase: amount,
      total: amount + vat,
    };
  } else {
    const vat = amount * (VAT_RATE / (1 + VAT_RATE));
    const taxableBase = amount - vat;
    return {
      taxAmount: Math.round(vat),
      taxableBase: Math.round(taxableBase),
      total: amount,
    };
  }
}

function calculateWHT(amount) {
  const tax = amount * WHT_RATE;
  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: amount - tax,
  };
}

function calculatePropertyTax(value) {
  if (value <= PROPERTY_THRESHOLD) {
    return { taxAmount: 0, taxableBase: 0, total: value };
  }
  const excess = value - PROPERTY_THRESHOLD;
  const tax = excess * PROPERTY_RATE;
  return {
    taxAmount: Math.round(tax),
    taxableBase: excess,
    total: value - tax,
  };
}

function calculateRentalIncomeTax(amount) {
  const operatingExpenseDeduction = amount * RENTAL_BUSINESS_DEDUCTION_RATE;
  const taxableRentalIncome = Math.max(0, amount - operatingExpenseDeduction);

  let tax = 0;
  let remaining = taxableRentalIncome;

  if (remaining > 1500000) {
    let tier1 = Math.min(remaining, 2000000) - 1500000;
    if (tier1 > 0) tax += tier1 * 0.05;
  }
  if (remaining > 2000000) {
    let tier2 = Math.min(remaining, 8500000) - 2000000;
    if (tier2 > 0) tax += tier2 * 0.1;
  }
  if (remaining > 8500000) {
    let tier3 = Math.min(remaining, 12500000) - 8500000;
    if (tier3 > 0) tax += tier3 * 0.15;
  }
  if (remaining > 12500000) {
    let tier4 = remaining - 12500000;
    tax += tier4 * 0.2;
  }

  return {
    taxAmount: Math.round(tax),
    taxableBase: Math.round(taxableRentalIncome),
    total: Math.round(amount - tax),
    deduction: Math.round(operatingExpenseDeduction),
  };
}

function calculateTransportationTax(amount) {
  const tax = amount * TRANSPORTATION_TAX_RATE;
  return {
    taxAmount: Math.round(tax),
    taxableBase: amount,
    total: amount - tax,
  };
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
    const vatMode = document.querySelector(
      'input[name="vatMode"]:checked',
    ).value;
    const result = calculateVAT(amount, vatMode);
    taxAmount = result.taxAmount;
    taxableBase = result.taxableBase;
    total = result.total;
    breakdown =
      currentLanguage === "en"
        ? `VAT calculated at 10% (${vatMode === "exclusive" ? "added to base" : "included in amount"})`
        : `អាករគណនា ១០% (${vatMode === "exclusive" ? "បន្ថែមលើតម្លៃ" : "រួមបញ្ចូលក្នុងចំនួន"})`;
  } else if (category === "salary") {
    const deductions = calculateSalaryDeductions();
    grossAmount = deductions.monthlySalary;
    taxableBase = deductions.taxableIncome;
    taxAmount = calculateSalaryTax(taxableBase, deductions.isForeigner);
    total = grossAmount - taxAmount;
    totalDeductions = deductions.totalDeductions;

    const taxRateDesc = currentLanguage === "en" 
      ? "Progressive rates (applies to all): 0%→5%→10%→15%→20%" 
      : "អត្រារីកចម្រើន (អនុវត្តទៅគ្រប់គ្នា): ០%→៥%→១០%→១៥%→២០%";
    
    const foreignerNote = deductions.isForeigner 
      ? (currentLanguage === "en" ? " (Foreign employee - same deductions as residents)" : " (បុគ្គលបរទេស - ការកាត់បន្ថយដូចគ្នាដូចប្រជាជនលក្ខណ៍ប្រទេស)")
      : "";

    breakdown =
      currentLanguage === "en"
        ? `Tax Calculation (Official: Prakas No. 575, Sept 2024): Standard Relief: ${deductions.standardRelief.toLocaleString()} KHR, Spouse Deduction: ${deductions.spouseDeduction.toLocaleString()} KHR, Children (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} KHR, Other Dependents (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} KHR${foreignerNote}, ${taxRateDesc}`
        : `ការគណនាពន្ធ (ផ្លូវការ: Prakas No. 575, កញ្ញា 2024): ការកាត់បន្ថយស្តង់ដារ: ${deductions.standardRelief.toLocaleString()} រៀល, ការកាត់បន្ថយស្វាមី/ភរិយា: ${deductions.spouseDeduction.toLocaleString()} រៀល, កូន (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} រៀល, អ្នកនៅក្នុងបន្ទុក (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} រៀល${foreignerNote}, ${taxRateDesc}`;
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
        ? `Property Tax: 0.1% on value exceeding ${PROPERTY_THRESHOLD.toLocaleString()} KHR`
        : `ពន្ធអចលនទ្រព្យ: ០.១% លើតម្លៃលើស ${PROPERTY_THRESHOLD.toLocaleString()} រៀល`;
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
  } else if (category === "transportation") {
    amountRaw = parseFloat(elements.transportationExpense.value.replace(/,/g, "")) || 0;
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

function updateLanguage() {
  const t = translations[currentLanguage];

  const mainTitle = document.getElementById("mainTitle");
  mainTitle.innerHTML = ` ${t.mainTitle}`;

  if (currentLanguage === "en") {
    mainTitle.classList.remove("kh-title");
    mainTitle.classList.add("en-title");
  } else {
    mainTitle.classList.remove("en-title");
    mainTitle.classList.add("kh-title");
  }

  document.getElementById("subTitle").innerText = t.subTitle;
  document.getElementById("lblAmount").innerText = t.lblAmount;
  document.getElementById("lblCategory").innerText = t.lblCategory;
  document.getElementById("lblVatMode").innerText = t.lblVatMode;
  document.getElementById("optExclusive").innerText = t.optExclusive;
  document.getElementById("optInclusive").innerText = t.optInclusive;
  document.getElementById("deductionsTitle").innerText = t.deductionsTitle;
  document.getElementById("lblMonthlyIncome").innerText = t.lblMonthlyIncome;
  document.getElementById("lblForeignerStatus").innerText = t.lblForeignerStatus;
  document.getElementById("optLocalResident").innerText = t.optLocalResident;
  document.getElementById("optForeigner").innerText = t.optForeigner;
  document.getElementById("lblSpouseStatus").innerText = t.lblSpouseStatus;
  document.getElementById("optNoSpouse").innerText = t.optNoSpouse;
  document.getElementById("optHousewife").innerText = t.optHousewife;
  document.getElementById("lblChildren").innerText = t.lblChildren;
  document.getElementById("childrenHint").innerText = t.childrenHint;
  document.getElementById("lblOtherDependents").innerText =
    t.lblOtherDependents;
  document.getElementById("otherHint").innerText = t.otherHint;
  document.getElementById("lblStandardRelief").innerText = t.lblStandardRelief;
  document.getElementById("lblSpouseDeduction").innerText =
    t.lblSpouseDeduction;
  document.getElementById("lblChildrenDeduction").innerText =
    t.lblChildrenDeduction;
  document.getElementById("lblOtherDeduction").innerText = t.lblOtherDeduction;
  document.getElementById("lblTotalDeduction").innerText = t.lblTotalDeduction;
  document.getElementById("lblRentalIncome").innerText = t.lblRentalIncome;
  document.getElementById("rentalHint").innerText = t.rentalHint;
  document.getElementById("lblTransportationExpense").innerText = t.lblTransportationExpense;
  document.getElementById("transportationHint").innerText = t.transportationHint;
  document.getElementById("resultsTitle").innerText = t.resultsTitle;
  document.getElementById("resGrossAmount").innerText = t.resGrossAmount;
  document.getElementById("resTotalDeductions").innerText =
    t.resTotalDeductions;
  document.getElementById("resTaxableIncome").innerText = t.resTaxableIncome;
  document.getElementById("resTaxAmount").innerText = t.resTaxAmount;
  document.getElementById("resNetPayable").innerText = t.resNetPayable;

  const categorySelect = elements.taxCategory;
  categorySelect.options[0].text = t.vatLabel;
  categorySelect.options[1].text = t.salaryLabel;
  categorySelect.options[2].text = t.whtLabel;
  categorySelect.options[3].text = t.propertyLabel;
  categorySelect.options[4].text = t.rentalLabel;
  categorySelect.options[5].text = t.transportationLabel;

  document.querySelectorAll(".currency-label").forEach((el) => {
    el.innerText = t.lblCurrency;
  });
  document.querySelectorAll(".currency-khr").forEach((el) => {
    el.innerText = t.optCurrencyKHR;
  });
  document.querySelectorAll(".currency-usd").forEach((el) => {
    el.innerText = t.optCurrencyUSD;
  });
  document.querySelectorAll(".currency-hint").forEach((el) => {
    el.innerText = t.currencyHint.replace("{rate}", USD_TO_KHR_RATE.toLocaleString());
  });

  updateDeductionSummary();
  calculate();
}

elements.taxCategory.addEventListener("change", () => {
  updateCategoryVisibility();
  calculate();
});

function formatCurrencyInput(e) {
  let val = e.target.value.replace(/,/g, "");
  if (!isNaN(val) && val.length > 0) {
    let parts = val.split(".");
    parts[0] = parseInt(parts[0] || 0, 10)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    e.target.value = parts.join(".");
  } else if (val === "") {
    e.target.value = "";
  }
}

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
document.querySelectorAll('input[name="vatMode"]').forEach((radio) => {
  radio.addEventListener("change", calculate);
});

document.querySelectorAll('input[name="baseCurrency"], input[name="salaryCurrency"], input[name="rentalCurrency"], input[name="transportCurrency"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    updateDeductionSummary();
    calculate();
  });
});

elements.calculateBtn.addEventListener("click", calculate);

document.getElementById("btnEn").addEventListener("click", () => {
  currentLanguage = "en";
  document
    .querySelectorAll(".lang-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnEn").classList.add("active");
  updateLanguage();
});

document.getElementById("btnKh").addEventListener("click", () => {
  currentLanguage = "kh";
  document
    .querySelectorAll(".lang-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btnKh").classList.add("active");
  updateLanguage();
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
