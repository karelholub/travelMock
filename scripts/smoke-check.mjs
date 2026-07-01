import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const requiredRoutes = ["/", "/search", "/itinerary", "/wishlist", "/checkout", "/thank-you", "/review", "/account", "/demo-control"];
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
const thankYou = await readFile("src/ui/thankYou.js", "utf8");
const review = await readFile("src/ui/review.js", "utf8");
const wishlist = await readFile("src/ui/wishlist.js", "utf8");
const personalizationBanners = await readFile("src/ui/personalizationBanners.js", "utf8");
const recommendations = await readFile("src/recommendations/strategies.js", "utf8");
const lookup = await readFile("src/catalog/lookups.js", "utf8");
const simulator = await readFile("scripts/simulate-events.mjs", "utf8");
const profileAttributes = await readFile("src/api/profileAttributes.js", "utf8");
const profileClient = await readFile("src/api/profileClient.js", "utf8");
const profileFunction = await readFile("netlify/functions/profile.js", "utf8");
const accountPage = await readFile("src/ui/account.js", "utf8");
const pageEffects = await readFile("src/app/pageEffects.js", "utf8");
const netlifyConfig = await readFile("netlify.toml", "utf8");
const redirects = await readFile("_redirects", "utf8");
const buildScript = await readFile("scripts/build.mjs", "utf8");
const feedGenerator = await readFile("scripts/generate-product-feed.mjs", "utf8");
const productFeed = await readFile("assets/product-feed.xml", "utf8");

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
assert(netlifyConfig.includes('command = "npm run build"'), "Netlify build command must create dist before deploy");
assert(netlifyConfig.includes('publish = "dist"'), "Netlify publish directory must match build output");
assert(redirects.includes("/* /index.html 200"), "Published SPA fallback _redirects file missing");
assert(buildScript.includes("generate-product-feed.mjs"), "Build must regenerate the product XML feed");
assert(feedGenerator.includes("products") && feedGenerator.includes("product-feed.xml"), "Product feed generator missing catalog source or output path");
assert(productFeed.includes('<products count="30">'), "Product XML feed must include the expanded 30-item catalog");
for (const feedField of ["<product_feed", "<products count=", "<product>", "<id>", "<title>", "<url>", "<image_url>", "<product_type>", "<destination>", "<price>", "<currency>EUR</currency>"]) {
  assert(productFeed.includes(feedField), `Product XML feed missing ${feedField}`);
}
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
assert(thankYou.includes("confirmation-image") && thankYou.includes("bookedProductsFromBooking"), "Thank-you page must render booked product imagery");
assert(review.includes("data-review-form") && sourceText.includes("wireReviewForm") && sourceText.includes('trackEvent("survey_answer"'), "Review page must submit survey_answer event");
assert(sourceText.includes("price-watch-panel") && sourceText.includes("data-watch-target") && sourceText.includes("data-watch-alert-toggle"), "Watch price CTA must show an interactive price watch panel");
assert(wishlist.includes("wishlistPage") && sourceText.includes("data-save") && sourceText.includes("showWishlistModal") && sourceText.includes("data-remove-wishlist"), "Wishlist page and modal controls must exist");
for (const placement of ["home", "search", "product", "itinerary", "checkout", "account", "thankYou", "wishlist"]) {
  assert(personalizationBanners.includes(`${placement}:`) && sourceText.includes(`personalizationBanner("${placement}"`), `Personalization banner placement missing: ${placement}`);
}
assert(sourceText.includes("personalizationPopup(state, path)") && sourceText.includes("data-dismiss-personalization"), "Personalization popup must be mounted and dismissible");
for (const field of ["first_name", "last_search_details", "abandoned_booking", "last_viewed_offer_details", "last_wishlist_item_added", "total_lifetime_purchase_value", "recommended_add_on_ids"]) {
  assert(personalizationBanners.includes(field), `Personalization banners must use Profile API field: ${field}`);
}
assert(sourceText.includes("data-product-category") && sourceText.includes("data-product-category-value"), "Search category pills must update the searchable product category");
for (const checkoutStep of ["travelers", "contact", "addons", "payment"]) {
  assert(checkout.includes(`data-checkout-step="${checkoutStep}"`), `Checkout progress step missing: ${checkoutStep}`);
  assert(checkout.includes(`data-checkout-section="${checkoutStep}"`), `Checkout section target missing: ${checkoutStep}`);
}
assert(sourceText.includes("wireCheckoutSteps") && sourceText.includes("data-checkout-next"), "Checkout progress controls must navigate between steps");
for (const attribute of ["Last name", "has_active_booking", "searches_last_7d", "Profile activity", "Abandoned Booking", "Last Viewed Item", "Last Search Details", "Last Booking Started Details", "Last Wishlist Item Added", "Last Viewed Offer Details", "Last Viewed Destination Details", "Last Search Performed Details", "Last Purchased Item Destination", "User's Email (from Purchase or Shipping)", "First name", "Last Viewed Item List Name", "Total Lifetime Purchase Value"]) {
  assert(profileAttributes.includes(attribute), `Profile API attribute missing: ${attribute}`);
}
assert(profileAttributes.includes("user_s_first_name_from_shipping") && profileAttributes.includes("unwrapped.first_name"), "Profile API first-name shipping alias must normalize to first_name");
for (const field of ["abandoned_booking", "last_viewed_item", "last_search_details", "last_booking_started_details", "last_wishlist_item_added", "last_viewed_offer_details", "last_viewed_destination_details", "last_search_performed_details", "last_purchased_item_destination", "email", "first_name", "last_name", "has_active_booking", "searches_last_7d", "profile_activity", "last_viewed_item_list_name", "total_lifetime_purchase_value"]) {
  assert(sourceText.includes(field), `Profile API field must feed visible surfaces: ${field}`);
}
assert(profileFunction.includes('path: "/api/profile"'), "Netlify Profile API proxy route missing");
assert(profileFunction.includes("MEIRO_PROFILE_API_KEY"), "Profile API proxy must use env var for API key");
assert(profileFunction.includes('"X-API-Token": apiKey'), "Profile API proxy must send token with X-API-Token header");
assert(profileFunction.includes('getUrl.searchParams.set("identifier_type", identifierType)') && profileFunction.includes('getUrl.searchParams.set("identifier_value", identifierValue)'), "Profile API proxy must use identifier_type and identifier_value query params");
assert(profileFunction.includes('["user_id", identifiers.user_id]') && profileFunction.includes('["email", identifiers.email]'), "Profile API lookup must use user_id before email identifiers");
assert(profileClient.includes("mpt_user_id_js") && profileClient.includes('params.set("user_id", userId)'), "Profile API client must use Meiro cookie user_id");
assert(pageEffects.includes('path === "/account"') && pageEffects.includes("hydrateProfile"), "Account page must refresh from Profile API");
for (const helper of ["detailDestination", "detailListName", "detailNumber", "detailText"]) {
  assert(accountPage.includes(helper), `Account page must render Profile API values through ${helper}`);
}
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
