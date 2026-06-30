import { hydrateProfile } from "./api/profileClient.js";
import { appendTrackingLog, cartSummary, state, subscribe, updateState } from "./state/store.js";
import { runPageEffects } from "./app/pageEffects.js";
import { profileIdentity } from "./app/profileIdentity.js";
import { layout, routes, routeView } from "./app/routes.js";
import { wireEvents } from "./app/events.js";
import { configureTracking, trackPageView } from "./tracking/index.js";

const app = document.querySelector("#app");

configureTracking({
  sharedContext: {
    route_count: routes.length,
    demo: "travel-cdp-personalization"
  }
});

window.addEventListener("demo:tracking", (event) => {
  appendTrackingLog(event.detail);
});

async function boot() {
  if (!state.profile) {
    const profile = await hydrateProfile(state.personaId, profileIdentity(state));
    updateState({ profile });
    return;
  }
  render();
}

function render() {
  const summary = cartSummary();
  const path = location.pathname;
  app.innerHTML = layout(routeView(path, state, summary), summary);
  wireEvents(summary, render);
  trackPageView({ route: path, persona: state.personaId });
  runPageEffects(path, state, summary);
}

subscribe(render);
boot();
window.addEventListener("popstate", render);
