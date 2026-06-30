import { hydrateProfile } from "./api/profileClient.js";
import { findProductById } from "./catalog/lookups.js";
import { personas } from "./data/personas.js";
import { addToCart, cartSummary, clearCart, rememberProduct, removeFromCart, setPersona, state, subscribe, updateState } from "./state/store.js";
import { configureTracking, identifyUser, setConsent, setSharedContext, trackEvent, trackPageView } from "./tracking/index.js";
import { trackingCartPayload, trackingItem } from "./tracking/schema.js";
import { accountPage } from "./ui/account.js";
import { buildPurchasePayload, checkoutPage } from "./ui/checkout.js";
import { demoControlPage } from "./ui/demoControl.js";
import { homePage } from "./ui/home.js";
import { itineraryPage } from "./ui/itinerary.js";
import { productPage } from "./ui/product.js";
import { searchPage } from "./ui/search.js";
import { thankYouPage } from "./ui/thankYou.js";

const app = document.querySelector("#app");
const routes = ["/", "/search", "/product", "/itinerary", "/checkout", "/thank-you", "/account", "/demo-control"];

configureTracking({
  sharedContext: {
    route_count: routes.length,
    demo: "travel-cdp-personalization"
  }
});

window.addEventListener("demo:tracking", (event) => {
  const entry = { name: event.detail.name, at: new Date().toLocaleTimeString() };
  state.trackingLog = [...(state.trackingLog || []), entry].slice(-30);
  localStorage.setItem("elsewhere-state", JSON.stringify(state));
});

async function boot() {
  if (!state.profile) {
    const profile = await hydrateProfile(state.personaId);
    updateState({ profile });
  }
  render();
}

subscribe(render);
boot();

function render() {
  const summary = cartSummary();
  const path = location.pathname;
  app.innerHTML = layout(routeView(path, summary), summary);
  wireEvents(summary);
  trackPageView({ route: path, persona: state.personaId });

  if (path === "/search") {
    trackEvent("view_search_results", {
      destination: state.search.destination,
      result_count: document.querySelectorAll(".product-card").length,
      items: [...document.querySelectorAll(".product-card")].map((card) => card.dataset.productId)
    });
    trackEvent("view_item_list", { list_name: "search_results", items: [...document.querySelectorAll(".product-card")].map((card) => card.dataset.productId) });
  }

  if (path.startsWith("/product/")) {
    const product = findProductById(document.querySelector("[data-add]")?.dataset.add);
    if (product) {
      rememberProduct(product.id);
      trackEvent("view_item", trackingItem(product));
    }
  }

  if (path === "/itinerary") {
    trackEvent("view_cart", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }));
  }
}

function routeView(path, summary) {
  if (path === "/") return homePage(state);
  if (path === "/search") return searchPage(state);
  if (path.startsWith("/product/")) return productPage(state, decodeURIComponent(path.split("/").pop()));
  if (path === "/itinerary") return itineraryPage(state, summary);
  if (path === "/checkout") return checkoutPage(state, summary);
  if (path === "/thank-you") return thankYouPage(state);
  if (path === "/account") return accountPage(state);
  if (path === "/demo-control") return demoControlPage(state);
  return `<section class="empty-panel"><h1>Route not found</h1><a class="primary" href="/" data-link>Go home</a></section>`;
}

function layout(content, summary) {
  return `
    <header class="site-header">
      <a class="brand" href="/" data-link><span>ET</span> Elsewhere Travel Co.</a>
      <nav>
        <a href="/search" data-link>Search</a>
        <a href="/itinerary" data-link>Itinerary (${summary.count})</a>
        <a href="/account" data-link>Account</a>
        <a href="/demo-control" data-link>Demo</a>
      </nav>
    </header>
    <main>${content}</main>
  `;
}

function wireEvents(summary) {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      history.pushState({}, "", link.getAttribute("href"));
      render();
    });
  });

  document.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = findProductById(button.dataset.add);
      if (!product) return;
      addToCart(product.id);
      const next = cartSummary();
      trackEvent("add_to_cart", {
        ...trackingItem(product),
        ...trackingCartPayload(next.enriched, { total: next.total, count: next.count })
      });
    });
  });

  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = findProductById(button.dataset.remove);
      removeFromCart(button.dataset.remove);
      const next = cartSummary();
      if (product) {
        trackEvent("remove_from_cart", {
          ...trackingItem(product),
          ...trackingCartPayload(next.enriched, { total: next.total, count: next.count })
        });
      }
    });
  });

  document.querySelector("[data-search-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    updateState({ search: { ...state.search, ...data, travelers: Number(data.travelers || 1) } });
    trackEvent("search", {
      destination: state.search.destination,
      departure_date: state.search.departureDate,
      return_date: state.search.returnDate,
      traveler_count: state.search.travelers,
      trip_type: state.search.tripType
    });
    history.pushState({}, "", "/search");
    render();
  });

  document.querySelector("[data-checkout-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = buildPurchasePayload(event.currentTarget, state, summary);
    trackEvent("begin_checkout", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }));
    trackEvent("add_shipping_info", payload);
    trackEvent("add_payment_info", payload);
    trackEvent("purchase", payload);
    identifyUser({
      email: payload.email,
      phone: payload.phone,
      firstName: payload.first_name,
      surname: payload.surname,
      loyaltyTier: payload.loyalty_tier
    });
    updateState({ booking: payload });
    clearCart();
    history.pushState({}, "", "/thank-you");
    render();
  });

  document.querySelector("[data-restore-cart]")?.addEventListener("click", () => {
    const persona = personas[state.personaId] || personas.anonymous;
    persona.cartRestoreIds.forEach((id) => addToCart(id));
  });

  document.querySelectorAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", async () => {
      const profile = await hydrateProfile(button.dataset.persona);
      setPersona(button.dataset.persona, profile);
      setSharedContext({ persona: button.dataset.persona, loyalty_tier: profile.fields.loyalty_tier });
      trackEvent("select_item", { item_id: button.dataset.persona, item_name: personas[button.dataset.persona].label, item_type: "persona", list_name: "demo_control" });
    });
  });

  document.querySelectorAll("[data-consent]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const consent = {};
      document.querySelectorAll("[data-consent]").forEach((item) => {
        consent[item.dataset.consent] = item.checked;
      });
      setConsent(consent);
    });
  });
}

window.addEventListener("popstate", render);
