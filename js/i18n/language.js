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
  const lblIncomeTaxType = document.getElementById("lblIncomeTaxType");
  if (lblIncomeTaxType) lblIncomeTaxType.innerText = t.lblIncomeTaxType;
  const lblWhtSubcategory = document.getElementById("lblWhtSubcategory");
  if (lblWhtSubcategory) lblWhtSubcategory.innerText = t.lblWhtSubcategory;
  const lblWhtType = document.getElementById("lblWhtType");
  if (lblWhtType) lblWhtType.innerText = t.lblWhtType;
  document.getElementById("lblVatMode").innerText = t.lblVatMode;
  document.getElementById("optExclusive").innerText = t.optExclusive;
  document.getElementById("optInclusive").innerText = t.optInclusive;
  const lblVatType = document.getElementById("lblVatType");
  if (lblVatType) lblVatType.innerText = t.lblVatType;
  const optVatDomestic = document.getElementById("optVatDomestic");
  if (optVatDomestic) optVatDomestic.innerText = t.optVatDomestic;
  const optVatImport = document.getElementById("optVatImport");
  if (optVatImport) optVatImport.innerText = t.optVatImport;
  const optVatExport = document.getElementById("optVatExport");
  if (optVatExport) optVatExport.innerText = t.optVatExport;
  document.getElementById("deductionsTitle").innerText = t.deductionsTitle;
  document.getElementById("lblMonthlyIncome").innerText = t.lblMonthlyIncome;
  document.getElementById("lblFringeBenefit").innerText = t.lblFringeBenefit;
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
  // document.getElementById("lblStandardRelief").innerText = t.lblStandardRelief;
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
  document.getElementById("lblPropertyMode").innerText = t.lblPropertyMode;
  document.getElementById("optPropertyUsed").innerText = t.optPropertyUsed;
  document.getElementById("optPropertyUnused").innerText = t.optPropertyUnused;
  document.getElementById("lblPropertyValue").innerText = t.lblPropertyValue;
  document.getElementById("lblPropertySurface").innerText = t.lblPropertySurface;
  document.getElementById("propertySurfaceHint").innerText = t.propertySurfaceHint;
  document.getElementById("resultsTitle").innerText = t.resultsTitle;
  document.getElementById("resTaxAmount").innerText = t.resTaxAmount;

  const categorySelect = elements.taxCategory;
  categorySelect.options[0].text = t.vatLabel;
  categorySelect.options[1].text = t.salaryLabel;
  categorySelect.options[2].text = t.incomeTaxLabel;
  categorySelect.options[3].text = t.whtLabel;
  categorySelect.options[4].text = t.propertyLabel;
  categorySelect.options[5].text = t.rentalLabel;
  categorySelect.options[6].text = t.transportationLabel;

  // New tax labels in Select
  categorySelect.options[7].text = t.accommodationLabel;
  categorySelect.options[8].text = t.importLabel;
  categorySelect.options[9].text = t.patentLabel;
  categorySelect.options[10].text = t.publicLightingLabel;
  categorySelect.options[11].text = t.specificLabel;
  categorySelect.options[12].text = t.vehicleLabel;

  const incomeTaxType = elements.incomeTaxType;
  if (incomeTaxType) {
    incomeTaxType.options[0].text = t.optIncomeTaxGeneral;
    incomeTaxType.options[1].text = t.optIncomeTaxNaturalResources;
    incomeTaxType.options[2].text = t.optIncomeTaxQip;
    // incomeTaxType.options[3].text = t.optIncomeTaxLifeInsurance;
    incomeTaxType.options[3].text = t.optIncomeTaxGeneralInsurance;
    incomeTaxType.options[4].text = t.optIncomeTaxSoleProprietorship;
  }

  const whtSubcategory = elements.whtSubcategory;
  if (whtSubcategory) {
    whtSubcategory.options[0].text = t.whtResidentLabel;
    whtSubcategory.options[1].text = t.whtNonResidentLabel;
  }

  const optionIds = [
    "whtTypeService",
    "whtTypeRent",
    "whtTypeInterestResidentTerm",
    "whtTypeInterestResidentNoTerm",
    "whtTypePaymentNonResident",
  ];
  const optionLabels = [
    t.whtServiceLabel,
    t.whtRentLabel,
    t.whtInterestResidentTermLabel,
    t.whtInterestResidentNoTermLabel,
    t.whtPaymentNonResidentLabel,
  ];
  optionIds.forEach((id, index) => {
    const option = document.getElementById(id);
    if (option) option.text = optionLabels[index];
  });

  // New inputs
  const elDutyRate = document.getElementById("lblDutyRate");
  if(elDutyRate) elDutyRate.innerHTML = `<i class="fa-solid fa-percent"></i> ${t.lblDutyRate}`;
  
  const elPatentType = document.getElementById("lblPatentType");
  if(elPatentType) elPatentType.innerHTML = `<i class="fa-solid fa-building"></i> ${t.lblPatentType}`;
  
  const elSpecificRate = document.getElementById("lblSpecificRate");
  if(elSpecificRate) elSpecificRate.innerHTML = `<i class="fa-solid fa-percent"></i> ${t.lblSpecificRate}`;
  
  const elVehicleType = document.getElementById("lblVehicleType");
  if(elVehicleType) elVehicleType.innerHTML = `<i class="fa-solid fa-car"></i> ${t.lblVehicleType}`;

  // Select Options for Patent
  const patentType = document.getElementById("patentType");
  if(patentType) {
    patentType.options[0].text = t.optPatentSmall;
    patentType.options[1].text = t.optPatentMedium;
    patentType.options[2].text = t.optPatentLarge;
    patentType.options[3].text = t.optPatentLargeEnt;
  }

  // Select Options for Vehicle
  const vehicleType = document.getElementById("vehicleType");
  if(vehicleType) {
    vehicleType.options[0].text = t.optVehMotorbike;
    vehicleType.options[1].text = t.optVehCarSmall;
    vehicleType.options[2].text = t.optVehCarMedium;
    vehicleType.options[3].text = t.optVehCarLarge;
    vehicleType.options[4].text = t.optVehLuxury;
  }


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
