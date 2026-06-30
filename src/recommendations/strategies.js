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

const byType = products.reduce((map, product) => {
  map.set(product.type, [...(map.get(product.type) || []), product.id]);
  return map;
}, new Map());

function uniqueProducts(ids, limit = 6) {
  return findProductsByIds([...new Set(ids)]).slice(0, limit);
}

export const recommendationStrategies = {
  recently_viewed(context) {
    return uniqueProducts(context.recentProductIds || []);
  },
  same_destination(context) {
    const destination = context.destination || context.persona.preferredDestination;
    return uniqueProducts(byDestination.get(destination) || []);
  },
  same_trip_type(context) {
    const tripType = context.tripType || context.persona.preferredTripType;
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
    const profileIds = context.profile?.fields?.recommended_add_on_ids || [];
    return uniqueProducts([...profileIds, ...(byTripType.get(context.persona.preferredTripType) || [])]);
  },
  high_margin_add_ons() {
    return products
      .filter((product) => product.margin >= 0.45)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 6);
  },
  post_booking_add_ons(context) {
    return recommendationStrategies.package_add_ons(context).concat(recommendationStrategies.high_margin_add_ons(context)).slice(0, 6);
  },
  abandoned_booking_restore(context) {
    return uniqueProducts(context.persona.cartRestoreIds || []);
  }
};

export function recommendationRail(page, state, extra = {}) {
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
  return uniqueProducts(ids.filter((id) => !excluded.has(id)), 8);
}

export function personalizedResults(search, state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const query = `${search.destination} ${search.tripType}`.toLowerCase();
  return products
    .filter((product) => {
      if (!query.trim()) return true;
      return [product.destination, product.tripType, product.type, product.name, product.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query.split(" ")[0]);
    })
    .sort((a, b) => {
      const aScore = scoreProduct(a, persona, search);
      const bScore = scoreProduct(b, persona, search);
      return bScore - aScore || a.price - b.price;
    });
}

function scoreProduct(product, persona, search) {
  let score = 0;
  if (product.destination === search.destination) score += 8;
  if (product.destination === persona.preferredDestination) score += 5;
  if (product.tripType === search.tripType) score += 4;
  if (product.tripType === persona.preferredTripType) score += 4;
  if (product.tags.includes(persona.travelerKind)) score += 4;
  if (persona.budgetAffinity === "premium" && product.price > 800) score += 3;
  if (persona.budgetAffinity === "value" && product.price < 1000) score += 3;
  if (persona.loyaltyTier.includes("Platinum") && product.tags.includes("vip")) score += 4;
  return score;
}
