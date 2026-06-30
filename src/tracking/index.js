import { isMeiroBuiltInEventType, trackingEvents } from "./schema.js";

let consentState = { analytics: true, personalization: true, marketing: false };
const mptConsentState = {
  storage_persistence: "granted",
  user_id: "granted",
  session_id: "granted"
};
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

function callMpt(command, ...args) {
  const mpt = getPipesTag();
  if (!mpt) return;
  try {
    const result = mpt(command, ...args);
    if (result && typeof result.catch === "function") {
      result.catch((error) => console.warn("[tracking:mpt]", command, args[0], error));
    }
  } catch (error) {
    console.warn("[tracking:mpt]", command, args[0], error);
  }
}

export function configureTracking(config = {}) {
  sharedContext = { ...sharedContext, ...config.sharedContext };
  const collectionEndpoint = config.collectionEndpoint || window.__MEIRO_COLLECTION_ENDPOINT__;
  if (collectionEndpoint) {
    callMpt("config", {
      collection_endpoint: collectionEndpoint,
      link_tracking: { enabled: true },
      tracking_rules: { enabled: true }
    });
    callMpt("consent", mptConsentState);
    callMpt("set", sharedContext);
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
  callMpt("set", sharedContext);
  const sdk = getMeiro();
  if (sdk?.setSharedContext) sdk.setSharedContext(sharedContext);
}

export function setConsent(consent) {
  consentState = { ...consentState, ...consent };
  const payload = { ...consentState, timestamp: new Date().toISOString() };
  const mptConsent = {
    storage_persistence: consentState.analytics || consentState.personalization || consentState.marketing ? "granted" : "denied",
    user_id: consentState.personalization || consentState.marketing ? "granted" : "denied",
    session_id: consentState.analytics || consentState.personalization ? "granted" : "denied"
  };
  Object.assign(mptConsentState, mptConsent);
  callMpt("consent", mptConsent);
  const sdk = getMeiro();
  if (sdk?.setConsent) sdk.setConsent(payload);
  logLocalEvent("set_consent", payload);
}

export function identifyUser(profile) {
  const payload = {
    user_id: profile.userId || profile.user_id || profile.email,
    email: profile.email,
    phone: profile.phone,
    first_name: profile.firstName,
    surname: profile.surname,
    loyalty_tier: profile.loyaltyTier
  };
  callMpt("set", payload);
  const sdk = getMeiro();
  if (sdk?.identify) sdk.identify(payload);
  logLocalEvent("identify_user", payload);
}

export function trackPageView(payload = {}) {
  const enriched = { ...sharedContext, ...payload, page_path: location.pathname, page_title: document.title, url: location.href, referrer: document.referrer };
  callMpt("set", enriched);
  callMpt("event", "page_view", {
    page_title: document.title,
    url: location.href,
    referrer: document.referrer
  });
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
  if (isMeiroBuiltInEventType(name) || window.__MEIRO_SEND_CUSTOM_PLAYBOOK_EVENTS__ === true) {
    callMpt("event", name, enriched);
  }
  const sdk = getMeiro();
  if (sdk?.track) sdk.track(name, enriched);
  logLocalEvent(name, enriched);
}

function logLocalEvent(name, payload) {
  window.dispatchEvent(new CustomEvent("demo:tracking", { detail: { name, payload } }));
  console.info("[tracking]", name, payload);
}
