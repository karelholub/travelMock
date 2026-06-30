import { hydrateProfile, meiroUserIdFromCookie } from "../api/profileClient.js";
import { findProductById } from "../catalog/lookups.js";
import { personas } from "../data/personas.js";
import { refreshAccountProfile } from "./pageEffects.js";
import { profileIdentity } from "./profileIdentity.js";
import { addItemsToCart, addToCart, cartSummary, removeFromCart, setPersona, state, updateState } from "../state/store.js";
import { identifyUser, setConsent, setSharedContext, trackEvent } from "../tracking/index.js";
import { trackingCartPayload, trackingItem, trackingLifecyclePayload, trackingSearchPayload, trackingWishlistPayload } from "../tracking/schema.js";
import { buildPurchasePayload } from "../ui/checkout.js";

export function wireEvents(summary, render) {
  wireNavigation(summary, render);
  wireCartControls();
  wireSearchForm();
  wireCheckoutForm(summary);
  wireProfileControls();
  wireDemoControls();
}

function navigate(path, render) {
  history.pushState({}, "", path);
  render();
}

function wireNavigation(summary, render) {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const href = link.getAttribute("href");
      if (href === "/checkout" && summary.enriched.length) {
        const checkoutDraft = state.checkoutDraft || {
          bookingId: `ELSE-${Math.floor(100000 + Math.random() * 899999)}`,
          startedAt: new Date().toISOString()
        };
        history.pushState({}, "", href);
        if (!state.checkoutDraft) updateState({ checkoutDraft });
        else render();
        trackEvent("begin_checkout", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, {
          ...state.search,
          bookingId: checkoutDraft.bookingId,
          playbookEvent: "booking_started"
        }));
        return;
      }
      navigate(href, render);
    });
  });
}

function wireCartControls() {
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
}

function wireSearchForm() {
  document.querySelector("[data-search-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const adults = Math.max(1, Number(data.adults || 1));
    const children = Math.max(0, Number(data.children || 0));
    const childAges = Array.from({ length: children }, (_, index) => Number(data[`childAge${index + 1}`]))
      .filter((age) => Number.isFinite(age) && age >= 0);
    const nextSearch = {
      ...state.search,
      ...data,
      adults,
      children,
      childAges,
      travelers: adults + children
    };
    trackEvent("search", trackingSearchPayload(nextSearch));
    history.pushState({}, "", "/search");
    updateState({ search: nextSearch });
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

  document.querySelectorAll("[data-search-form] [name='productCategory']").forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".search-tab").forEach((tab) => tab.classList.toggle("is-active", tab.contains(input) && input.checked));
    });
  });
}

function wireCheckoutForm(summary) {
  document.querySelector("[data-checkout-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = buildPurchasePayload(event.currentTarget, state, summary);
    payload.user_id = meiroUserIdFromCookie() || payload.user_id || payload.email;
    trackEvent("begin_checkout", trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, {
      ...state.search,
      bookingId: payload.booking_id,
      playbookEvent: "booking_started"
    }));
    trackEvent("add_shipping_info", payload);
    trackEvent("add_payment_info", payload);
    trackEvent("purchase", payload);
    identifyUser({
      userId: payload.user_id,
      email: payload.email,
      phone: payload.phone,
      firstName: payload.first_name,
      surname: payload.surname,
      loyaltyTier: payload.loyalty_tier
    });
    const profile = await hydrateProfile(state.personaId, {
      user_id: payload.user_id,
      email: payload.email,
      phone: payload.phone,
      firstName: payload.first_name
    });
    history.pushState({}, "", "/thank-you");
    updateState({ booking: payload, checkoutDraft: null, profile, cart: { items: [] } });
  });
}

function wireProfileControls() {
  document.querySelector("[data-refresh-profile]")?.addEventListener("click", async () => {
    trackEvent("select_item", { item_id: "profile_api_refresh", item_name: "Refresh profile", item_type: "profile_api", list_name: "account" });
    await refreshAccountProfile(state, { force: true });
  });
}

function wireDemoControls() {
  document.querySelector("[data-restore-cart]")?.addEventListener("click", () => {
    const persona = personas[state.personaId] || personas.anonymous;
    addItemsToCart(persona.cartRestoreIds);
  });

  document.querySelectorAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", async () => {
      const profile = await hydrateProfile(button.dataset.persona, profileIdentity(state));
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
