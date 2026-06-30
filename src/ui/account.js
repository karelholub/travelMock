import { personas, scenarioNotes } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money } from "../utils/format.js";
import { detailText } from "../utils/profileDisplay.js";
import { rail } from "./components.js";

export function accountPage(state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const fields = state.profile?.fields || {};
  const lifetimeValue = money(Number(fields.total_lifetime_purchase_value || fields.booking_value || 0));
  const destination = fields.last_purchased_item_destination || fields.next_trip_destination || persona.preferredDestination;
  const lastSearch = detailText(fields.last_search_details || fields.last_search_performed_details, destination);
  const abandoned = detailText(fields.abandoned_booking, "none");
  const wishlist = detailText(fields.last_wishlist_item_added, "none");
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Account</p>
        <h1>${fields.first_name || persona.label}</h1>
        <p>${persona.label} · ${destination} affinity · ${fields.loyalty_tier || persona.loyaltyTier}</p>
      </div>
      <a class="secondary" href="/demo-control" data-link>Demo controls</a>
    </section>
    <section class="loyalty-hero">
      <div>
        <span class="eyebrow">Personalization center</span>
        <h2>${fields.loyalty_tier || persona.loyaltyTier}</h2>
        <p>Known identity, fresh intent, and just enough travel ambition to make recommendations feel deliberate.</p>
      </div>
      <div class="loyalty-actions">
        <a class="primary" href="/search" data-link>Plan next trip</a>
        <a class="secondary" href="/itinerary" data-link>Review itinerary</a>
      </div>
    </section>
    <section class="account-layout">
      <section class="account-main">
        <div class="account-kpis">
          <article><span>Loyalty</span><strong>${fields.loyalty_tier || persona.loyaltyTier}</strong></article>
          <article><span>Destination affinity</span><strong>${destination}</strong></article>
          <article><span>Lifetime value</span><strong>${lifetimeValue}</strong></article>
          <article><span>Traveler type</span><strong>${persona.travelerKind}</strong></article>
        </div>
        <section class="profile-signal-grid">
          <article class="summary-card">
            <h2>Identity</h2>
            <div><span>Email</span><strong>${fields.email || state.booking?.email || "Unknown until checkout"}</strong></div>
            <div><span>First name</span><strong>${fields.first_name || state.booking?.first_name || "Unknown"}</strong></div>
            <div><span>Profile source</span><strong>${state.profile?.source || "pending"}</strong></div>
          </article>
          <article class="summary-card">
            <h2>Intent</h2>
            <div><span>Last search</span><strong>${lastSearch}</strong></div>
            <div><span>Last viewed list</span><strong>${fields.last_viewed_item_list_name || "homepage_recommended"}</strong></div>
            <div><span>Last wishlist item</span><strong>${wishlist}</strong></div>
          </article>
          <article class="summary-card">
            <h2>Recovery</h2>
            <div><span>Abandoned booking</span><strong>${abandoned}</strong></div>
            <div><span>Booking started</span><strong>${detailText(fields.last_booking_started_details, "none")}</strong></div>
            <div><span>Viewed offer</span><strong>${detailText(fields.last_viewed_offer_details, "none")}</strong></div>
          </article>
        </section>
        <section class="account-storyline">
          <h2>Presenter storyline</h2>
          <div class="scenario-grid">
            ${scenarioNotes.map((note) => `<span>${note}</span>`).join("")}
          </div>
        </section>
      </section>
      <aside class="summary-card account-side">
        <h2>Profile API proof</h2>
        <div><span>Destination</span><strong>${destination}</strong></div>
        <div><span>Trip signal</span><strong>${fields.last_interest_trip_type || persona.preferredTripType}</strong></div>
        <div><span>List</span><strong>${fields.last_viewed_item_list_name || "homepage_recommended"}</strong></div>
        <div><span>Value</span><strong>${lifetimeValue}</strong></div>
      </aside>
    </section>
    ${rail("Account recommendations", recommendationRail("account", state), "account_recommendations")}
  `;
}
