import { personas } from "../data/personas.js";
import { enrichCartItems, cartTotal, bookingItemCount, findProductsByIds } from "../catalog/lookups.js";

const saved = JSON.parse(localStorage.getItem("elsewhere-state") || "null");

function normalizeSavedState(value) {
  if (!value) return null;
  const search = value.search || {};
  const children = Number(search.children || 0);
  const adults = Number(search.adults || Math.max(1, Number(search.travelers || 2) - children));
  const productCategory = value.searchPolishVersion ? search.productCategory || "all" : "all";
  return {
    ...value,
    searchPolishVersion: 1,
    search: {
      origin: "Prague",
      destination: "Lisbon",
      departureDate: "2026-09-12",
      returnDate: "2026-09-18",
      cabinClass: "economy",
      tripType: "city",
      ...search,
      productCategory,
      adults,
      children,
      childAges: Array.isArray(search.childAges) ? search.childAges.slice(0, children) : [],
      travelers: adults + children
    },
    watchedProductIds: Array.isArray(value.watchedProductIds) ? value.watchedProductIds : [],
    savedProductIds: Array.isArray(value.savedProductIds) ? value.savedProductIds : []
  };
}

export const state = normalizeSavedState(saved) || {
  searchPolishVersion: 1,
  personaId: "anonymous",
  profile: null,
  search: {
    origin: "Prague",
    destination: "Lisbon",
    departureDate: "2026-09-12",
    returnDate: "2026-09-18",
    travelers: 2,
    adults: 2,
    children: 0,
    childAges: [],
    cabinClass: "economy",
    tripType: "city",
    productCategory: "all"
  },
  cart: { items: [] },
  booking: null,
  recentProductIds: [...personas.anonymous.recentProductIds],
  watchedProductIds: [],
  savedProductIds: [],
  trackingLog: []
};

const subscribers = new Set();
let cachedCartItems = null;
let cachedCartSummary = null;

export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function updateState(patch) {
  Object.assign(state, typeof patch === "function" ? patch(state) : patch);
  localStorage.setItem("elsewhere-state", JSON.stringify(state));
  subscribers.forEach((callback) => callback(state));
}

export function appendTrackingLog(detail) {
  const entry = { name: detail.name, at: new Date().toLocaleTimeString() };
  state.trackingLog = [...(state.trackingLog || []), entry].slice(-30);
  localStorage.setItem("elsewhere-state", JSON.stringify(state));
}

export function setPersona(personaId, profile) {
  const persona = personas[personaId] || personas.anonymous;
  updateState((draft) => ({
    personaId,
    profile,
    search: {
      ...draft.search,
      destination: persona.preferredDestination,
      tripType: persona.preferredTripType
    },
    recentProductIds: [...persona.recentProductIds]
  }));
}

export function addToCart(productId, quantity = 1) {
  const current = state.cart.items.find((item) => item.productId === productId);
  if (current) current.quantity += quantity;
  else state.cart.items.push({ productId, quantity, addedAt: new Date().toISOString() });
  updateState({ cart: { items: [...state.cart.items] } });
}

export function addItemsToCart(productIds, quantity = 1) {
  const itemsByProductId = new Map(state.cart.items.map((item) => [item.productId, { ...item }]));
  productIds.forEach((productId) => {
    const current = itemsByProductId.get(productId);
    if (current) current.quantity += quantity;
    else itemsByProductId.set(productId, { productId, quantity, addedAt: new Date().toISOString() });
  });
  updateState({ cart: { items: [...itemsByProductId.values()] } });
}

export function removeFromCart(productId) {
  updateState({ cart: { items: state.cart.items.filter((item) => item.productId !== productId) } });
}

export function clearCart() {
  updateState({ cart: { items: [] } });
}

export function rememberProduct(productId) {
  if (state.recentProductIds[0] === productId) return;
  updateState({
    recentProductIds: [productId, ...state.recentProductIds.filter((id) => id !== productId)].slice(0, 6)
  });
}

export function watchProduct(productId) {
  if (state.watchedProductIds.includes(productId)) return false;
  updateState({ watchedProductIds: [productId, ...state.watchedProductIds].slice(0, 20) });
  return true;
}

export function saveProduct(productId) {
  if (state.savedProductIds.includes(productId)) return false;
  updateState({ savedProductIds: [productId, ...state.savedProductIds].slice(0, 40) });
  return true;
}

export function removeSavedProduct(productId) {
  updateState({ savedProductIds: state.savedProductIds.filter((id) => id !== productId) });
}

export function wishlistProducts() {
  return findProductsByIds(state.savedProductIds || []);
}

export function cartSummary() {
  if (cachedCartItems === state.cart.items && cachedCartSummary) return cachedCartSummary;
  const enriched = enrichCartItems(state.cart.items);
  const total = cartTotal(enriched);
  const count = bookingItemCount(enriched);
  cachedCartItems = state.cart.items;
  cachedCartSummary = { enriched, total, count };
  return cachedCartSummary;
}
