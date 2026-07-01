import { products } from "../catalog/products.js";
import { findProductById, findProductsByIds } from "../catalog/lookups.js";
import { personas } from "../data/personas.js";

const byDestination = products.reduce((map, product) => {
  map.set(product.destination, [...(map.get(product.destination) || []), product.id]);
  return map;
}, new Map());

const byTripType = products.reduce((map, product) => {
  map.set(product.tripType, [...(map.get(product.tripType) || []), product.id]);
  return map;
}, new Map());

const highMarginAddOns = products
  .filter((product) => product.margin >= 0.45)
  .sort((a, b) => b.margin - a.margin)
  .slice(0, 6);

const recommendationCache = new Map();
const searchResultsCache = new Map();

function uniqueProducts(ids, limit = 6) {
  return findProductsByIds([...new Set(ids)]).slice(0, limit);
}

function arrayValue(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function productIdsFromDetail(detail) {
  if (!detail) return [];
  if (typeof detail === "string") return [detail];
  if (Array.isArray(detail)) return detail.flatMap((item) => productIdsFromDetail(item));
  return [
    detail.item_id,
    detail.itemId,
    detail.product_id,
    detail.productId,
    ...arrayValue(detail.item_ids),
    ...arrayValue(detail.itemIds),
    ...arrayValue(detail.product_ids),
    ...arrayValue(detail.productIds),
    ...arrayValue(detail.add_on_ids),
    ...arrayValue(detail.addOnIds)
  ].filter(Boolean);
}

function destinationFromDetail(detail) {
  if (!detail || typeof detail === "string") return "";
  if (Array.isArray(detail)) {
    for (const item of detail) {
      const destination = destinationFromDetail(item) || (typeof item === "string" ? item : "");
      if (destination) return destination;
    }
    return "";
  }
  return detail.destination || detail.destinations?.[0] || "";
}

function tripTypeFromDetail(detail) {
  if (!detail || typeof detail === "string") return "";
  if (Array.isArray(detail)) {
    for (const item of detail) {
      const tripType = tripTypeFromDetail(item) || (typeof item === "string" ? item : "");
      if (tripType) return tripType;
    }
    return "";
  }
  return detail.trip_type || detail.tripType || "";
}

function topDestinationFromAffinities(value) {
  const affinities = arrayValue(value).filter(Boolean);
  if (!affinities.length) return "";
  const sorted = [...affinities].sort((a, b) => Number(b.score ?? b.value ?? b.affinity ?? 0) - Number(a.score ?? a.value ?? a.affinity ?? 0));
  return destinationFromDetail(sorted[0]) || (typeof sorted[0] === "string" ? sorted[0] : "");
}

function profileFields(context) {
  return context.profile?.fields || {};
}

function boundedCacheSet(cache, key, value) {
  if (cache.size > 40) cache.clear();
  cache.set(key, value);
  return value;
}

function stableFieldKey(fields) {
  return JSON.stringify({
    abandoned_booking: fields.abandoned_booking,
    last_booking_started_details: fields.last_booking_started_details,
    last_interest_destination: fields.last_interest_destination,
    last_interest_trip_type: fields.last_interest_trip_type,
    last_search_details: fields.last_search_details,
    last_search_performed_details: fields.last_search_performed_details,
    last_viewed_destination_details: fields.last_viewed_destination_details,
    last_viewed_item: fields.last_viewed_item,
    last_viewed_offer_details: fields.last_viewed_offer_details,
    last_wishlist_item_added: fields.last_wishlist_item_added,
    recommended_add_on_ids: fields.recommended_add_on_ids,
    active_itinerary_items: fields.active_itinerary_items,
    abandoned_cart_items: fields.abandoned_cart_items,
    booking_lifecycle_stage: fields.booking_lifecycle_stage,
    preferred_product_categories: fields.preferred_product_categories,
    preferred_trip_types: fields.preferred_trip_types,
    destination_affinities: fields.destination_affinities,
    top_destination: fields.top_destination
  });
}

function recommendationCacheKey(page, state, extra) {
  const fields = state.profile?.fields || {};
  const cartProductIds = (extra.cartProducts || []).map((product) => product.id).join(",");
  return JSON.stringify({
    page,
    personaId: state.personaId,
    destination: state.search.destination,
    tripType: state.search.tripType,
    recentProductIds: state.recentProductIds,
    cartProductIds,
    currentProductId: extra.currentProduct?.id,
    profile: stableFieldKey(fields)
  });
}

function searchCacheKey(search, state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const fields = state.profile?.fields || {};
  return JSON.stringify({
    personaId: state.personaId,
    personaDestination: persona.preferredDestination,
    personaTripType: persona.preferredTripType,
    destination: search.destination,
    tripType: search.tripType,
    productCategory: search.productCategory,
    profile: stableFieldKey(fields)
  });
}

export const recommendationStrategies = {
  recently_viewed(context) {
    const fields = profileFields(context);
    return uniqueProducts([
      ...productIdsFromDetail(fields.last_viewed_item),
      ...productIdsFromDetail(fields.last_viewed_offer_details),
      ...(context.recentProductIds || [])
    ]);
  },
  same_destination(context) {
    const fields = profileFields(context);
    const destination = context.destination
      || fields.top_destination
      || topDestinationFromAffinities(fields.destination_affinities)
      || fields.last_interest_destination
      || destinationFromDetail(fields.last_search_details)
      || destinationFromDetail(fields.last_search_performed_details)
      || destinationFromDetail(fields.last_viewed_destination_details)
      || context.persona.preferredDestination;
    return uniqueProducts(byDestination.get(destination) || []);
  },
  same_trip_type(context) {
    const fields = profileFields(context);
    const tripType = context.tripType
      || arrayValue(fields.preferred_trip_types)[0]
      || fields.last_interest_trip_type
      || tripTypeFromDetail(fields.last_search_details)
      || tripTypeFromDetail(fields.last_search_performed_details)
      || context.persona.preferredTripType;
    return uniqueProducts(byTripType.get(tripType) || []);
  },
  flight_to_hotel(context) {
    const flight = context.cartProducts.find((product) => product.type === "flight") || context.currentProduct;
    if (!flight) return [];
    return uniqueProducts((byDestination.get(flight.destination) || []).filter((id) => findProductById(id)?.type === "hotel"));
  },
  hotel_to_transfer(context) {
    const hotel = context.cartProducts.find((product) => product.type === "hotel") || context.currentProduct;
    if (!hotel) return [];
    return uniqueProducts((byDestination.get(hotel.destination) || []).filter((id) => findProductById(id)?.type === "transfer"));
  },
  package_add_ons(context) {
    const destination = context.currentProduct?.destination || context.destination || context.persona.preferredDestination;
    return uniqueProducts((byDestination.get(destination) || []).filter((id) => ["insurance", "experience", "add_on", "transfer"].includes(findProductById(id)?.type)));
  },
  next_best_product(context) {
    const fields = profileFields(context);
    const profileIds = arrayValue(fields.recommended_add_on_ids);
    const preferredTypes = arrayValue(fields.preferred_trip_types);
    const preferredCategories = arrayValue(fields.preferred_product_categories);
    const preferredDestination = fields.top_destination || topDestinationFromAffinities(fields.destination_affinities) || fields.last_interest_destination;
    return uniqueProducts([
      ...productIdsFromDetail(fields.active_itinerary_items),
      ...productIdsFromDetail(fields.last_wishlist_item_added),
      ...productIdsFromDetail(fields.last_viewed_offer_details),
      ...profileIds,
      ...(preferredDestination ? byDestination.get(preferredDestination) || [] : []),
      ...preferredTypes.flatMap((tripType) => byTripType.get(tripType) || []),
      ...products.filter((product) => preferredCategories.includes(product.type)).map((product) => product.id),
      ...(byTripType.get(fields.last_interest_trip_type || context.persona.preferredTripType) || [])
    ]);
  },
  high_margin_add_ons() {
    return highMarginAddOns;
  },
  post_booking_add_ons(context) {
    return recommendationStrategies.package_add_ons(context).concat(recommendationStrategies.high_margin_add_ons(context)).slice(0, 6);
  },
  abandoned_booking_restore(context) {
    const fields = profileFields(context);
    return uniqueProducts([
      ...productIdsFromDetail(fields.abandoned_cart_items),
      ...productIdsFromDetail(fields.abandoned_booking),
      ...productIdsFromDetail(fields.last_booking_started_details),
      ...(context.persona.cartRestoreIds || [])
    ]);
  }
};

export function recommendationRail(page, state, extra = {}) {
  const cacheKey = recommendationCacheKey(page, state, extra);
  if (recommendationCache.has(cacheKey)) return recommendationCache.get(cacheKey);
  const persona = personas[state.personaId] || personas.anonymous;
  const cartProducts = extra.cartProducts || [];
  const context = {
    persona,
    profile: state.profile,
    recentProductIds: state.recentProductIds,
    destination: state.search.destination,
    tripType: state.search.tripType,
    cartProducts,
    ...extra
  };

  const rails = {
    homepage: ["next_best_product", "recently_viewed", "same_destination"],
    search: ["same_destination", "same_trip_type", "recently_viewed"],
    cart: ["flight_to_hotel", "hotel_to_transfer", "package_add_ons", "high_margin_add_ons", "abandoned_booking_restore"],
    product: ["flight_to_hotel", "hotel_to_transfer", "package_add_ons", "same_destination"],
    "thank-you": ["post_booking_add_ons", "next_best_product"],
    account: ["next_best_product", "recently_viewed"]
  };

  const ids = [];
  for (const strategy of rails[page] || ["next_best_product"]) {
    for (const product of recommendationStrategies[strategy](context)) ids.push(product.id);
  }
  const excluded = new Set(cartProducts.map((product) => product.id));
  return boundedCacheSet(recommendationCache, cacheKey, uniqueProducts(ids.filter((id) => !excluded.has(id)), 8));
}

export function personalizedResults(search, state) {
  const cacheKey = searchCacheKey(search, state);
  if (searchResultsCache.has(cacheKey)) return searchResultsCache.get(cacheKey);
  const persona = personas[state.personaId] || personas.anonymous;
  const fields = state.profile?.fields || {};
  const query = `${search.destination} ${search.tripType}`.toLowerCase();
  const productCategory = search.productCategory || "all";
  const results = products
    .filter((product) => {
      if (productCategory && productCategory !== "all" && product.type !== productCategory) return false;
      if (!query.trim()) return true;
      return [product.destination, product.tripType, product.type, product.name, product.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query.split(" ")[0]);
    })
    .sort((a, b) => {
      const aScore = scoreProduct(a, persona, search, fields);
      const bScore = scoreProduct(b, persona, search, fields);
      return bScore - aScore || a.price - b.price;
    });
  return boundedCacheSet(searchResultsCache, cacheKey, results);
}

function scoreProduct(product, persona, search, fields = {}) {
  let score = 0;
  const topDestination = fields.top_destination || topDestinationFromAffinities(fields.destination_affinities);
  const preferredTripTypes = arrayValue(fields.preferred_trip_types);
  const preferredCategories = arrayValue(fields.preferred_product_categories);
  if (product.destination === search.destination) score += 8;
  if (topDestination && product.destination === topDestination) score += 7;
  if (product.destination === persona.preferredDestination) score += 5;
  if (product.tripType === search.tripType) score += 4;
  if (preferredTripTypes.includes(product.tripType)) score += 5;
  if (product.tripType === persona.preferredTripType) score += 4;
  if (preferredCategories.includes(product.type)) score += 4;
  if (product.tags.includes(persona.travelerKind)) score += 4;
  if (["premium", "low"].includes(fields.price_sensitivity || persona.budgetAffinity) && product.price > 800) score += 3;
  if (["value", "high"].includes(fields.price_sensitivity || persona.budgetAffinity) && product.price < 1000) score += 3;
  if ((fields.loyalty_tier || persona.loyaltyTier).includes("Platinum") && product.tags.includes("vip")) score += 4;
  if (fields.vip_status === "vip" && product.tags.includes("vip")) score += 4;
  return score;
}
