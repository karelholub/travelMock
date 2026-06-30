import { profileIdentity } from "../app/profileIdentity.js";
import { personas } from "../data/personas.js";
import { meiroBuiltInEventTypes } from "../tracking/schema.js";
import { detailDestination, detailListName, detailNumber, detailText, maskIdentifier, profileApiStatus } from "../utils/profileDisplay.js";
import { money } from "../utils/format.js";

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

function signalRow(label, value) {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}

export function demoControlPage(state) {
  const fields = state.profile?.fields || {};
  const activePersona = personas[state.personaId] || personas.anonymous;
  const trackingLog = (state.trackingLog || []).slice(-8).reverse();
  const profileStatus = profileApiStatus(state.profile);
  const identity = profileIdentity(state);
  const lookup = state.profileLookup || {};
  const lookupType = lookup.identityType || (identity.user_id ? "user_id" : identity.email ? "email" : "none");
  const lookupValue = lookup.identityValue || identity.user_id || identity.email || "";
  const checkedAt = lookup.checkedAt ? new Date(lookup.checkedAt).toLocaleTimeString() : "loading";
  const destination = detailDestination(
    fields.last_purchased_item_destination,
    fields.next_trip_destination,
    fields.last_search_details,
    fields.last_search_performed_details,
    fields.last_viewed_destination_details
  ) || activePersona.preferredDestination;
  const viewedList = detailListName(fields.last_viewed_item_list_name, "pending");
  const lifetimeValue = money(detailNumber(fields.total_lifetime_purchase_value ?? fields.booking_value, 0));
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Demo control</p>
        <h1>Presenter cockpit</h1>
      </div>
      <a class="secondary" href="/" data-link>Back to shopping</a>
    </section>
    <section class="cockpit-strip">
      <article><span>Persona</span><strong>${activePersona.label}</strong></article>
      <article><span>Destination</span><strong>${destination}</strong></article>
      <article><span>Profile source</span><strong>${state.profile?.source || "pending"}</strong></article>
      <article><span>Recent events</span><strong>${trackingLog.length}</strong></article>
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
      <article class="summary-card control-card">
        <h2>Consent</h2>
        <div class="toggle-list">
          <label class="check"><input type="checkbox" data-consent="analytics" checked /> Analytics</label>
          <label class="check"><input type="checkbox" data-consent="personalization" checked /> Personalization</label>
          <label class="check"><input type="checkbox" data-consent="marketing" /> Marketing</label>
        </div>
      </article>
      <article class="summary-card profile-debug-card">
        <h2>Profile API hydration</h2>
        <span class="status-pill ${profileStatus.tone}">${profileStatus.label}</span>
        <button class="secondary full" type="button" data-refresh-profile>Refresh profile</button>
        <div class="debug-grid">
          ${signalRow("source", state.profile?.source || "pending")}
          ${signalRow("Lookup", `${lookupType} · ${maskIdentifier(lookupValue)}`)}
          ${signalRow("Checked", checkedAt)}
          ${profileStatus.detail ? signalRow("Status detail", profileStatus.detail) : ""}
          ${signalRow("email", detailText(fields.email || state.booking?.email, "pending checkout identity"))}
          ${signalRow("first_name", detailText(fields.first_name || state.booking?.first_name, "pending"))}
          ${signalRow("last_name", detailText(fields.last_name || fields.surname || state.booking?.surname, "pending"))}
          ${signalRow("destination", destination)}
          ${signalRow("last_search", detailText(fields.last_search_details || fields.last_search_performed_details))}
          ${signalRow("last_viewed_item", detailText(fields.last_viewed_item))}
          ${signalRow("wishlist", detailText(fields.last_wishlist_item_added))}
          ${signalRow("abandoned_booking", detailText(fields.abandoned_booking))}
          ${signalRow("list_name", viewedList)}
          ${signalRow("lifetime_value", lifetimeValue)}
        </div>
      </article>
      <article class="summary-card tracking-log">
        <h2>Tracking readiness</h2>
        ${trackingLog.map((event) => `<code><span>${event.at}</span>${event.name}</code>`).join("") || "<p>No events yet. Click around and enjoy the evidence.</p>"}
      </article>
      <article class="summary-card lifecycle-card">
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
