import { personas } from "../data/personas.js";

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
    </section>
  `;
}
