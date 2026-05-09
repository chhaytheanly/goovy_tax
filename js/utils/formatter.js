export function formatCurrencyInput(e) {
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
