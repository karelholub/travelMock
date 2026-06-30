import { hydrateProfile } from "../api/profileClient.js";
import { findProductByIdOrSlug } from "../catalog/lookups.js";
import { personalizedResults } from "../recommendations/strategies.js";
import { rememberProduct, updateState } from "../state/store.js";
import { trackEvent } from "../tracking/index.js";
import { trackingCartPayload, trackingItem, trackingSearchPayload } from "../tracking/schema.js";
import { profileIdentity } from "./profileIdentity.js";

let lastAccountProfileKey = "";

export function runPageEffects(path, state, summary) {
  if (path === "/search") trackSearchResults(state);
  if (path.startsWith("/product/")) trackProductView(path, state);
  if (path === "/account") refreshAccountProfile(state);
  if (path === "/itinerary") {
    trackEvent("view_cart", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, state.search));
  }
}

function trackSearchResults(state) {
  const resultProducts = personalizedResults(state.search, state).slice(0, 6);
  trackEvent("view_search_results", {
    ...trackingSearchPayload(state.search),
    result_count: resultProducts.length,
    items: resultProducts.map((product) => trackingItem(product, 1, state.search))
  });
  trackEvent("view_item_list", {
    list_name: "search_results",
    items: resultProducts.map((product) => trackingItem(product, 1, state.search))
  });
}

function trackProductView(path, state) {
  const product = findProductByIdOrSlug(decodeURIComponent(path.split("/").pop()));
  if (!product) return;
  rememberProduct(product.id);
  trackEvent("view_item", trackingItem(product, 1, state.search));
}

export async function refreshAccountProfile(state, options = {}) {
  const identity = profileIdentity(state);
  const lookupKey = JSON.stringify({ personaId: state.personaId, user_id: identity.user_id, email: identity.email });
  if (!options.force && lookupKey === lastAccountProfileKey) return;
  lastAccountProfileKey = lookupKey;
  const profile = await hydrateProfile(state.personaId, identity);
  const identityType = identity.user_id ? "user_id" : identity.email ? "email" : "none";
  const identityValue = identity.user_id || identity.email || "";
  updateState({
    profile,
    profileLookup: {
      checkedAt: new Date().toISOString(),
      identityType,
      identityValue
    }
  });
}
