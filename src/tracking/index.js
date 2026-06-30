import { trackingEvents } from "./schema.js";

let consentState = { analytics: true, personalization: true, marketing: false };
let sharedContext = {
  app: "elsewhere-travel-demo",
  cdp: "meiro",
  currency: "EUR"
};

function getMeiro() {
  return window.MeiroEvents || window.meiroEvents || null;
}

export function configureTracking(config = {}) {
  sharedContext = { ...sharedContext, ...config.sharedContext };
  const sdk = getMeiro();
  if (sdk?.init) {
    sdk.init({
      config: {
        domain: config.domain || window.__MEIRO_DOMAIN__,
        channel: "web",
        app: sharedContext.app
      },
      consent: consentState,
      linkTracking: true,
      trackingRulesEnabled: true
    });
  }
  if (sdk?.setSharedContext) sdk.setSharedContext(sharedContext);
}

export function setSharedContext(context) {
  sharedContext = { ...sharedContext, ...context };
  const sdk = getMeiro();
  if (sdk?.setSharedContext) sdk.setSharedContext(sharedContext);
}

export function setConsent(consent) {
  consentState = { ...consentState, ...consent };
  const payload = { ...consentState, timestamp: new Date().toISOString() };
  const sdk = getMeiro();
  if (sdk?.setConsent) sdk.setConsent(payload);
  trackEvent("set_consent", payload);
}

export function identifyUser(profile) {
  const payload = {
    email: profile.email,
    phone: profile.phone,
    first_name: profile.firstName,
    surname: profile.surname,
    loyalty_tier: profile.loyaltyTier
  };
  const sdk = getMeiro();
  if (sdk?.identify) sdk.identify(payload);
  trackEvent("identify_user", payload);
}

export function trackPageView(payload = {}) {
  const enriched = { ...sharedContext, ...payload, url: location.pathname, title: document.title };
  const sdk = getMeiro();
  if (sdk?.pageView) sdk.pageView(enriched);
  window.dispatchEvent(new CustomEvent("demo:tracking", { detail: { name: "page_view", payload: enriched } }));
  console.info("[tracking] page_view", enriched);
}

export function trackEvent(name, payload = {}) {
  const schema = trackingEvents[name];
  const enriched = {
    ...sharedContext,
    ...payload,
    event_name: name,
    schema_fields: schema || [],
    timestamp: new Date().toISOString(),
    consent: consentState
  };
  const sdk = getMeiro();
  if (sdk?.track) sdk.track(name, enriched);
  window.dispatchEvent(new CustomEvent("demo:tracking", { detail: { name, payload: enriched } }));
  console.info("[tracking]", name, enriched);
}
