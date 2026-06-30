import { personas, scenarioNotes } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { rail } from "./components.js";

export function accountPage(state) {
  const persona = personas[state.personaId] || personas.anonymous;
  return `
    <section class="account-layout">
      <aside class="summary-card">
        <p class="eyebrow">Account</p>
        <h1>${persona.label}</h1>
        <div><span>Loyalty</span><strong>${state.profile?.fields?.loyalty_tier || persona.loyaltyTier}</strong></div>
        <div><span>Destination affinity</span><strong>${state.profile?.fields?.next_trip_destination || persona.preferredDestination}</strong></div>
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
