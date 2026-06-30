import { hydrateProfile } from "./api/profileClient.js";
import { findProductById } from "./catalog/lookups.js";
import { personas } from "./data/personas.js";
import { addToCart, cartSummary, clearCart, rememberProduct, removeFromCart, setPersona, state, subscribe, updateState } from "./state/store.js";
import { configureTracking, identifyUser, setConsent, setSharedContext, trackEvent, trackPageView } from "./tracking/index.js";
import { trackingCartPayload, trackingItem, trackingLifecyclePayload, trackingSearchPayload, trackingWishlistPayload } from "./tracking/schema.js";
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

function profileIdentity() {
  return state.booking
    ? {
        email: state.booking.email,
        phone: state.booking.phone,
        firstName: state.booking.first_name
      }
    : {};
}

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
    const profile = await hydrateProfile(state.personaId, profileIdentity());
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
    const resultProducts = [...document.querySelectorAll(".product-card")]
      .map((card) => findProductById(card.dataset.productId))
      .filter(Boolean);
    trackEvent("view_search_results", {
      ...trackingSearchPayload(state.search),
      result_count: resultProducts.length,
      items: resultProducts.map((product) => trackingItem(product, 1, state.search))
    });
    trackEvent("view_item_list", { list_name: "search_results", items: resultProducts.map((product) => trackingItem(product, 1, state.search)) });
  }

  if (path.startsWith("/product/")) {
    const product = findProductById(document.querySelector("[data-add]")?.dataset.add);
    if (product) {
      rememberProduct(product.id);
      trackEvent("view_item", trackingItem(product, 1, state.search));
    }
  }

  if (path === "/itinerary") {
    trackEvent("view_cart", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, state.search));
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
      <a class="brand" href="/" data-link>
        <img src="/assets/logo-mark.svg" alt="" />
        <span>Elsewhere Travel Co.</span>
      </a>
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
      const href = link.getAttribute("href");
      if (href === "/checkout" && summary.enriched.length) {
        state.checkoutDraft = state.checkoutDraft || {
          bookingId: `ELSE-${Math.floor(100000 + Math.random() * 899999)}`,
          startedAt: new Date().toISOString()
        };
        localStorage.setItem("elsewhere-state", JSON.stringify(state));
        trackEvent("begin_checkout", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, {
          ...state.search,
          bookingId: state.checkoutDraft.bookingId,
          playbookEvent: "booking_started"
        }));
      }
      history.pushState({}, "", href);
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
        ...trackingItem(product, 1, state.search),
        ancillary_type: ["transfer", "experience", "insurance", "add_on"].includes(product.type) ? product.type : undefined,
        ...trackingCartPayload(next.enriched, { total: next.total, count: next.count }, {
          ...state.search,
          playbookEvent: ["transfer", "experience", "insurance", "add_on"].includes(product.type) ? "ancillary_added" : undefined
        })
      });
    });
  });

  document.querySelectorAll("[data-watch]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = findProductById(button.dataset.watch);
      if (!product) return;
      trackEvent("add_to_wishlist", trackingWishlistPayload(product, state.search));
    });
  });

  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = findProductById(button.dataset.remove);
      removeFromCart(button.dataset.remove);
      const next = cartSummary();
      if (product) {
        trackEvent("remove_from_cart", {
          ...trackingItem(product, 1, state.search),
          ...trackingCartPayload(next.enriched, { total: next.total, count: next.count }, state.search)
        });
      }
    });
  });

  document.querySelector("[data-search-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const adults = Math.max(1, Number(data.adults || 1));
    const children = Math.max(0, Number(data.children || 0));
    const childAges = Array.from({ length: children }, (_, index) => Number(data[`childAge${index + 1}`]))
      .filter((age) => Number.isFinite(age) && age >= 0);
    updateState({
      search: {
        ...state.search,
        ...data,
        adults,
        children,
        childAges,
        travelers: adults + children
      }
    });
    trackEvent("search", trackingSearchPayload(state.search));
    history.pushState({}, "", "/search");
    render();
  });

  const syncChildAgeFields = (event) => {
    const children = Math.max(0, Number(event.currentTarget.value || 0));
    updateState({
      search: {
        ...state.search,
        children,
        childAges: (state.search.childAges || []).slice(0, children),
        travelers: Number(state.search.adults || 1) + children
      }
    });
  };
  const childrenInput = document.querySelector("[data-search-form] [name='children']");
  childrenInput?.addEventListener("input", syncChildAgeFields);
  childrenInput?.addEventListener("change", syncChildAgeFields);

  document.querySelector("[data-checkout-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = buildPurchasePayload(event.currentTarget, state, summary);
    trackEvent("begin_checkout", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, {
      ...state.search,
      bookingId: payload.booking_id,
      playbookEvent: "booking_started"
    }));
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
    const profile = await hydrateProfile(state.personaId, {
      email: payload.email,
      phone: payload.phone,
      firstName: payload.first_name
    });
    updateState({ booking: payload, checkoutDraft: null, profile });
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
      const profile = await hydrateProfile(button.dataset.persona, profileIdentity());
      setPersona(button.dataset.persona, profile);
      setSharedContext({ persona: button.dataset.persona, loyalty_tier: profile.fields.loyalty_tier });
      trackEvent("select_item", { item_id: button.dataset.persona, item_name: personas[button.dataset.persona].label, item_type: "persona", list_name: "demo_control" });
    });
  });

  document.querySelectorAll("[data-lifecycle]").forEach((button) => {
    button.addEventListener("click", () => {
      const lifecyclePayload = trackingLifecyclePayload(state.booking, {
        destination: state.search.destination,
        travel_start_date: state.search.departureDate,
        travel_end_date: state.search.returnDate,
        pax: state.search.travelers
      });
      if (button.dataset.lifecycle === "trip_completed") {
        trackEvent("trip_completed", { ...lifecyclePayload, playbook_event: "trip_completed" });
      }
      if (button.dataset.lifecycle === "review_submitted") {
        trackEvent("survey_answer", { ...lifecyclePayload, playbook_event: "review_submitted", rating: 5 });
      }
      if (button.dataset.lifecycle === "payment_failed") {
        trackEvent("payment_failed", { ...lifecyclePayload, playbook_event: "payment_failed", reason: "demo_card_declined" });
      }
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
