import { USD_TO_KHR_RATE } from "../config/constants.js";
import { getTranslations } from "./translations.js";

export function updateLanguage(currentLanguage, elements) {
  const t = getTranslations()[currentLanguage];
  if (!t) return;

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
  document.getElementById("lblForeignerStatus").innerText =
    t.lblForeignerStatus;
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
  document.getElementById("lblTransportationExpense").innerText =
    t.lblTransportationExpense;
  document.getElementById("transportationHint").innerText =
    t.transportationHint;
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
    el.innerText = t.currencyHint.replace(
      "{rate}",
      USD_TO_KHR_RATE.toLocaleString(),
    );
  });
}
