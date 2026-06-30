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
const trackingSchema = await readFile("src/tracking/schema.js", "utf8");
const checkout = await readFile("src/ui/checkout.js", "utf8");
const recommendations = await readFile("src/recommendations/strategies.js", "utf8");
const lookup = await readFile("src/catalog/lookups.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const route of requiredRoutes) {
  assert(sourceText.includes(`"${route}"`) || sourceText.includes(`'${route}'`), `Missing route ${route}`);
}

for (const event of requiredEvents) {
  assert(trackingSchema.includes(event), `Tracking schema missing ${event}`);
}

assert(checkout.includes("email: contact.email"), "Purchase payload must include top-level email");
assert(checkout.includes("phone: contact.phone"), "Purchase payload must include top-level phone");
assert(checkout.includes("items:"), "Booking payload must include items array");
assert(checkout.includes("booking_value"), "Booking payload must include booking value");
assert(sourceText.includes("profile?.fields?.next_trip_destination") || sourceText.includes("state.profile?.fields?.next_trip_destination"), "Profile API fields must feed visible surfaces");
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
