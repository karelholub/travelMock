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

function personaScenario(persona) {
  const scenarios = {
    anonymous: "Cold start",
    abandoner: "Cart rescue",
    vip: "VIP upsell",
    family: "Family trip",
    business: "Business path"
  };
  return scenarios[persona.id] || "Demo path";
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
  const activeBooking = fields.has_active_booking ? "yes" : "no";
  const searchesLast7d = detailNumber(fields.searches_last_7d, 0);
  const latestEvent = trackingLog[0]?.name || "none yet";
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Demo control</p>
        <h1>Presenter cockpit</h1>
        <p>Pick a persona, run a customer path, then verify Profile API fields and tracking evidence without hunting through the site.</p>
      </div>
      <a class="secondary" href="/" data-link>Back to shopping</a>
    </section>
    <section class="demo-script-panel">
      <div>
        <span class="eyebrow">Demo script</span>
        <h2>${activePersona.label}: ${destination}</h2>
        <p>Start with search intent, add or restore itinerary behavior, then prove the profile and events updated.</p>
      </div>
      <div class="demo-script-actions">
        <a class="primary" href="/search" data-link><span>Run search</span><small>intent</small></a>
        <button class="secondary" type="button" data-restore-cart><span>Restore itinerary</span><small>abandonment</small></button>
        <a class="secondary" href="/account" data-link><span>Show profile</span><small>Profile API</small></a>
        <a class="secondary" href="/checkout" data-link><span>Checkout flow</span><small>purchase</small></a>
      </div>
    </section>
    <section class="cockpit-strip">
      <article><span>Persona</span><strong>${activePersona.label}</strong></article>
      <article><span>Destination</span><strong>${destination}</strong></article>
      <article><span>Profile source</span><strong>${state.profile?.source || "pending"}</strong></article>
      <article><span>Latest event</span><strong>${latestEvent}</strong></article>
    </section>
    <section class="demo-grid persona-picker">
      ${Object.values(personas).map((persona) => `
        <button class="persona-card ${persona.id === state.personaId ? "active" : ""}" data-persona="${persona.id}">
          <span class="persona-scenario">${personaScenario(persona)}</span>
          <strong>${persona.label}</strong>
          <small><span>${persona.preferredDestination}</span><span>${persona.loyaltyTier}</span></small>
          <span>${persona.hero}</span>
        </button>
      `).join("")}
    </section>
    <section class="control-panels">
      <article class="summary-card control-card">
        <div class="summary-card-head">
          <span class="eyebrow">SDK controls</span>
          <h2>Consent</h2>
        </div>
        <div class="toggle-list">
          <label class="check"><input type="checkbox" data-consent="analytics" checked /> Analytics</label>
          <label class="check"><input type="checkbox" data-consent="personalization" checked /> Personalization</label>
          <label class="check"><input type="checkbox" data-consent="marketing" /> Marketing</label>
        </div>
        <p class="signal-note">Consent changes are sent to the SDK immediately, so persistence and identity behavior stay demo-safe.</p>
      </article>
      <article class="summary-card tracking-log">
        <div class="summary-card-head">
          <span class="eyebrow">Recent evidence</span>
          <h2>Tracking readiness</h2>
        </div>
        <p class="control-note">${trackingLog.length ? `${trackingLog.length} recent events captured locally. Latest: ${latestEvent}.` : "No local tracking events yet."}</p>
        ${trackingLog.map((event) => `<code><span>${event.at}</span>${event.name}</code>`).join("") || "<p>No events yet. Click around and enjoy the evidence.</p>"}
      </article>
      <article class="summary-card lifecycle-card">
        <div class="summary-card-head">
          <span class="eyebrow">Lifecycle</span>
          <h2>Simulator</h2>
        </div>
        <button class="secondary full lifecycle-button" data-lifecycle="trip_completed"><span>Emit trip completed</span><small>post-booking lifecycle</small></button>
        <button class="secondary full lifecycle-button" data-lifecycle="review_submitted"><span>Emit 5-star review</span><small>review journey</small></button>
        <button class="secondary full lifecycle-button" data-lifecycle="payment_failed"><span>Emit payment failed</span><small>payment recovery</small></button>
      </article>
      <article class="summary-card profile-debug-card">
        <div class="profile-debug-head">
          <div class="summary-card-head">
            <span class="eyebrow">Profile API</span>
            <h2>Hydration proof</h2>
          </div>
          <span class="status-pill ${profileStatus.tone}">${profileStatus.label}</span>
          <button class="secondary" type="button" data-refresh-profile>Refresh profile</button>
        </div>
        <div class="profile-proof-strip">
          ${signalRow("Lookup", `${lookupType} · ${maskIdentifier(lookupValue)}`)}
          ${signalRow("Checked", checkedAt)}
          ${signalRow("email", detailText(fields.email || state.booking?.email, "pending checkout identity"))}
          ${signalRow("first_name", detailText(fields.first_name || state.booking?.first_name, "pending"))}
          ${signalRow("destination", destination)}
          ${signalRow("lifetime_value", lifetimeValue)}
        </div>
        <div class="debug-grid">
          ${signalRow("source", state.profile?.source || "pending")}
          ${profileStatus.detail ? signalRow("Status detail", profileStatus.detail) : ""}
          ${signalRow("last_name", detailText(fields.last_name || fields.surname || state.booking?.surname, "pending"))}
          ${signalRow("has_active_booking", activeBooking)}
          ${signalRow("searches_last_7d", searchesLast7d)}
          ${signalRow("profile_activity", detailText(fields.profile_activity))}
          ${signalRow("last_search", detailText(fields.last_search_details || fields.last_search_performed_details))}
          ${signalRow("last_viewed_item", detailText(fields.last_viewed_item))}
          ${signalRow("wishlist", detailText(fields.last_wishlist_item_added))}
          ${signalRow("abandoned_booking", detailText(fields.abandoned_booking))}
          ${signalRow("list_name", viewedList)}
        </div>
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
