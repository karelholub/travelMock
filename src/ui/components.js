import { money, productTypeLabel } from "../utils/format.js";
import { detailDestination, detailListName } from "../utils/profileDisplay.js";

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
  const productCategory = search.productCategory || "package";
  const tabs = [
    ["flight", "Flights"],
    ["hotel", "Hotels"],
    ["package", "Packages"],
    ["transfer", "Transfers"],
    ["experience", "Experiences"]
  ];
  return `
    <form class="search-panel" data-search-form>
      <div class="search-tabs" aria-label="Booking type">
        ${tabs.map(([value, label]) => `
          <label class="search-tab ${value === productCategory ? "is-active" : ""}">
            <input type="radio" name="productCategory" value="${value}" ${value === productCategory ? "checked" : ""} />
            <span>${label}</span>
          </label>
        `).join("")}
      </div>
      <div class="search-fields">
        <label class="field-shell field-route">From
          <select name="origin">
            ${["Prague", "Vienna", "Berlin", "London", "Amsterdam"].map((city) => `<option ${city === (search.origin || "Prague") ? "selected" : ""}>${city}</option>`).join("")}
          </select>
        </label>
        <label class="field-shell field-route">To
          <select name="destination">
            ${["Lisbon", "Mallorca", "Zurich", "Kyoto", "Reykjavik"].map((city) => `<option ${city === search.destination ? "selected" : ""}>${city}</option>`).join("")}
          </select>
        </label>
        <label class="field-shell">Depart
          <input name="departureDate" type="date" value="${search.departureDate}" />
        </label>
        <label class="field-shell">Return
          <input name="returnDate" type="date" value="${search.returnDate}" />
        </label>
        <label class="field-shell">Adults
          <input name="adults" type="number" min="1" max="8" value="${search.adults || search.travelers || 1}" />
        </label>
        <label class="field-shell">Children
          <input name="children" type="number" min="0" max="6" value="${childCount}" />
        </label>
        <label class="field-shell">Trip mood
          <select name="tripType">
            ${["city", "family", "business", "culture", "wellness", "leisure"].map((type) => `<option value="${type}" ${type === search.tripType ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </label>
        <label class="field-shell">Cabin
          <select name="cabinClass">
            ${["economy", "premium_economy", "business"].map((type) => `<option value="${type}" ${type === (search.cabinClass || "economy") ? "selected" : ""}>${type.replace("_", " ")}</option>`).join("")}
          </select>
        </label>
        <button class="primary search-submit" type="submit">Search trips</button>
      </div>
      <div class="child-age-fields ${childCount > 0 ? "" : "is-hidden"}" data-child-age-fields>
        ${Array.from({ length: childCount }, (_, index) => `
          <label>Child ${index + 1} age
            <input name="childAge${index + 1}" type="number" min="0" max="17" value="${childAges[index] ?? ""}" />
          </label>
        `).join("")}
      </div>
      <div class="search-footnote">
        <span>No popups, no judgment, just suspiciously relevant offers.</span>
        <strong>${Number(search.adults || search.travelers || 1) + childCount} travelers</strong>
      </div>
    </form>
  `;
}

export function profileProof(profile) {
  const fields = profile?.fields || {};
  const destination = detailDestination(
    fields.next_trip_destination,
    fields.last_purchased_item_destination,
    fields.last_search_details,
    fields.last_search_performed_details,
    fields.last_viewed_destination_details,
    fields.abandoned_booking
  )
    || "Lisbon";
  return `
    <div class="profile-proof">
      <span>Profile API</span>
      <strong>${fields.first_name ? `${fields.first_name}'s ` : ""}${destination}</strong>
      <span>${detailListName(fields.last_viewed_item_list_name || fields.next_departure_date)}</span>
      <span>${fields.loyalty_tier || "Guest"}</span>
    </div>
  `;
}
