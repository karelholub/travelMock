import { personalizedResults, recommendationRail } from "../recommendations/strategies.js";
import { money, productTypeLabel } from "../utils/format.js";
import { rail, searchPanel } from "./components.js";
import { personalizationBanner } from "./personalizationBanners.js";

export function searchPage(state) {
  const results = personalizedResults(state.search, state);
  const primaryResults = results.slice(0, 6);
  const resultLabel = `${results.length} ${results.length === 1 ? "option" : "options"}`;
  const categoryLabel = state.search.productCategory && state.search.productCategory !== "all"
    ? state.search.productCategory
    : "all products";
  const travelerCount = Number(state.search.adults || 1) + Number(state.search.children || 0);
  return `
    <section class="page-head dense search-head">
      <div>
        <p class="eyebrow">Search results</p>
        <h1>${state.search.destination} trips, sorted by personal relevance</h1>
        <p>${resultLabel} for ${travelerCount} travelers, with the best itinerary fits first.</p>
      </div>
      <a class="secondary" href="/demo-control" data-link>Switch persona</a>
    </section>
    ${searchPanel(state.search, { variant: "compact" })}
    <section class="results-shell">
      <div class="results-panel">
        <div class="results-toolbar">
          <div>
            <span class="eyebrow">Best matches</span>
            <strong>${categoryLabel} · ${state.search.tripType}</strong>
          </div>
          <div class="search-signal-row" aria-label="Search signals">
            <span class="signal-label">Matched by</span>
            ${productSignals(results, state).map((filter) => `<span class="signal-chip ${filter === state.search.productCategory ? "is-active" : ""}">${filter}</span>`).join("")}
            ${moodSignals(results, state).map((filter) => `<span class="signal-chip ${filter === state.search.tripType ? "is-active" : ""}">${filter}</span>`).join("")}
          </div>
          <span class="result-count">${resultLabel}</span>
        </div>
        <section class="results-list">
          ${primaryResults.length ? primaryResults.map((product, index) => resultCard(product, index, state)).join("") : emptyResults(state)}
        </section>
        ${personalizationBanner("search", state)}
      </div>
    </section>
    ${rail("Recently viewed", recommendationRail("search", state).slice(0, 4), "search_recent")}
    ${rail("Recommended for you", recommendationRail("search", state), "search_recommended")}
  `;
}

function productSignals(results, state) {
  return [...new Set([state.search.productCategory, ...results.map((product) => product.type)].filter((value) => value && value !== "all"))].slice(0, 4);
}

function moodSignals(results, state) {
  return [...new Set([state.search.tripType, ...results.map((product) => product.tripType)].filter(Boolean))].slice(0, 3);
}

function resultCard(product, index, state) {
  const watched = (state.watchedProductIds || []).includes(product.id);
  const saved = (state.savedProductIds || []).includes(product.id);
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
          <span>${matchSignal(product, index)}</span>
        </div>
        <div class="result-actions">
          <button class="primary" type="button" data-add="${product.id}">Add to itinerary</button>
          <a class="secondary" href="/product/${product.slug}" data-link>View details</a>
          <button class="ghost-action save-cta ${saved ? "is-saved" : ""}" type="button" data-save="${product.id}" aria-pressed="${saved ? "true" : "false"}">${saved ? "Saved" : "Save"}</button>
          <button class="ghost-action watch-cta ${watched ? "is-watching" : ""}" type="button" data-watch="${product.id}" aria-pressed="${watched ? "true" : "false"}">${watched ? "Watching" : "Watch price"}</button>
        </div>
      </div>
    </article>
  `;
}

function matchSignal(product, index) {
  if (index === 0) return "Best itinerary fit";
  if (["transfer", "experience", "add_on", "insurance"].includes(product.type)) return "Smart add-on";
  if (product.tripType === "family") return "Family friendly";
  if (product.tripType === "business") return "Business ready";
  return "Good bundle fit";
}

function emptyResults(state) {
  return `
    <div class="empty-panel">
      <h2>No perfect matches yet</h2>
      <p>Try all products, change the destination, or reset the trip mood for a wider set of offers.</p>
      <a class="primary" href="/" data-link>Start from homepage</a>
    </div>
  `;
}
