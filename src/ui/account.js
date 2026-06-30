import { personas, scenarioNotes } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money } from "../utils/format.js";
import { detailText } from "../utils/profileDisplay.js";
import { rail } from "./components.js";

export function accountPage(state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const fields = state.profile?.fields || {};
  return `
    <section class="account-layout">
      <aside class="summary-card">
        <p class="eyebrow">Account</p>
        <h1>${fields.first_name || persona.label}</h1>
        <div><span>Email</span><strong>${fields.email || state.booking?.email || "Unknown until checkout"}</strong></div>
        <div><span>Loyalty</span><strong>${fields.loyalty_tier || persona.loyaltyTier}</strong></div>
        <div><span>Last purchased destination</span><strong>${fields.last_purchased_item_destination || fields.next_trip_destination || persona.preferredDestination}</strong></div>
        <div><span>Last search</span><strong>${detailText(fields.last_search_details || fields.last_search_performed_details, persona.preferredDestination)}</strong></div>
        <div><span>Abandoned booking</span><strong>${detailText(fields.abandoned_booking, "none")}</strong></div>
        <div><span>Last viewed list</span><strong>${fields.last_viewed_item_list_name || "homepage_recommended"}</strong></div>
        <div><span>Last wishlist item</span><strong>${detailText(fields.last_wishlist_item_added, "none")}</strong></div>
        <div><span>Lifetime value</span><strong>${money(Number(fields.total_lifetime_purchase_value || fields.booking_value || 0))}</strong></div>
        <div><span>Traveler type</span><strong>${persona.travelerKind}</strong></div>
      </aside>
      <section>
        <h2>Presenter storyline</h2>
        <div class="scenario-grid">
          ${scenarioNotes.map((note) => `<span>${note}</span>`).join("")}
        </div>
      </section>
    </section>
    ${rail("Account recommendations", recommendationRail("account", state), "account_recommendations")}
  `;
}
