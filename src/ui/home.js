import { featuredDestinationIds } from "../catalog/products.js";
import { findProductsByIds } from "../catalog/lookups.js";
import { personas } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { profileProof, productCard, rail, searchPanel } from "./components.js";

export function homePage(state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const heroProducts = findProductsByIds(featuredDestinationIds);
  const recs = recommendationRail("homepage", state);
  return `
    <section class="hero">
      <div class="hero-media">
        <img src="${heroProducts[0].image}" alt="Lisbon rooftops and travel destination" />
      </div>
      <div class="hero-content">
        <div class="hero-topline">Elsewhere Travel Co.</div>
        <h1>${persona.hero}</h1>
        <p>Book flights, hotels, packages, transfers, and excursions while the CDP quietly connects intent, consent, identity, and mildly ambitious vacation feelings.</p>
        ${searchPanel(state.search)}
        <div class="hero-actions">
          <a class="secondary" href="/demo-control" data-link>Open demo control</a>
          <a class="ghost" href="/itinerary" data-link>View itinerary</a>
        </div>
      </div>
      ${profileProof(state.profile)}
    </section>
    <section class="trust-strip">
      <span>Consent-aware tracking</span>
      <span>Profile API hydration</span>
      <span>Cart abandonment recovery</span>
      <span>VIP and family personalization</span>
    </section>
    ${rail("Featured trip starters", heroProducts, "homepage_featured")}
    ${rail("Recommended for this profile", recs, "homepage_recommended")}
    ${rail("Recently viewed", recommendationRail("homepage", state).slice(0, 4), "homepage_recent")}
  `;
}
