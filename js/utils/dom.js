export function getElements() {
  return {
    baseAmountGroup: document.getElementById("baseAmountGroup"),
    baseAmount: document.getElementById("baseAmount"),
    taxCategory: document.getElementById("taxCategory"),
    incomeTaxType: document.getElementById("incomeTaxType"),
    whtSubcategory: document.getElementById("whtSubcategory"),
    whtType: document.getElementById("whtType"),
    vatFormGroup: document.getElementById("vatFormGroup"),
    purchasingAmount: document.getElementById("purchasingAmount"),
    purchasingAmountGroup: document.getElementById("purchasingAmountGroup"),
    purchasingVatModeGroup: document.getElementById("purchasingVatModeGroup"),
    purchasingVatCaseGroup: document.getElementById("purchasingVatCaseGroup"),
    sellingAmount: document.getElementById("sellingAmount"),
    sellingAmountGroup: document.getElementById("sellingAmountGroup"),
    outputVatModeGroup: document.getElementById("outputVatModeGroup"),
    sellingVatCaseGroup: document.getElementById("sellingVatCaseGroup"),
    salaryDeductionsSection: document.getElementById("salaryDeductionsSection"),
    monthlySalary: document.getElementById("monthlySalary"),
    fringeBenefit: document.getElementById("fringeBenefit"),
    spouseStatus: document.getElementById("spouseStatus"),
    childrenCount: document.getElementById("childrenCount"),
    otherDependents: document.getElementById("otherDependents"),
    rentalPropertySection: document.getElementById("rentalPropertySection"),
    rentalIncome: document.getElementById("rentalIncome"),
    rentalSpouseStatus: document.getElementById("rentalSpouseStatus"),
    rentalChildrenCount: document.getElementById("rentalChildrenCount"),
    rentalOtherDependents: document.getElementById("rentalOtherDependents"),
    rentalVarietySpending: document.getElementById("rentalVarietySpending"),
    stampDutySection: document.getElementById("stampDutySection"),
    stampDutyType: document.getElementById("stampDutyType"),
    stampDutyValue: document.getElementById("stampDutyValue"),
    transportationExpenseGroup: document.getElementById(
      "transportationExpenseGroup",
    ),
    transportationExpense: document.getElementById("transportationExpense"),
    propertyModeGroup: document.getElementById("propertyModeGroup"),
    propertyValueGroup: document.getElementById("propertyValueGroup"),
    propertyValue: document.getElementById("propertyValue"),
    propertySurfaceGroup: document.getElementById("propertySurfaceGroup"),
    propertySurface: document.getElementById("propertySurface"),
    calculateBtn: document.getElementById("calculateBtn"),
  };
}

export function getPurchasingVatMode() {
  const selected = document.querySelector('input[name="purchasingVatMode"]:checked');
  return selected ? selected.value : "exclusive";
}

export function getPurchasingVatCase() {
  const selected = document.querySelector('input[name="purchasingVatCase"]:checked');
  return selected ? selected.value : "withVat";
}

export function getOutputVatMode() {
  const selected = document.querySelector('input[name="outputVatMode"]:checked');
  return selected ? selected.value : "exclusive";
}

export function getSellingVatCase() {
  const selected = document.querySelector('input[name="sellingVatCase"]:checked');
  return selected ? selected.value : "withVat";
}

export function getVatType() {
  const selected = document.querySelector('input[name="vatType"]:checked');
  return selected ? selected.value : "domestic";
}

export function getCurrencyRadios() {
  return document.querySelectorAll(
    'input[name="baseCurrency"], input[name="salaryCurrency"], input[name="fringeCurrency"], input[name="rentalCurrency"], input[name="rentalVarietyCurrency"], input[name="stampDutyCurrency"], input[name="transportCurrency"], input[name="propertyCurrency"], input[name="purchasingCurrency"], input[name="sellingCurrency"], input[name="specificCurrency"]',
  );
}
