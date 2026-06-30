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
          <button class="secondary small" data-watch="${product.id}">Watch price</button>
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
  const childCount = Math.max(0, Number(search.children || 0));
  const childAges = Array.isArray(search.childAges) ? search.childAges : [];
  return `
    <form class="search-panel" data-search-form>
      <label>Origin
        <select name="origin">
          ${["Prague", "Vienna", "Berlin", "London", "Amsterdam"].map((city) => `<option ${city === (search.origin || "Prague") ? "selected" : ""}>${city}</option>`).join("")}
        </select>
      </label>
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
      <label>Adults
        <input name="adults" type="number" min="1" max="8" value="${search.adults || search.travelers || 1}" />
      </label>
      <label>Children
        <input name="children" type="number" min="0" max="6" value="${childCount}" />
      </label>
      <label>Trip type
        <select name="tripType">
          ${["city", "family", "business", "culture", "wellness", "leisure"].map((type) => `<option value="${type}" ${type === search.tripType ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </label>
      <label>Cabin
        <select name="cabinClass">
          ${["economy", "premium_economy", "business"].map((type) => `<option value="${type}" ${type === (search.cabinClass || "economy") ? "selected" : ""}>${type.replace("_", " ")}</option>`).join("")}
        </select>
      </label>
      <div class="child-age-fields ${childCount > 0 ? "" : "is-hidden"}" data-child-age-fields>
        ${Array.from({ length: childCount }, (_, index) => `
          <label>Child ${index + 1} age
            <input name="childAge${index + 1}" type="number" min="0" max="17" value="${childAges[index] ?? ""}" />
          </label>
        `).join("")}
      </div>
      <button class="primary" type="submit">Search trips</button>
    </form>
  `;
}

export function profileProof(profile) {
  const fields = profile?.fields || {};
  return `
    <div class="profile-proof">
      <span>Profile API</span>
      <strong>${fields.first_name ? `${fields.first_name}'s ` : ""}${fields.next_trip_destination || fields.last_purchased_item_destination || "Lisbon"}</strong>
      <span>${fields.last_viewed_item_list_name || fields.next_departure_date || "homepage_recommended"}</span>
      <span>${fields.loyalty_tier || "Guest"}</span>
    </div>
  `;
}
