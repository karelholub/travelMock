export function detailText(value, fallback = "pending") {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (typeof value !== "object") return String(value);

  const preferred = [
    value.booking_id,
    value.item_name,
    value.item_id,
    value.product_id,
    value.destination,
    value.route,
    value.trip_type,
    value.list_name
  ].filter(Boolean);

  if (preferred.length) return preferred.slice(0, 3).join(" · ");
  return JSON.stringify(value);
}

export function detailDestination(...details) {
  for (const detail of details) {
    if (!detail || typeof detail === "string") continue;
    const destination = detail.destination || detail.destinations?.[0];
    if (destination) return destination;
  }
  return "";
}
