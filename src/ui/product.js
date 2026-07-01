import { findProductByIdOrSlug } from "../catalog/lookups.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money, productTypeLabel } from "../utils/format.js";
import { profileProof, rail } from "./components.js";
import { personalizationBanner } from "./personalizationBanners.js";

export function productPage(state, slug) {
  const product = findProductByIdOrSlug(slug);
  if (!product) {
    return `<section class="empty-panel"><h1>Trip not found</h1><a class="primary" href="/search" data-link>Back to search</a></section>`;
  }
  const recs = recommendationRail("product", state, { currentProduct: product });
  const watched = (state.watchedProductIds || []).includes(product.id);
  const saved = (state.savedProductIds || []).includes(product.id);
  return `
    <section class="offer-hero">
      <div class="offer-gallery">
        <img src="${product.image}" alt="${product.destination} travel product" />
        <div class="offer-badges">
          <span>${productTypeLabel(product.type)}</span>
          <span>${product.duration}</span>
          <span>${product.tripType}</span>
        </div>
      </div>
      <aside class="offer-booking-card">
        <p class="eyebrow">${productTypeLabel(product.type)} · ${product.destination}</p>
        <h1>${product.name}</h1>
        <p>${product.tagline}</p>
        <div class="offer-price">
          <span>From</span>
          <strong>${money(product.price)}</strong>
        </div>
        <button class="primary full" type="button" data-add="${product.id}">Add to itinerary</button>
        <button class="secondary full save-cta ${saved ? "is-saved" : ""}" type="button" data-save="${product.id}" aria-pressed="${saved ? "true" : "false"}">${saved ? "Saved to wishlist" : "Save to wishlist"}</button>
        <button class="secondary full watch-cta ${watched ? "is-watching" : ""}" type="button" data-watch="${product.id}" aria-pressed="${watched ? "true" : "false"}">${watched ? "Watching this price" : "Watch price"}</button>
        <div class="banner">Because you looked at ${product.destination} twice, the algorithm has become quietly invested.</div>
      </aside>
    </section>
    ${personalizationBanner("product", state, { product })}
    <section class="offer-detail-grid">
      <article class="offer-panel">
        <span class="eyebrow">Included</span>
        <h2>What you are actually buying</h2>
        <ul class="detail-list">
          ${product.details.map((detail) => `<li>${detail}</li>`).join("")}
        </ul>
      </article>
      <article class="offer-panel">
        <span class="eyebrow">Why this match</span>
        <h2>Personalization proof</h2>
        <p>This offer fits ${product.destination} intent, ${product.tripType} mood, and a detected willingness to believe travel can improve a Tuesday.</p>
        ${profileProof(state.profile)}
      </article>
      <article class="offer-panel">
        <span class="eyebrow">Booking confidence</span>
        <h2>Useful facts</h2>
        <div class="offer-facts">
          <div><span>Margin</span><strong>${Math.round(product.margin * 100)}%</strong></div>
          <div><span>Destination</span><strong>${product.destination}</strong></div>
          <div><span>Product type</span><strong>${productTypeLabel(product.type)}</strong></div>
        </div>
      </article>
    </section>
    ${rail("Complete the trip", recs, "product_cross_sell")}
  `;
}
