import { personalizedResults, recommendationRail } from "../recommendations/strategies.js";
import { productCard, rail, searchPanel } from "./components.js";

export function searchPage(state) {
  const results = personalizedResults(state.search, state);
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Search results</p>
        <h1>${state.search.destination} trips, sorted by personal relevance</h1>
      </div>
      <a class="secondary" href="/demo-control" data-link>Switch persona</a>
    </section>
    ${searchPanel(state.search)}
    <section class="filters">
      ${["flight", "hotel", "package", "beach", "city", "family", "business", "wellness", "budget"].map((filter) => `<button class="chip" data-filter="${filter}">${filter}</button>`).join("")}
      <select data-sort>
        <option>recommended</option>
        <option>price</option>
        <option>shortest flight</option>
        <option>least regret</option>
      </select>
    </section>
    <section class="results-grid">
      ${results.length ? results.map((product) => productCard(product, { cta: "Add" })).join("") : emptyResults(state)}
    </section>
    ${rail("Recently viewed", recommendationRail("search", state).slice(0, 4), "search_recent")}
    ${rail("Recommended for you", recommendationRail("search", state), "search_recommended")}
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
