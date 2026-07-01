import { personas } from "../data/personas.js";

export const meiroProfileAttributes = [
  "preferred_origin_airport",
  "lifetime_booking_count",
  "vip_status",
  "loyalty_tier",
  "watched_price_destination",
  "deal_affinity",
  "price_sensitivity",
  "active_itinerary_items",
  "abandoned_cart_items",
  "booking_lifecycle_stage",
  "traveler_composition",
  "preferred_product_categories",
  "preferred_trip_types",
  "destination_affinities",
  "top_destination",
  "Last name",
  "has_active_booking",
  "searches_last_7d",
  "Profile activity",
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
  "First name",
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
  first_name: ["first_name", "firstName", "first", "user_first_name", "user_s_first_name_from_shipping", "First name", "First Name", "User's First Name (from Shipping)"],
  last_name: ["last_name", "lastName", "last", "surname", "user_last_name", "userLastName", "Last name", "Last Name", "User's Last Name (from Shipping)", "User's Surname (from Shipping)"],
  last_viewed_item_list_name: ["last_viewed_item_list_name", "lastViewedItemListName", "Last Viewed Item List Name"],
  total_lifetime_purchase_value: ["total_lifetime_purchase_value", "totalLifetimePurchaseValue", "Total Lifetime Purchase Value"],
  has_active_booking: ["has_active_booking", "hasActiveBooking", "Has Active Booking"],
  searches_last_7d: ["searches_last_7d", "searchesLast7d", "Searches Last 7d", "Searches last 7d"],
  profile_activity: ["profile_activity", "profileActivity", "Profile activity", "Profile Activity"],
  preferred_origin_airport: ["preferred_origin_airport", "preferredOriginAirport", "Preferred Origin Airport"],
  lifetime_booking_count: ["lifetime_booking_count", "lifetimeBookingCount", "Lifetime Booking Count"],
  vip_status: ["vip_status", "vipStatus", "VIP Status"],
  loyalty_tier: ["loyalty_tier", "loyaltyTier", "Loyalty Tier"],
  watched_price_destination: ["watched_price_destination", "watchedPriceDestination", "Watched Price Destination"],
  deal_affinity: ["deal_affinity", "dealAffinity", "Deal Affinity"],
  price_sensitivity: ["price_sensitivity", "priceSensitivity", "Price Sensitivity"],
  active_itinerary_items: ["active_itinerary_items", "activeItineraryItems", "Active Itinerary Items"],
  abandoned_cart_items: ["abandoned_cart_items", "abandonedCartItems", "Abandoned Cart Items"],
  booking_lifecycle_stage: ["booking_lifecycle_stage", "bookingLifecycleStage", "Booking Lifecycle Stage"],
  traveler_composition: ["traveler_composition", "travelerComposition", "Traveler Composition"],
  preferred_product_categories: ["preferred_product_categories", "preferredProductCategories", "Preferred Product Categories"],
  preferred_trip_types: ["preferred_trip_types", "preferredTripTypes", "Preferred Trip Types"],
  destination_affinities: ["destination_affinities", "destinationAffinities", "Destination Affinities"],
  top_destination: ["top_destination", "topDestination", "Top Destination"]
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
    || detailDestinationValue(normalized.top_destination)
    || topAffinityDestination(normalized.destination_affinities)
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
      has_active_booking: detailBooleanValue(normalized.has_active_booking, fallback.has_active_booking),
      searches_last_7d: detailNumberValue(normalized.searches_last_7d) || fallback.searches_last_7d || 0,
      profile_activity: normalized.profile_activity || fallback.profile_activity,
      last_viewed_item_list_name: detailListValue(normalized.last_viewed_item_list_name) || fallback.last_viewed_item_list_name,
      total_lifetime_purchase_value: Number.isFinite(value) ? value : fallback.total_lifetime_purchase_value,
      preferred_origin_airport: detailTextValue(normalized.preferred_origin_airport) || fallback.preferred_origin_airport,
      lifetime_booking_count: detailNumberValue(normalized.lifetime_booking_count) || fallback.lifetime_booking_count || 0,
      vip_status: detailTextValue(normalized.vip_status) || fallback.vip_status,
      loyalty_tier: detailTextValue(normalized.loyalty_tier) || fallback.loyalty_tier,
      watched_price_destination: detailDestinationValue(normalized.watched_price_destination) || fallback.watched_price_destination,
      deal_affinity: detailTextValue(normalized.deal_affinity) || fallback.deal_affinity,
      price_sensitivity: detailTextValue(normalized.price_sensitivity) || fallback.price_sensitivity,
      active_itinerary_items: detailArrayWithFallback(normalized.active_itinerary_items, fallback.active_itinerary_items),
      abandoned_cart_items: detailArrayWithFallback(normalized.abandoned_cart_items, fallback.abandoned_cart_items),
      booking_lifecycle_stage: detailTextValue(normalized.booking_lifecycle_stage) || fallback.booking_lifecycle_stage,
      traveler_composition: normalized.traveler_composition || fallback.traveler_composition,
      preferred_product_categories: detailArrayWithFallback(normalized.preferred_product_categories, fallback.preferred_product_categories),
      preferred_trip_types: detailArrayWithFallback(normalized.preferred_trip_types, fallback.preferred_trip_types),
      destination_affinities: detailArrayWithFallback(normalized.destination_affinities, fallback.destination_affinities),
      top_destination: detailDestinationValue(normalized.top_destination) || topAffinityDestination(normalized.destination_affinities) || fallback.top_destination || destination,
      next_trip_destination: detailDestinationValue(normalized.next_trip_destination) || detailDestinationValue(normalized.top_destination) || destination,
      last_interest_destination: destination,
      last_interest_trip_type: firstArrayValue(normalized.preferred_trip_types) || searchDetails.trip_type || searchDetails.tripType || offerDetails.trip_type || destinationDetails.trip_type || fallback.last_interest_trip_type,
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
  if (typeof unwrapped === "object") return unwrapped.first_name || unwrapped.firstName || unwrapped.name || unwrapped.value || unwrapped.text || unwrapped.title || "";
  return String(unwrapped);
}

