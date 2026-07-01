import { personas } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money, productTypeLabel } from "../utils/format.js";
import { productCard, rail } from "./components.js";
import { personalizationBanner } from "./personalizationBanners.js";

export function itineraryPage(state, summary) {
  if (!summary.enriched.length) return emptyItinerary(state);
  const cartProducts = summary.enriched.map((item) => item.product);
  const recs = recommendationRail("cart", state, { cartProducts });
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Itinerary</p>
        <h1>Your booking is taking shape</h1>
      </div>
      <a class="primary" href="/checkout" data-link>Checkout</a>
    </section>
    ${personalizationBanner("itinerary", state)}
    <section class="cart-layout">
      <div class="cart-items itinerary-timeline">
        ${summary.enriched.map((item, index) => `
          <article class="cart-row timeline-row">
            <span class="timeline-step">${index + 1}</span>
            <img src="${item.product.image}" alt="${item.product.destination} thumbnail" />
            <div>
              <span class="eyebrow">${productTypeLabel(item.product.type)} · ${item.product.destination}</span>
              <h3>${item.product.name}</h3>
              <p>${item.product.tagline}</p>
              <div class="result-meta">
                <span>${item.product.duration}</span>
                <span>${item.product.tripType}</span>
                <span>${item.quantity} traveler-ready item</span>
              </div>
            </div>
            <strong>${money(item.lineTotal)}</strong>
            <button class="icon-button" data-remove="${item.product.id}" aria-label="Remove ${item.product.name}">×</button>
          </article>
        `).join("")}
        <div class="banner">${missingComponentAdvice(cartProducts)}</div>
      </div>
      <aside class="summary-card booking-summary">
        <h2>Price breakdown</h2>
        <p>Your itinerary is now coherent enough to show finance, but not so coherent that anyone suspects a committee.</p>
        <div><span>Items</span><strong>${summary.count}</strong></div>
        <div><span>Fees we named politely</span><strong>${money(29)}</strong></div>
        <div class="total"><span>Total</span><strong>${money(summary.total + 29)}</strong></div>
        <a class="primary full" href="/checkout" data-link>Continue booking</a>
        <a class="secondary full" href="/search" data-link>Add another piece</a>
      </aside>
    </section>
    ${rail("Useful add-ons", recs, "cart_recommendations")}
  `;
}

function emptyItinerary(state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const recs = recommendationRail("cart", state);
  return `
    <section class="empty-itinerary">
      <div>
        <p class="eyebrow">Recovery surface</p>
        <h1>Your itinerary is empty, but the CDP remembers the plot.</h1>
        <p>Last intent: ${persona.preferredDestination}. Profile signals suggest ${persona.preferredTripType} travel, ${persona.loyaltyTier}, and a high probability of wanting someone to handle airport logistics.</p>
        <div class="hero-actions">
          <a class="primary" href="/search" data-link>Search ${persona.preferredDestination}</a>
          <button class="secondary" data-restore-cart>Restore recommended trip</button>
        </div>
      </div>
      <div class="rail-grid compact">
        ${recs.slice(0, 3).map((product) => productCard(product, { cta: "Add" })).join("")}
      </div>
    </section>
    ${personalizationBanner("itinerary", state)}
    ${rail("Trip starters", recs, "cart_empty_recovery")}
  `;
}

function missingComponentAdvice(products) {
  const types = new Set(products.map((product) => product.type));
  if (types.has("flight") && !types.has("hotel")) return "You have a flight but no hotel. Bold, but benches are rarely queen-sized.";
  if (types.has("hotel") && !types.has("transfer")) return "You have a hotel but no transfer. The taxi queue has entered the chat.";
  if (!types.has("insurance")) return "You booked travel but still believe luggage is optional. Consider insurance.";
  return "Nice coverage. The itinerary has achieved operational dignity.";
}
