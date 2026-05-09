import { USD_TO_KHR_RATE } from "../config/constants.js";

export function convertToKhr(amount, currency) {
  if (currency === "usd") {
    return amount * USD_TO_KHR_RATE;
  }
  return amount;
}

export function getSelectedCurrency(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "khr";
}
