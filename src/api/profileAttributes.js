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
    if (value !== undefined) normalized[target] = parseDetail(value);
  });

  const searchDetails = normalized.last_search_details || normalized.last_search_performed_details || {};
  const destinationDetails = normalized.last_viewed_destination_details || {};
  const offerDetails = normalized.last_viewed_offer_details || {};
  const abandonedBooking = normalized.abandoned_booking || {};
  const destination = normalized.last_purchased_item_destination
    || searchDetails.destination
    || destinationDetails.destination
    || offerDetails.destination
    || abandonedBooking.destination
    || fallback.next_trip_destination;
  const value = Number(normalized.total_lifetime_purchase_value ?? fallback.booking_value);

  return {
    source: raw.source || fallback.source || "meiro-profile-api",
    persona: raw.persona || fallback.persona || "anonymous",
    fields: {
      ...fallback,
      ...normalized,
      next_trip_destination: normalized.next_trip_destination || destination,
      last_interest_destination: destination,
      last_interest_trip_type: searchDetails.trip_type || searchDetails.tripType || offerDetails.trip_type || destinationDetails.trip_type || fallback.last_interest_trip_type,
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
