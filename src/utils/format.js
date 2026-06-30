export function money(value, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function productTypeLabel(type) {
  return {
    flight: "Flight",
    hotel: "Hotel",
    package: "Package",
    transfer: "Transfer",
    experience: "Experience",
    add_on: "Add-on",
    insurance: "Insurance"
  }[type] || "Trip item";
}

export function compactDate(value) {
  if (!value) return "Flexible";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
