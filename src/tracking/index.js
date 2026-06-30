import { isMeiroBuiltInEventType, trackingEvents } from "./schema.js";

let consentState = { analytics: true, personalization: true, marketing: false };
let sharedContext = {
  app: "elsewhere-travel-demo",
  cdp: "meiro",
  currency: "EUR"
};

function getMeiro() {
  return window.MeiroEvents || window.meiroEvents || null;
}

function getPipesTag() {
  return typeof window.mpt === "function" ? window.mpt : null;
}

export function configureTracking(config = {}) {
  sharedContext = { ...sharedContext, ...config.sharedContext };
  const collectionEndpoint = config.collectionEndpoint || window.__MEIRO_COLLECTION_ENDPOINT__;
  const mpt = getPipesTag();
  if (mpt && collectionEndpoint) {
    mpt("config", { collection_endpoint: collectionEndpoint });
  }
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
  const mpt = getPipesTag();
  if (mpt) mpt("config", { context: sharedContext });
  const sdk = getMeiro();
  if (sdk?.setSharedContext) sdk.setSharedContext(sharedContext);
}

export function setConsent(consent) {
  consentState = { ...consentState, ...consent };
  const payload = { ...consentState, timestamp: new Date().toISOString() };
  const mpt = getPipesTag();
  if (mpt) mpt("config", { consent: consentState });
  const sdk = getMeiro();
  if (sdk?.setConsent) sdk.setConsent(payload);
  logLocalEvent("set_consent", payload);
}

export function identifyUser(profile) {
  const payload = {
    email: profile.email,
    phone: profile.phone,
    first_name: profile.firstName,
    surname: profile.surname,
    loyalty_tier: profile.loyaltyTier
  };
  const mpt = getPipesTag();
  if (mpt) mpt("config", { user: payload });
  const sdk = getMeiro();
  if (sdk?.identify) sdk.identify(payload);
  logLocalEvent("identify_user", payload);
}

export function trackPageView(payload = {}) {
  const enriched = { ...sharedContext, ...payload, url: location.pathname, title: document.title };
  const mpt = getPipesTag();
  if (mpt) mpt("event", "page_view", enriched);
  const sdk = getMeiro();
  if (sdk?.pageView) sdk.pageView(enriched);
  logLocalEvent("page_view", enriched);
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
  const mpt = getPipesTag();
  if (mpt && (isMeiroBuiltInEventType(name) || window.__MEIRO_SEND_CUSTOM_PLAYBOOK_EVENTS__ === true)) {
    mpt("event", name, enriched);
  }
  const sdk = getMeiro();
  if (sdk?.track) sdk.track(name, enriched);
  logLocalEvent(name, enriched);
}

function logLocalEvent(name, payload) {
  window.dispatchEvent(new CustomEvent("demo:tracking", { detail: { name, payload } }));
  console.info("[tracking]", name, payload);
}
