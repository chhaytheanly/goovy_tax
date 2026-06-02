export function getElements() {
  return {
    baseAmountGroup: document.getElementById("baseAmountGroup"),
    baseAmount: document.getElementById("baseAmount"),
    taxCategory: document.getElementById("taxCategory"),
    vatModeGroup: document.getElementById("vatModeGroup"),
    vatTypeGroup: document.getElementById("vatTypeGroup"),
    salaryDeductionsSection: document.getElementById("salaryDeductionsSection"),
    monthlySalary: document.getElementById("monthlySalary"),
    foreignerStatus: document.getElementById("foreignerStatus"),
    spouseStatus: document.getElementById("spouseStatus"),
    childrenCount: document.getElementById("childrenCount"),
    otherDependents: document.getElementById("otherDependents"),
    rentalIncomeGroup: document.getElementById("rentalIncomeGroup"),
    rentalIncome: document.getElementById("rentalIncome"),
    transportationExpenseGroup: document.getElementById(
      "transportationExpenseGroup",
    ),
    transportationExpense: document.getElementById("transportationExpense"),
    calculateBtn: document.getElementById("calculateBtn"),
  };
}

export function getVatMode() {
  const selected = document.querySelector('input[name="vatMode"]:checked');
  return selected ? selected.value : "exclusive";
}

export function getVatType() {
  const selected = document.querySelector('input[name="vatType"]:checked');
  return selected ? selected.value : "domestic";
}

export function getCurrencyRadios() {
  return document.querySelectorAll(
    'input[name="baseCurrency"], input[name="salaryCurrency"], input[name="rentalCurrency"], input[name="transportCurrency"]',
  );
}

export function getVatModeRadios() {
  return document.querySelectorAll('input[name="vatMode"]');
}
