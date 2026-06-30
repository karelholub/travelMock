import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const requiredRoutes = ["/", "/search", "/itinerary", "/checkout", "/thank-you", "/account", "/demo-control"];
const requiredEvents = [
  "search",
  "view_search_results",
  "select_item",
  "view_item_list",
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase"
];

async function files(dir) {
  const entries = await readdir(dir);
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) out.push(...await files(full));
    else out.push(full);
  }
  return out;
}

const sourceFiles = await files("src");
const sourceText = (await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))).join("\n");
const html = await readFile("index.html", "utf8");
const trackingSchema = await readFile("src/tracking/schema.js", "utf8");
const checkout = await readFile("src/ui/checkout.js", "utf8");
const recommendations = await readFile("src/recommendations/strategies.js", "utf8");
const lookup = await readFile("src/catalog/lookups.js", "utf8");
const simulator = await readFile("scripts/simulate-events.mjs", "utf8");
const profileAttributes = await readFile("src/api/profileAttributes.js", "utf8");
const profileFunction = await readFile("netlify/functions/profile.js", "utf8");
const netlifyConfig = await readFile("netlify.toml", "utf8");
const redirects = await readFile("_redirects", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const route of requiredRoutes) {
  assert(sourceText.includes(`"${route}"`) || sourceText.includes(`'${route}'`), `Missing route ${route}`);
}

for (const event of requiredEvents) {
  assert(trackingSchema.includes(event), `Tracking schema missing ${event}`);
}

assert(html.includes("https://travel.eu1.pipes.meiro.io/collect/travel-web"), "Meiro collection endpoint missing");
assert(html.includes("https://travel.eu1.pipes.meiro.io/mpt.js"), "Meiro Pipes tag missing");
assert(html.includes("link_tracking: { enabled: true }"), "Meiro link tracking config missing");
assert(html.includes("tracking_rules: { enabled: true }"), "Meiro tracking rules config missing");
assert(html.includes('window.mpt("consent"'), "Meiro consent command missing");
assert(sourceText.includes('callMpt("set", sharedContext'), "Meiro shared context set command missing");
assert(sourceText.includes('callMpt("event", "page_view"'), "Meiro page_view event call missing");
assert(sourceText.includes('callMpt("event", name'), "Meiro named event call missing");
assert(sourceText.includes("page_title: document.title") && sourceText.includes("url: location.href") && sourceText.includes("referrer: document.referrer"), "Meiro page_view payload must use allowed fields");
assert(netlifyConfig.includes('from = "/*"') && netlifyConfig.includes('to = "/index.html"'), "Netlify SPA fallback redirect missing");
assert(netlifyConfig.includes('publish = "dist"'), "Netlify publish directory must match build output");
assert(redirects.includes("/* /index.html 200"), "Published SPA fallback _redirects file missing");
assert(sourceText.includes("meiroBuiltInEventTypes"), "Available Meiro event types missing");
for (const field of ["origin", "region", "depart_date", "pax", "adult_count", "child_count", "child_ages", "cabin_class", "route", "line_items", "product_types", "total_value", "travel_start_date", "travel_end_date", "saved_price", "saved_at"]) {
  assert(trackingSchema.includes(field) || sourceText.includes(field), `Travel playbook field missing: ${field}`);
}
for (const playbookEvent of ["search_performed", "wishlist_added", "booking_started", "booking_confirmed", "trip_completed", "review_submitted", "payment_failed"]) {
  assert(sourceText.includes(playbookEvent), `Travel playbook event coverage missing: ${playbookEvent}`);
}
for (const simulatorFeature of ["--profiles", "--interactions", "--path", "--send", "--debug", "--transport", "mpt-batch", "toMptCollectorEvent", "complete", "abandoned", "trackingSearchPayload", "trackingWishlistPayload", "trackingCartPayload"]) {
  assert(simulator.includes(simulatorFeature), `Simulator feature missing: ${simulatorFeature}`);
}
assert(checkout.includes("email: contact.email"), "Purchase payload must include top-level email");
assert(checkout.includes("phone: contact.phone"), "Purchase payload must include top-level phone");
assert(checkout.includes("items:"), "Booking payload must include items array");
assert(checkout.includes("booking_value"), "Booking payload must include booking value");
for (const attribute of ["Abandoned Booking", "Last Viewed Item", "Last Search Details", "Last Booking Started Details", "Last Wishlist Item Added", "Last Viewed Offer Details", "Last Viewed Destination Details", "Last Search Performed Details", "Last Purchased Item Destination", "User's Email (from Purchase or Shipping)", "User's First Name (from Shipping)", "Last Viewed Item List Name", "Total Lifetime Purchase Value"]) {
  assert(profileAttributes.includes(attribute), `Profile API attribute missing: ${attribute}`);
}
for (const field of ["abandoned_booking", "last_viewed_item", "last_search_details", "last_booking_started_details", "last_wishlist_item_added", "last_viewed_offer_details", "last_viewed_destination_details", "last_search_performed_details", "last_purchased_item_destination", "email", "first_name", "last_viewed_item_list_name", "total_lifetime_purchase_value"]) {
  assert(sourceText.includes(field), `Profile API field must feed visible surfaces: ${field}`);
}
assert(profileFunction.includes('path: "/api/profile"'), "Netlify Profile API proxy route missing");
assert(profileFunction.includes("MEIRO_PROFILE_API_KEY"), "Profile API proxy must use env var for API key");
assert(!sourceText.includes("mpp" + "ak_") && !profileFunction.includes("mpp" + "ak_"), "Profile API key must not be committed");
assert(sourceText.includes("empty-itinerary"), "Empty itinerary recovery surface missing");
for (const rail of ["homepage", "search", "cart", "product", "thank-you"]) {
  assert(recommendations.includes(rail), `Recommendation rail missing ${rail}`);
}
for (const helper of ["findProductById", "findProductByIdOrSlug", "findProductsByIds", "enrichCartItems", "cartTotal", "bookingItemCount"]) {
  assert(lookup.includes(`export function ${helper}`), `Missing lookup helper ${helper}`);
}
assert(sourceText.includes("enrichCartItems(state.cart.items"), "Cart must use lookup enrichment");
assert(recommendations.includes("findProductsByIds"), "Recommendations must use indexed lookup helper");

console.log("Smoke checks passed.");
