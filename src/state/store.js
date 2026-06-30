import { personas } from "../data/personas.js";
import { enrichCartItems, cartTotal, bookingItemCount } from "../catalog/lookups.js";

const saved = JSON.parse(localStorage.getItem("elsewhere-state") || "null");

export const state = saved || {
  personaId: "anonymous",
  profile: null,
  search: {
    destination: "Lisbon",
    departureDate: "2026-09-12",
    returnDate: "2026-09-18",
    travelers: 2,
    tripType: "city"
  },
  cart: { items: [] },
  booking: null,
  recentProductIds: [...personas.anonymous.recentProductIds],
  trackingLog: []
};

const subscribers = new Set();

export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function updateState(patch) {
  Object.assign(state, typeof patch === "function" ? patch(state) : patch);
  localStorage.setItem("elsewhere-state", JSON.stringify(state));
  subscribers.forEach((callback) => callback(state));
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

export function removeFromCart(productId) {
  updateState({ cart: { items: state.cart.items.filter((item) => item.productId !== productId) } });
}

export function clearCart() {
  updateState({ cart: { items: [] } });
}

export function rememberProduct(productId) {
  updateState({
    recentProductIds: [productId, ...state.recentProductIds.filter((id) => id !== productId)].slice(0, 6)
  });
}

export function cartSummary() {
  const enriched = enrichCartItems(state.cart.items);
  const total = cartTotal(enriched);
  const count = bookingItemCount(enriched);
  return { enriched, total, count };
}
