import { featuredDestinationIds } from "../catalog/products.js";
import { findProductsByIds } from "../catalog/lookups.js";
import { personas } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money } from "../utils/format.js";
import { profileProof, productCard, rail, searchPanel } from "./components.js";
import { personalizationBanner } from "./personalizationBanners.js";

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
        <div class="hero-kicker">
          <span>Elsewhere Travel Co.</span>
          <strong>${persona.loyaltyTier}</strong>
        </div>
        <h1>${persona.hero}</h1>
        <p>Flights, hotels, packages, transfers, and excursions in one booking flow, while the CDP quietly connects intent, consent, identity, and mildly ambitious vacation feelings.</p>
        ${searchPanel(state.search)}
        <div class="hero-metrics" aria-label="Demo capabilities">
          <div><span>Intent</span><strong>${persona.preferredDestination}</strong></div>
          <div><span>Traveler mode</span><strong>${persona.travelerKind}</strong></div>
          <div><span>Ready rails</span><strong>9 strategies</strong></div>
        </div>
        <div class="hero-deals">
          ${heroProducts.slice(0, 3).map((product) => `
            <a href="/product/${product.slug}" data-link>
              <span>${product.destination}</span>
              <strong>${money(product.price)}</strong>
              <small>${product.duration} · ${product.tripType}</small>
            </a>
          `).join("")}
        </div>
      </div>
      ${profileProof(state.profile)}
    </section>
    ${personalizationBanner("home", state)}
    <section class="destination-band">
      <div class="section-heading">
        <h2>Popular ways to leave responsibly</h2>
        <span>Image-led offers with CDP-ready intent signals</span>
      </div>
      <div class="destination-grid">
        ${heroProducts.map((product) => `
          <a class="destination-tile" href="/product/${product.slug}" data-link>
            <img src="${product.image}" alt="${product.destination} trip preview" loading="lazy" />
            <span>${product.type}</span>
            <strong>${product.destination}</strong>
            <small>${product.tagline}</small>
          </a>
        `).join("")}
      </div>
    </section>
    ${rail("Featured trip starters", heroProducts, "homepage_featured")}
    ${rail("Recommended for this profile", recs, "homepage_recommended")}
    ${rail("Recently viewed", recs.slice(0, 4), "homepage_recent")}
  `;
}
