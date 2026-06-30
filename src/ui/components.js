import { money, productTypeLabel } from "../utils/format.js";

export function image(product, className = "card-image") {
  return `<img class="${className}" src="${product.image}" alt="${product.destination} travel view" loading="lazy" />`;
}

export function productCard(product, options = {}) {
  const cta = options.cta || "Add";
  const secondary = options.secondary || "Details";
  return `
    <article class="product-card" data-product-id="${product.id}">
      <a href="/product/${product.slug}" data-link>${image(product)}</a>
      <div class="product-body">
        <div class="eyebrow">${productTypeLabel(product.type)} · ${product.destination}</div>
        <h3>${product.name}</h3>
        <p>${product.tagline}</p>
        <div class="card-meta">
          <span>${product.duration}</span>
          <strong>${money(product.price)}</strong>
        </div>
        <div class="card-actions">
          <button class="primary small" data-add="${product.id}">${cta}</button>
          <a class="secondary small" href="/product/${product.slug}" data-link>${secondary}</a>
        </div>
      </div>
    </article>
  `;
}

export function rail(title, products, listName, empty = "Recommendations are recalculating.") {
  return `
    <section class="rail" data-rail="${listName}">
      <div class="section-heading">
        <h2>${title}</h2>
        <span>${products.length ? `${products.length} tailored ideas` : empty}</span>
      </div>
      <div class="rail-grid">
        ${products.map((product) => productCard(product, { cta: "Add to itinerary" })).join("")}
      </div>
    </section>
  `;
}

export function searchPanel(search) {
  return `
    <form class="search-panel" data-search-form>
      <label>Destination
        <select name="destination">
          ${["Lisbon", "Mallorca", "Zurich", "Kyoto", "Reykjavik"].map((city) => `<option ${city === search.destination ? "selected" : ""}>${city}</option>`).join("")}
        </select>
      </label>
      <label>Departure
        <input name="departureDate" type="date" value="${search.departureDate}" />
      </label>
      <label>Return
        <input name="returnDate" type="date" value="${search.returnDate}" />
      </label>
      <label>Travelers
        <input name="travelers" type="number" min="1" max="8" value="${search.travelers}" />
      </label>
      <label>Trip type
        <select name="tripType">
          ${["city", "family", "business", "culture", "wellness", "leisure"].map((type) => `<option value="${type}" ${type === search.tripType ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </label>
      <button class="primary" type="submit">Search trips</button>
    </form>
  `;
}

export function profileProof(profile) {
  const fields = profile?.fields || {};
  return `
    <div class="profile-proof">
      <span>Profile API</span>
      <strong>${fields.next_trip_destination || "Lisbon"}</strong>
      <span>${fields.next_departure_date || "2026-09-12"}</span>
      <span>${fields.loyalty_tier || "Guest"}</span>
    </div>
  `;
}
