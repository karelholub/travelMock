import { findProductById } from "../catalog/lookups.js";
import { money, productTypeLabel } from "../utils/format.js";
import { detailDestination, detailNumber, detailText } from "../utils/profileDisplay.js";

function profileFields(state) {
  return state.profile?.fields || {};
}

function firstName(fields) {
  return detailText(fields.first_name, "traveler");
}

function destinationSignal(fields, fallback = "Lisbon") {
  return detailDestination(
    fields.last_purchased_item_destination,
    fields.next_trip_destination,
    fields.last_search_details,
    fields.last_search_performed_details,
    fields.last_viewed_destination_details,
    fields.last_viewed_offer_details,
    fields.abandoned_booking
  ) || fallback;
}

function itemName(value, fallback = "saved trip") {
  const product = productFromSignal(value);
  return product?.name || detailText(value, fallback);
}

function activityText(value) {
  if (!value) return "active traveler";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return activityText(value[0]);
  return value.status || value.stage || value.segment || value.last_seen && "recently active" || detailText(value, "active traveler");
}

function productFromSignal(value) {
  if (!value) return null;
  if (typeof value === "string") return findProductById(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const product = productFromSignal(item);
      if (product) return product;
    }
    return null;
  }
  return findProductById(value.item_id || value.itemId || value.product_id || value.productId);
}

function recommendedAddOn(fields) {
  const ids = Array.isArray(fields.recommended_add_on_ids) ? fields.recommended_add_on_ids : [];
  return ids.map((id) => findProductById(id)).find(Boolean) || productFromSignal(fields.last_wishlist_item_added);
}

const placementConfig = {
  home: {
    tone: "accent",
    eyebrow: "Profile API personalization",
    title(fields, state) {
      return `${firstName(fields)}, ${destinationSignal(fields, state.search.destination)} is already warming up.`;
    },
    body(fields) {
      const list = detailText(fields.last_viewed_item_list_name, "homepage recommendations");
      return `Using destination affinity, recent list ${list}, and live profile fields to shape the first screen.`;
    },
    cta: { label: "View profile proof", href: "/account" }
  },
  search: {
    tone: "sky",
    eyebrow: "Search intent boost",
    title(fields, state) {
      const destination = destinationSignal(fields, state.search.destination);
      return `Results are biased toward ${destination} because the profile keeps mentioning it.`;
    },
    body(fields) {
      return `Last search: ${detailText(fields.last_search_details || fields.last_search_performed_details, "fresh search")}. Recent activity: ${activityText(fields.profile_activity)}.`;
    },
    cta: { label: "Open wishlist", href: "/wishlist" }
  },
  product: {
    tone: "gold",
    eyebrow: "Offer match",
    title(fields, state, options) {
      const product = options.product;
      return `${product?.destination || destinationSignal(fields, state.search.destination)} matches the current profile signals.`;
    },
    body(fields, state, options) {
      const product = options.product;
      return `Compared with ${itemName(fields.last_viewed_offer_details, "the last viewed offer")}, this ${product ? productTypeLabel(product.type) : "offer"} keeps the same intent thread alive.`;
    },
    cta: { label: "Save for later", action: "save-current" }
  },
  itinerary: {
    tone: "accent",
    eyebrow: "Cart recovery signal",
    title(fields, state) {
      return `${firstName(fields)}, this itinerary lines up with your abandoned booking story.`;
    },
    body(fields) {
      return `Abandoned booking: ${detailText(fields.abandoned_booking, "none yet")}. Booking started: ${detailText(fields.last_booking_started_details, "not started")}.`;
    },
    cta: { label: "Continue booking", href: "/checkout" }
  },
  checkout: {
    tone: "sky",
    eyebrow: "Checkout assist",
    title(fields) {
      const value = detailNumber(fields.total_lifetime_purchase_value || fields.booking_value, 0);
      return value ? `Lifetime value ${money(value)} says this booking deserves less friction.` : "Profile data is pre-warming the booking flow.";
    },
    body(fields) {
      return `Known identity: ${detailText(fields.email, "pending email")} · ${firstName(fields)} ${detailText(fields.last_name || fields.surname, "")}`.trim();
    },
    cta: { label: "Review account", href: "/account" }
  },
  account: {
    tone: "gold",
    eyebrow: "Live API surface",
    title(fields) {
      return `Profile fields are powering visible personalization, not hiding in a debug panel.`;
    },
    body(fields) {
      return `Destination ${destinationSignal(fields)} · wishlist ${itemName(fields.last_wishlist_item_added, "none")} · searches last 7 days ${detailText(fields.searches_last_7d, "0")}.`;
    },
    cta: { label: "Search with profile", href: "/search" }
  },
  thankYou: {
    tone: "accent",
    eyebrow: "Post-booking lifecycle",
    title(fields, state) {
      const addOn = recommendedAddOn(fields);
      return addOn ? `Next best action: ${addOn.name}.` : "Next best action is ready for post-booking journeys.";
    },
    body(fields, state) {
      return `Purchased destination ${detailText(fields.last_purchased_item_destination || state.booking?.destination, "pending")} now feeds post-booking add-ons and review timing.`;
    },
    cta: { label: "See next actions", href: "/demo-control" }
  },
  wishlist: {
    tone: "sky",
    eyebrow: "Wishlist intent",
    title(fields) {
      return `Saved trips are now a first-class personalization signal.`;
    },
    body(fields) {
      return `Last wishlist item: ${itemName(fields.last_wishlist_item_added, "waiting for a save")}. This is the CDP's polite version of commitment.`;
    },
    cta: { label: "Search more", href: "/search" }
  }
};

export function personalizationBanner(placement, state, options = {}) {
  const fields = profileFields(state);
  const config = placementConfig[placement];
  if (!config) return "";
  const cta = config.cta;
  const ctaHtml = cta?.href
    ? `<a class="secondary small" href="${cta.href}" data-link>${cta.label}</a>`
    : cta?.action === "save-current" && options.product
      ? `<button class="secondary small save-cta" type="button" data-save="${options.product.id}">${cta.label}</button>`
      : "";
  return `
    <section class="personalization-banner ${config.tone}" data-personalization-banner="${placement}">
      <div>
        <span class="eyebrow">${config.eyebrow}</span>
        <h2>${config.title(fields, state, options)}</h2>
        <p>${config.body(fields, state, options)}</p>
      </div>
      ${ctaHtml}
    </section>
  `;
}

export function personalizationPopup(state, path) {
  const fields = profileFields(state);
  if (!state.profile || ["/search", "/checkout", "/thank-you", "/review"].includes(path)) return "";
  const destination = destinationSignal(fields, state.search.destination);
  const addOn = recommendedAddOn(fields);
  const popupId = `${state.personaId}-${destination}-${addOn?.id || "profile"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `
    <aside class="personalization-popup" data-personalization-popup="${popupId}">
      <button class="personalization-popup-close" type="button" data-dismiss-personalization aria-label="Close personalization banner">&times;</button>
      <span class="eyebrow">Personalized by Profile API</span>
      <h2>${firstName(fields)}, ${destination} is the current signal.</h2>
      <p>${addOn ? `Recommended add-on: ${addOn.name} for ${money(addOn.price)}.` : `Recent profile activity suggests ${detailText(fields.last_interest_trip_type || state.search.tripType, "travel")} intent.`}</p>
      <div class="personalization-popup-actions">
        <a class="primary small" href="/search" data-link>Use this signal</a>
        <a class="secondary small" href="/account" data-link>Profile proof</a>
      </div>
    </aside>
  `;
}
