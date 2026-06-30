import { personas } from "../data/personas.js";
import { meiroBuiltInEventTypes } from "../tracking/schema.js";

const travelDemoEvents = [
  "page_view",
  "search",
  "view_search_results",
  "view_item_list",
  "select_item",
  "view_item",
  "add_to_wishlist",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "survey_answer"
];

export function demoControlPage(state) {
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Demo control</p>
        <h1>Presenter cockpit</h1>
      </div>
      <a class="secondary" href="/" data-link>Back to shopping</a>
    </section>
    <section class="demo-grid">
      ${Object.values(personas).map((persona) => `
        <button class="persona-card ${persona.id === state.personaId ? "active" : ""}" data-persona="${persona.id}">
          <strong>${persona.label}</strong>
          <span>${persona.hero}</span>
          <small>${persona.preferredDestination} · ${persona.loyaltyTier}</small>
        </button>
      `).join("")}
    </section>
    <section class="control-panels">
      <article class="summary-card">
        <h2>Consent</h2>
        <label class="check"><input type="checkbox" data-consent="analytics" checked /> Analytics</label>
        <label class="check"><input type="checkbox" data-consent="personalization" checked /> Personalization</label>
        <label class="check"><input type="checkbox" data-consent="marketing" /> Marketing</label>
      </article>
      <article class="summary-card">
        <h2>Profile API hydration</h2>
        <div><span>Source</span><strong>${state.profile?.source || "pending"}</strong></div>
        <div><span>next_trip_destination</span><strong>${state.profile?.fields?.next_trip_destination || "pending"}</strong></div>
        <div><span>recommended_add_on_ids</span><strong>${(state.profile?.fields?.recommended_add_on_ids || []).join(", ") || "pending"}</strong></div>
      </article>
      <article class="summary-card tracking-log">
        <h2>Tracking readiness</h2>
        ${(state.trackingLog || []).slice(-8).reverse().map((event) => `<code>${event.name}</code>`).join("") || "<p>No events yet. Click around and enjoy the evidence.</p>"}
      </article>
      <article class="summary-card">
        <h2>Lifecycle simulator</h2>
        <button class="secondary full" data-lifecycle="trip_completed">Emit trip completed</button>
        <button class="secondary full" data-lifecycle="review_submitted">Emit 5-star review</button>
        <button class="secondary full" data-lifecycle="payment_failed">Emit payment failed</button>
      </article>
    </section>
    <section class="event-types">
      <article class="summary-card">
        <h2>Travel demo events sent to Meiro</h2>
        <div class="event-chip-grid">
          ${travelDemoEvents.map((event) => `<code>${event}</code>`).join("")}
        </div>
      </article>
      <article class="summary-card">
        <h2>Available built-in event types</h2>
        <div class="event-chip-grid compact-events">
          ${meiroBuiltInEventTypes.map((event) => `<code>${event}</code>`).join("")}
        </div>
      </article>
    </section>
  `;
}
