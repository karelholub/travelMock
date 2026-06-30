import { personas } from "../data/personas.js";

export const meiroProfileAttributes = [
  "Abandoned Booking",
  "Last Viewed Item",
  "Last Search Details",
  "Last Booking Started Details",
  "Last Wishlist Item Added",
  "Last Viewed Offer Details",
  "Last Viewed Destination Details",
  "Last Search Performed Details",
  "Last Purchased Item Destination",
  "User's Email (from Purchase or Shipping)",
  "User's First Name (from Shipping)",
  "User's Last Name (from Shipping)",
  "Last Viewed Item List Name",
  "Total Lifetime Purchase Value"
];

const aliases = {
  abandoned_booking: ["abandoned_booking", "abandonedBooking", "Abandoned Booking"],
  last_viewed_item: ["last_viewed_item", "lastViewedItem", "Last Viewed Item"],
  last_search_details: ["last_search_details", "lastSearchDetails", "Last Search Details"],
  last_booking_started_details: ["last_booking_started_details", "lastBookingStartedDetails", "Last Booking Started Details"],
  last_wishlist_item_added: ["last_wishlist_item_added", "lastWishlistItemAdded", "Last Wishlist Item Added"],
  last_viewed_offer_details: ["last_viewed_offer_details", "lastViewedOfferDetails", "Last Viewed Offer Details"],
  last_viewed_destination_details: ["last_viewed_destination_details", "lastViewedDestinationDetails", "Last Viewed Destination Details"],
  last_search_performed_details: ["last_search_performed_details", "lastSearchPerformedDetails", "Last Search Performed Details"],
  last_purchased_item_destination: ["last_purchased_item_destination", "lastPurchasedItemDestination", "Last Purchased Item Destination"],
  email: ["email", "user_email", "userEmail", "User's Email (from Purchase or Shipping)"],
  first_name: ["first_name", "firstName", "user_first_name", "User's First Name (from Shipping)"],
  last_name: ["last_name", "lastName", "surname", "user_last_name", "userLastName", "User's Last Name (from Shipping)", "User's Surname (from Shipping)"],
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

function parseDetail(value) {
  if (!value) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function unwrapAttributeValue(value) {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) {
    const unwrapped = value.map((item) => unwrapAttributeValue(item)).filter((item) => item !== undefined && item !== null && item !== "");
    return unwrapped.length === 1 ? unwrapped[0] : unwrapped;
  }
  if (typeof value !== "object") return parseDetail(value);

  for (const key of ["value", "latest_value", "latestValue", "values", "data"]) {
    if (Object.hasOwn(value, key)) return unwrapAttributeValue(value[key]);
  }

  if (Object.hasOwn(value, "name") && Object.hasOwn(value, "id") && Object.keys(value).length <= 3) {
    return value.name || value.id;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, unwrapAttributeValue(item)])
  );
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
      const value = unwrapAttributeValue(item.value ?? item.values ?? item.latest_value ?? item);
      fields[slugFieldName(name)] = value;
      fields[name] = value;
    });
    return fields;
  }

  Object.entries(source).forEach(([key, value]) => {
    const unwrapped = unwrapAttributeValue(value);
    fields[key] = unwrapped;
    fields[slugFieldName(key)] = unwrapped;
  });

  return fields;
}

export function normalizeProfileResponse(raw = {}, fallback = {}) {
  const flattened = flattenAttributes(raw);
  const normalized = { ...flattened };

  Object.entries(aliases).forEach(([target, keys]) => {
    const value = readAny(flattened, keys.map((key) => [key, slugFieldName(key)]).flat());
    if (value !== undefined) normalized[target] = unwrapAttributeValue(value);
  });

  const searchDetails = normalized.last_search_details || normalized.last_search_performed_details || {};
  const destinationDetails = normalized.last_viewed_destination_details || {};
  const offerDetails = normalized.last_viewed_offer_details || {};
  const abandonedBooking = normalized.abandoned_booking || {};
  const destination = detailDestinationValue(normalized.last_purchased_item_destination)
    || searchDetails.destination
    || destinationDetails.destination
    || offerDetails.destination
    || abandonedBooking.destination
    || fallback.next_trip_destination;
  const value = detailNumberValue(normalized.total_lifetime_purchase_value ?? fallback.booking_value);

  const source = raw.source || fallback.source || "meiro-profile-api";
  const profileApiStatus = raw.profileApiStatus || raw.raw?.profileApiStatus || "";
  const profileApiError = raw.profileApiError || raw.raw?.profileApiError || "";
  const mode = source.includes("fallback") || source.includes("local") ? "fallback" : "profile-api";

  return {
    source,
    persona: raw.persona || fallback.persona || "anonymous",
    meta: {
      mode,
      profileApiStatus,
      profileApiError,
      normalizedAt: new Date().toISOString()
    },
    fields: {
      ...fallback,
      ...normalized,
      last_purchased_item_destination: detailDestinationValue(normalized.last_purchased_item_destination) || destination,
      first_name: detailNameValue(normalized.first_name) || fallback.first_name,
      last_name: detailNameValue(normalized.last_name) || detailNameValue(normalized.surname) || fallback.last_name || fallback.surname,
      surname: detailNameValue(normalized.last_name) || detailNameValue(normalized.surname) || fallback.surname || fallback.last_name,
      last_viewed_item_list_name: detailListValue(normalized.last_viewed_item_list_name) || fallback.last_viewed_item_list_name,
      total_lifetime_purchase_value: Number.isFinite(value) ? value : fallback.total_lifetime_purchase_value,
      next_trip_destination: detailDestinationValue(normalized.next_trip_destination) || destination,
      last_interest_destination: destination,
      last_interest_trip_type: searchDetails.trip_type || searchDetails.tripType || offerDetails.trip_type || destinationDetails.trip_type || fallback.last_interest_trip_type,
      booking_value: Number.isFinite(value) ? value : fallback.booking_value
    },
    raw
  };
}