function detailTextValue(value) {
  const unwrapped = unwrapAttributeValue(value);
  if (unwrapped === undefined || unwrapped === null || unwrapped === "") return "";
  if (typeof unwrapped === "string") return unwrapped;
  if (typeof unwrapped === "number" || typeof unwrapped === "boolean") return String(unwrapped);
  if (Array.isArray(unwrapped)) return detailTextValue(unwrapped[0]);
  if (typeof unwrapped === "object") return unwrapped.value || unwrapped.name || unwrapped.title || unwrapped.label || unwrapped.id || "";
  return String(unwrapped);
}

function detailArrayValue(value) {
  const unwrapped = unwrapAttributeValue(value);
  if (unwrapped === undefined || unwrapped === null || unwrapped === "") return [];
  return Array.isArray(unwrapped) ? unwrapped : [unwrapped];
}

function detailArrayWithFallback(value, fallback = []) {
  const items = detailArrayValue(value);
  return items.length ? items : detailArrayValue(fallback);
}

function firstArrayValue(value) {
  const items = detailArrayValue(value);
  return detailTextValue(items[0]);
}

function topAffinityDestination(value) {
  const affinities = detailArrayValue(value);
  if (!affinities.length) return "";
  const sorted = [...affinities].sort((a, b) => detailNumberValue(b.score ?? b.value ?? b.affinity) - detailNumberValue(a.score ?? a.value ?? a.affinity));
  return detailDestinationValue(sorted[0]);
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

function detailBooleanValue(value, fallback = false) {
  const unwrapped = unwrapAttributeValue(value);
  if (unwrapped === undefined || unwrapped === null || unwrapped === "") return Boolean(fallback);
  if (typeof unwrapped === "boolean") return unwrapped;
  if (typeof unwrapped === "number") return unwrapped > 0;
  if (typeof unwrapped === "string") return ["true", "1", "yes", "y", "active"].includes(unwrapped.trim().toLowerCase());
  if (Array.isArray(unwrapped)) return detailBooleanValue(unwrapped[0], fallback);
  if (typeof unwrapped === "object") {
    for (const key of ["value", "active", "has_active_booking", "hasActiveBooking"]) {
      if (unwrapped[key] !== undefined) return detailBooleanValue(unwrapped[key], fallback);
    }
  }
  return Boolean(fallback);
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
      has_active_booking: persona.id !== "anonymous",
      searches_last_7d: persona.id === "abandoner" ? 7 : persona.id === "business" ? 5 : persona.id === "family" ? 4 : 2,
      profile_activity: {
        status: persona.id === "abandoner" ? "high_intent" : "active",
        last_seen: new Date().toISOString(),
        searches_last_7d: persona.id === "abandoner" ? 7 : persona.id === "business" ? 5 : persona.id === "family" ? 4 : 2
      },
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
      preferred_origin_airport: persona.id === "business" ? "PRG" : "PRG",
      lifetime_booking_count: persona.id === "vip" ? 9 : persona.id === "business" ? 5 : persona.id === "family" ? 3 : 1,
      vip_status: persona.id === "vip" ? "vip" : persona.id === "business" ? "priority" : "standard",
      loyalty_tier: persona.loyaltyTier,
      watched_price_destination: persona.preferredDestination,
      deal_affinity: persona.budgetAffinity === "value" ? "high" : persona.id === "vip" ? "low" : "medium",
      price_sensitivity: persona.budgetAffinity === "value" ? "high" : persona.budgetAffinity === "premium" ? "low" : "medium",
      active_itinerary_items: persona.id === "abandoner" ? [] : persona.cartRestoreIds.slice(0, 2),
      abandoned_cart_items: persona.id === "abandoner" ? persona.cartRestoreIds : [],
      booking_lifecycle_stage: persona.id === "abandoner" ? "checkout_abandoned" : persona.id === "anonymous" ? "searching" : "post_booking",
      traveler_composition: {
        adults: persona.id === "business" ? 1 : 2,
        children: persona.id === "family" ? 2 : 0,
        children_ages: persona.id === "family" ? [6, 8] : []
      },
      preferred_product_categories: persona.id === "business" ? ["flight", "hotel", "transfer"] : persona.id === "family" ? ["package", "experience", "transfer"] : ["package", "hotel", "experience"],
      preferred_trip_types: [persona.preferredTripType],
      destination_affinities: [
        { destination: persona.preferredDestination, score: 0.92 },
        { destination: persona.id === "business" ? "Zurich" : "Lisbon", score: 0.61 }
      ],
      top_destination: persona.preferredDestination,
      recommended_add_on_ids: addOns
    }
  };
}
