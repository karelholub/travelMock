import { personas } from "../data/personas.js";

export const meiroProfileAttributes = [
  "Last Purchased Item Destination",
  "User's Email (from Purchase or Shipping)",
  "User's First Name (from Shipping)",
  "Last Viewed Item List Name",
  "Total Lifetime Purchase Value"
];

const aliases = {
  last_purchased_item_destination: ["last_purchased_item_destination", "lastPurchasedItemDestination", "Last Purchased Item Destination"],
  email: ["email", "user_email", "userEmail", "User's Email (from Purchase or Shipping)"],
  first_name: ["first_name", "firstName", "user_first_name", "User's First Name (from Shipping)"],
  last_viewed_item_list_name: ["last_viewed_item_list_name", "lastViewedItemListName", "Last Viewed Item List Name"],
  total_lifetime_purchase_value: ["total_lifetime_purchase_value", "totalLifetimePurchaseValue", "Total Lifetime Purchase Value"]
};

export function slugFieldName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readPath(source, path) {
  return path.split(".").reduce((current, key) => current?.[key], source);
}

function readAny(source, keys) {
  for (const key of keys) {
    if (Object.hasOwn(source, key) && source[key] !== undefined && source[key] !== null) return source[key];
    const nested = readPath(source, key);
    if (nested !== undefined && nested !== null) return nested;
  }
  return undefined;
}

function flattenAttributes(raw) {
  const source = raw?.fields || raw?.attributes || raw?.profile || raw?.customer || raw?.data || raw || {};
  const fields = {};

  if (Array.isArray(source)) {
    source.forEach((item) => {
      const name = item.name || item.key || item.id || item.attribute;
      if (!name) return;
      fields[slugFieldName(name)] = item.value ?? item.values ?? item.latest_value;
      fields[name] = item.value ?? item.values ?? item.latest_value;
    });
    return fields;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && ("value" in value || "latest_value" in value)) {
      fields[key] = value.value ?? value.latest_value;
      fields[slugFieldName(key)] = value.value ?? value.latest_value;
      return;
    }
    fields[key] = value;
    fields[slugFieldName(key)] = value;
  });

  return fields;
}

export function normalizeProfileResponse(raw = {}, fallback = {}) {
  const flattened = flattenAttributes(raw);
  const normalized = { ...flattened };

  Object.entries(aliases).forEach(([target, keys]) => {
    const value = readAny(flattened, keys.map((key) => [key, slugFieldName(key)]).flat());
    if (value !== undefined) normalized[target] = value;
  });

  const destination = normalized.last_purchased_item_destination || fallback.next_trip_destination;
  const value = Number(normalized.total_lifetime_purchase_value ?? fallback.booking_value);

  return {
    source: raw.source || fallback.source || "meiro-profile-api",
    persona: raw.persona || fallback.persona || "anonymous",
    fields: {
      ...fallback,
      ...normalized,
      next_trip_destination: normalized.next_trip_destination || destination,
      booking_value: Number.isFinite(value) ? value : fallback.booking_value
    },
    raw
  };
}

export function localProfile(personaId = "anonymous", identity = {}) {
  const persona = personas[personaId] || personas.anonymous;
  const bookingValue = persona.id === "vip" ? 4820 : persona.id === "family" ? 2450 : persona.id === "business" ? 1300 : 1640;
  const addOns = persona.id === "business"
    ? ["addon-lounge-nap", "transfer-emotional-support"]
    : ["transfer-emotional-support", "addon-baggage-metaphorical", "exp-sunset-networking"];

  return {
    source: "local-static-fallback",
    persona: persona.id,
    fields: {
      last_purchased_item_destination: persona.preferredDestination,
      email: identity.email || "",
      first_name: identity.firstName || identity.first_name || "Alex",
      last_viewed_item_list_name: "homepage_recommended",
      total_lifetime_purchase_value: bookingValue,
      next_trip_destination: persona.preferredDestination,
      next_departure_date: persona.id === "business" ? "2026-10-03" : persona.id === "vip" ? "2026-11-02" : persona.id === "family" ? "2026-08-08" : "2026-09-12",
      booking_value: bookingValue,
      loyalty_tier: persona.loyaltyTier,
      recommended_add_on_ids: addOns
    }
  };
}
