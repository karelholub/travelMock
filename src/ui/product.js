import { findProductByIdOrSlug } from "../catalog/lookups.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money, productTypeLabel } from "../utils/format.js";
import { profileProof, rail } from "./components.js";

export function productPage(state, slug) {
  const product = findProductByIdOrSlug(slug);
  if (!product) {
    return `<section class="empty-panel"><h1>Trip not found</h1><a class="primary" href="/search" data-link>Back to search</a></section>`;
  }
  const recs = recommendationRail("product", state, { currentProduct: product });
  return `
    <section class="product-detail">
      <div class="detail-image"><img src="${product.image}" alt="${product.destination} travel product" /></div>
      <div class="detail-copy">
        <p class="eyebrow">${productTypeLabel(product.type)} · ${product.destination}</p>
        <h1>${product.name}</h1>
        <p>${product.tagline}</p>
        <strong class="price">${money(product.price)}</strong>
        <ul class="detail-list">
          ${product.details.map((detail) => `<li>${detail}</li>`).join("")}
        </ul>
        ${profileProof(state.profile)}
        <div class="banner">Because you looked at ${product.destination} twice, the algorithm has become quietly invested.</div>
        <button class="primary" data-add="${product.id}">Add to itinerary</button>
      </div>
    </section>
    ${rail("Complete the trip", recs, "product_cross_sell")}
  `;
}
