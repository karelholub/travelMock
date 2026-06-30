export function detailText(value, fallback = "pending") {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) {
    const items = value.map((item) => detailText(item, "")).filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }
  if (typeof value !== "object") return String(value);

  const preferred = [
    value.booking_id,
    value.bookingId,
    value.item_name,
    value.itemName,
    value.item_id,
    value.itemId,
    value.product_id,
    value.productId,
    value.destination,
    value.name,
    value.title,
    value.route,
    value.trip_type,
    value.tripType,
    value.list_name,
    value.listName
  ].filter(Boolean);

  if (preferred.length) return preferred.slice(0, 3).join(" · ");
  return JSON.stringify(value);
}

export function detailDestination(...details) {
  for (const detail of details) {
    if (!detail) continue;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const destination = detailDestination(...detail);
      if (destination) return destination;
      continue;
    }
    const destination = detail.destination || detail.destinations?.[0] || detail.name || detail.title;
    if (destination) return destination;
  }
  return "";
}

export function detailListName(value, fallback = "homepage_recommended") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.list_name || value.listName || value.name || value.title || detailText(value, fallback);
}

export function detailNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : fallback;
  }
  if (Array.isArray(value)) return detailNumber(value[0], fallback);
  if (typeof value === "object") {
    for (const key of ["value", "amount", "total", "booking_value", "bookingValue", "total_value", "totalValue"]) {
      if (value[key] !== undefined) return detailNumber(value[key], fallback);
    }
  }
  return fallback;
}

export function maskIdentifier(value, fallback = "No identifier yet") {
  if (!value) return fallback;
  const text = String(value);
  if (text.includes("@")) {
    const [name, domain] = text.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (text.length <= 10) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
}

export function profileApiStatus(profile) {
  const source = profile?.source || "pending";
  const meta = profile?.meta || {};
  const status = meta.profileApiStatus || profile?.raw?.profileApiStatus || profile?.raw?.raw?.profileApiStatus || "";
  const error = meta.profileApiError || profile?.raw?.profileApiError || profile?.raw?.raw?.profileApiError || "";
  if (error) return { label: "Fallback after API error", tone: "warning", detail: error };
  if (status) return { label: "Fallback after API status", tone: "warning", detail: String(status) };
  if (source.includes("local") || meta.mode === "fallback") return { label: "Local fallback", tone: "neutral", detail: "" };
  if (source.includes("meiro") || meta.mode === "profile-api") return { label: "Live Profile API", tone: "success", detail: "" };
  return { label: "Profile pending", tone: "neutral", detail: "" };
}