function detailDestinationValue(value) {
  const unwrapped = unwrapAttributeValue(value);
  if (!unwrapped) return "";
  if (typeof unwrapped === "string") return unwrapped;
  if (Array.isArray(unwrapped)) {
    for (const item of unwrapped) {
      const destination = detailDestinationValue(item);
      if (destination) return destination;
    }
    return "";
  }
  return unwrapped.destination || unwrapped.destinations?.[0] || unwrapped.name || unwrapped.title || unwrapped.id || "";
}

function detailListValue(value) {
  const unwrapped = unwrapAttributeValue(value);
  if (!unwrapped) return "";
  if (typeof unwrapped === "string") return unwrapped;
  return unwrapped.list_name || unwrapped.listName || unwrapped.name || unwrapped.title || "";
}

function detailNameValue(value) {
  const unwrapped = unwrapAttributeValue(value);
  if (!unwrapped) return "";
  if (typeof unwrapped === "string") return unwrapped;
  if (Array.isArray(unwrapped)) return detailNameValue(unwrapped[0]);
  if (typeof unwrapped === "object") return unwrapped.name || unwrapped.value || unwrapped.text || unwrapped.title || "";
  return String(unwrapped);
}

function detailNumberValue(value) {
  const unwrapped = unwrapAttributeValue(value);
  if (unwrapped === undefined || unwrapped === null || unwrapped === "") return NaN;
  if (typeof unwrapped === "number") return unwrapped;
  if (typeof unwrapped === "string") return Number(unwrapped.replace(/[^\d.-]/g, ""));
  if (Array.isArray(unwrapped)) return detailNumberValue(unwrapped[0]);
  if (typeof unwrapped === "object") {
    for (const key of ["value", "amount", "total", "booking_value", "bookingValue", "total_value", "totalValue"]) {
      if (unwrapped[key] !== undefined) return detailNumberValue(unwrapped[key]);
    }
  }
  return NaN;
}

export function localProfile(personaId = "anonymous", identity = {}) {
  const persona = personas[personaId] || personas.anonymous;
  const bookingValue = persona.id === "vip" ? 4820 : persona.id === "family" ? 2450 : persona.id === "business" ? 1300 : 1640;
  const addOns = persona.id === "business"
    ? ["addon-lounge-nap", "transfer-emotional-support"]
    : ["transfer-emotional-support", "addon-baggage-metaphorical", "exp-sunset-networking"];
  const primaryByPersona = {
    anonymous: "flight-lisbon-enlightenment",
    abandoner: "hotel-lisbon-optimistic-view",
    vip: "package-kyoto-pretend-understand",
    family: "package-mallorca-family-patience",
    business: "flight-zurich-breakfast-meeting"
  };
  const primaryId = primaryByPersona[persona.id] || primaryByPersona.anonymous;

  return {
    source: "local-static-fallback",
    persona: persona.id,
    fields: {
      last_purchased_item_destination: persona.preferredDestination,
      email: identity.email || "",
      first_name: identity.firstName || identity.first_name || "Alex",
      last_name: identity.lastName || identity.last_name || identity.surname || "Somewhere",
      surname: identity.surname || identity.lastName || identity.last_name || "Somewhere",
      last_viewed_item_list_name: "homepage_recommended",
      total_lifetime_purchase_value: bookingValue,
      abandoned_booking: {
        booking_id: `AB-${persona.id.toUpperCase()}-042`,
        destination: persona.preferredDestination,
        trip_type: persona.preferredTripType,
        product_ids: persona.cartRestoreIds,
        booking_value: bookingValue
      },
      last_viewed_item: primaryId,
      last_wishlist_item_added: addOns[0],
      last_viewed_offer_details: {
        item_id: primaryId,
        destination: persona.preferredDestination,
        trip_type: persona.preferredTripType,
        list_name: "homepage_recommended"
      },
      last_viewed_destination_details: {
        destination: persona.preferredDestination,
        region: persona.preferredDestination === "Zurich" ? "Alps" : persona.preferredDestination === "Kyoto" ? "Japan" : "Mediterranean"
      },
      last_search_details: {
        origin: "Prague",
        destination: persona.preferredDestination,
        trip_type: persona.preferredTripType,
        adult_count: persona.id === "business" ? 1 : 2,
        child_count: persona.id === "family" ? 2 : 0
      },
      last_search_performed_details: {
        origin: "Prague",
        destination: persona.preferredDestination,
        trip_type: persona.preferredTripType
      },
      last_booking_started_details: {
        booking_id: `BS-${persona.id.toUpperCase()}-101`,
        destination: persona.preferredDestination,
        product_ids: persona.cartRestoreIds.slice(0, 2),
        booking_value: bookingValue
      },
      next_trip_destination: persona.preferredDestination,
      last_interest_destination: persona.preferredDestination,
      last_interest_trip_type: persona.preferredTripType,
      next_departure_date: persona.id === "business" ? "2026-10-03" : persona.id === "vip" ? "2026-11-02" : persona.id === "family" ? "2026-08-08" : "2026-09-12",
      booking_value: bookingValue,
      loyalty_tier: persona.loyaltyTier,
      recommended_add_on_ids: addOns
    }
  };
}
