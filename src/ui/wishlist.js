import { findProductsByIds } from "../catalog/lookups.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money, productTypeLabel } from "../utils/format.js";
import { productCard, rail } from "./components.js";
import { personalizationBanner } from "./personalizationBanners.js";

export function wishlistPage(state) {
  const savedProducts = findProductsByIds(state.savedProductIds || []);
  const recs = recommendationRail("search", state);
  if (!savedProducts.length) return emptyWishlist(state, recs);

  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Wishlist</p>
        <h1>Saved trips with unfinished business</h1>
        <p>${savedProducts.length} saved idea${savedProducts.length === 1 ? "" : "s"} ready for comparison, cart recovery, and suspiciously useful follow-up.</p>
      </div>
      <a class="primary" href="/search" data-link>Find more trips</a>
    </section>
    ${personalizationBanner("wishlist", state)}
    <section class="wishlist-layout">
      <div class="wishlist-list">
        ${savedProducts.map((product) => `
          <article class="wishlist-row" data-product-id="${product.id}">
            <a href="/product/${product.slug}" data-link>
              <img src="${product.image}" alt="${product.destination} saved trip" loading="lazy" />
            </a>
            <div>
              <span class="eyebrow">${productTypeLabel(product.type)} · ${product.destination}</span>
              <h2>${product.name}</h2>
              <p>${product.tagline}</p>
              <div class="result-meta">
                <span>${product.duration}</span>
                <span>${product.tripType}</span>
                <span>${Math.round(product.margin * 100)}% margin</span>
              </div>
            </div>
            <strong>${money(product.price)}</strong>
            <div class="wishlist-actions">
              <button class="primary small" type="button" data-add="${product.id}">Add</button>
              <a class="secondary small" href="/product/${product.slug}" data-link>Details</a>
              <button class="secondary small" type="button" data-remove-wishlist="${product.id}">Remove</button>
            </div>
          </article>
        `).join("")}
      </div>
      <aside class="summary-card wishlist-summary">
        <h2>Wishlist signal</h2>
        <p>Saved products are high-intent without the emotional commitment of checkout. Excellent demo territory.</p>
        <div><span>Saved ideas</span><strong>${savedProducts.length}</strong></div>
        <div><span>Top destination</span><strong>${topDestination(savedProducts)}</strong></div>
        <div><span>Total possible value</span><strong>${money(savedProducts.reduce((sum, product) => sum + product.price, 0))}</strong></div>
        <a class="primary full" href="/itinerary" data-link>View itinerary</a>
      </aside>
    </section>
    ${rail("Because you saved these", recs, "wishlist_recommendations")}
  `;
}

function emptyWishlist(state, recs) {
  return `
    <section class="empty-itinerary wishlist-empty">
      <div>
        <p class="eyebrow">Wishlist</p>
        <h1>No saved trips yet. A little commitment issue, beautifully trackable.</h1>
        <p>Save a flight, hotel, package, transfer, or excursion to create wishlist intent for Meiro CDP journeys.</p>
        <div class="hero-actions">
          <a class="primary" href="/search" data-link>Search ${state.search.destination}</a>
          <a class="secondary" href="/account" data-link>View profile signals</a>
        </div>
      </div>
      <div class="rail-grid compact">
        ${recs.slice(0, 3).map((product) => productCard(product, { cta: "Add" })).join("")}
      </div>
    </section>
    ${personalizationBanner("wishlist", state)}
    ${rail("Save-worthy ideas", recs, "wishlist_empty_recovery")}
  `;
}

function topDestination(products) {
  const counts = products.reduce((map, product) => map.set(product.destination, (map.get(product.destination) || 0) + 1), new Map());
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "pending";
}
