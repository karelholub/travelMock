import { personalizedResults, recommendationRail } from "../recommendations/strategies.js";
import { compactDate, money, productTypeLabel } from "../utils/format.js";
import { rail, searchPanel } from "./components.js";

export function searchPage(state) {
  const results = personalizedResults(state.search, state);
  const primaryResults = results.slice(0, 6);
  const spotlight = primaryResults[0];
  return `
    <section class="page-head dense search-head">
      <div>
        <p class="eyebrow">Search results</p>
        <h1>${state.search.destination} trips, sorted by personal relevance</h1>
        <p>${results.length} options for ${Number(state.search.adults || 1) + Number(state.search.children || 0)} travelers, with suspiciously calm recommendations near the top.</p>
      </div>
      <a class="secondary" href="/demo-control" data-link>Switch persona</a>
    </section>
    ${searchPanel(state.search)}
    <section class="search-summary-strip">
      <article><span>Route</span><strong>${state.search.origin || "Prague"} to ${state.search.destination}</strong></article>
      <article><span>Dates</span><strong>${compactDate(state.search.departureDate)} to ${compactDate(state.search.returnDate)}</strong></article>
      <article><span>Travelers</span><strong>${Number(state.search.adults || 1) + Number(state.search.children || 0)} people, ${state.search.cabinClass || "economy"}</strong></article>
    </section>
    <section class="results-shell">
      <aside class="filter-panel">
        <div>
          <span class="eyebrow">Refine</span>
          <h2>Shape the escape</h2>
        </div>
        <div class="filter-group">
          <strong>Trip ingredients</strong>
          ${["flight", "hotel", "package", "transfer", "experience"].map((filter) => `<button class="chip" data-filter="${filter}">${filter}</button>`).join("")}
        </div>
        <div class="filter-group">
          <strong>Mood</strong>
          ${["city", "family", "business", "wellness", "budget"].map((filter) => `<button class="chip" data-filter="${filter}">${filter}</button>`).join("")}
        </div>
        <label>Sort by
          <select data-sort>
            <option>recommended</option>
            <option>price</option>
            <option>shortest flight</option>
            <option>least regret</option>
          </select>
        </label>
        ${spotlight ? `
          <article class="filter-insight">
            <span>Top signal</span>
            <strong>${spotlight.destination}</strong>
            <p>${spotlight.tagline}</p>
          </article>
        ` : ""}
      </aside>
      <div class="results-panel">
        <div class="results-toolbar">
          <div>
            <span class="eyebrow">Best matches</span>
            <strong>${state.search.productCategory || "package"} intent · ${state.search.tripType}</strong>
          </div>
          <span>${results.length} live-ish fares</span>
        </div>
        <section class="results-list">
          ${primaryResults.length ? primaryResults.map((product, index) => resultCard(product, index)).join("") : emptyResults(state)}
        </section>
      </div>
    </section>
    ${rail("Recently viewed", recommendationRail("search", state).slice(0, 4), "search_recent")}
    ${rail("Recommended for you", recommendationRail("search", state), "search_recommended")}
  `;
}

function resultCard(product, index) {
  return `
    <article class="product-card result-card" data-product-id="${product.id}">
      <a class="result-image" href="/product/${product.slug}" data-link>
        <img src="${product.image}" alt="${product.destination} travel view" loading="lazy" />
        ${index === 0 ? "<span>Best match</span>" : ""}
      </a>
      <div class="result-copy">
        <div class="result-title-row">
          <div>
            <span class="eyebrow">${productTypeLabel(product.type)} · ${product.destination}</span>
            <h2>${product.name}</h2>
          </div>
          <strong>${money(product.price)}</strong>
        </div>
        <p>${product.tagline}</p>
        <div class="result-meta">
          <span>${product.duration}</span>
          <span>${product.tripType}</span>
          <span>${Math.round(product.margin * 100)}% margin, quietly beloved</span>
        </div>
        <div class="result-actions">
          <button class="primary" data-add="${product.id}">Add to itinerary</button>
          <button class="secondary" data-watch="${product.id}">Watch price</button>
          <a class="secondary" href="/product/${product.slug}" data-link>View details</a>
        </div>
      </div>
    </article>
  `;
}

function emptyResults(state) {
  return `
    <div class="empty-panel">
      <h2>No perfect matches yet</h2>
      <p>Try ${state.search.destination}, packages, or the courageous “least regret” sort.</p>
      <a class="primary" href="/" data-link>Start from homepage</a>
    </div>
  `;
}
