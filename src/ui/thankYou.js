import { products } from "../catalog/products.js";
import { findProductById } from "../catalog/lookups.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money, productTypeLabel } from "../utils/format.js";
import { detailText } from "../utils/profileDisplay.js";
import { rail } from "./components.js";

export function thankYouPage(state) {
  const booking = state.booking;
  if (!booking) {
    return `<section class="empty-panel"><h1>No confirmed booking yet</h1><a class="primary" href="/checkout" data-link>Go to checkout</a></section>`;
  }
  const fields = state.profile?.fields || {};
  const recs = recommendationRail("thank-you", state);
  const bookedProducts = bookedProductsFromBooking(booking);
  const heroProduct = bookedProducts[0];
  return `
    <section class="confirmation confirmation-modern">
      <div class="confirmation-hero">
        ${heroProduct ? `
          <img class="confirmation-image" src="${heroProduct.image}" alt="${heroProduct.destination} booked trip" />
        ` : ""}
        <div class="confirmation-hero-copy">
        <p class="eyebrow">Booking confirmed</p>
        <h1>${booking.booking_id}</h1>
        <p>Your ${booking.destination} trip is confirmed. The post-booking lifecycle has entered its helpful, slightly smug phase.</p>
        ${heroProduct ? `
          <article class="booked-card">
            <span>${productTypeLabel(heroProduct.type)} · ${heroProduct.destination}</span>
            <strong>${heroProduct.name}</strong>
            <small>${bookedProducts.length} booked item${bookedProducts.length === 1 ? "" : "s"} · ${money(Number(booking.booking_value || booking.total_value || 0))}</small>
          </article>
        ` : ""}
        <div class="post-booking-steps">
          <span class="is-done">Booked</span>
          <span>Pre-trip upsell</span>
          <span>Trip completed</span>
          <a href="/review" data-link>Review request</a>
        </div>
        <div class="hero-actions">
          <a class="primary" href="/account" data-link>View account</a>
          <a class="secondary" href="/review" data-link>Write review</a>
          <a class="secondary" href="/demo-control" data-link>Demo controls</a>
        </div>
        </div>
      </div>
      <aside class="summary-card confirmation-summary">
        <h2>Booking snapshot</h2>
        <div><span>Destination</span><strong>${booking.destination}</strong></div>
        <div><span>Travelers</span><strong>${booking.traveler_count || booking.pax}</strong></div>
        <div><span>Booking value</span><strong>${money(Number(booking.booking_value || booking.total_value || 0))}</strong></div>
        <div><span>Product types</span><strong>${booking.booked_product_types || booking.product_types?.join(", ")}</strong></div>
      </aside>
    </section>
    <section class="profile-proof-grid">
      <article class="summary-card">
        <h2>Profile API proof</h2>
        <div><span>email</span><strong>${fields.email || booking.email}</strong></div>
        <div><span>first_name</span><strong>${fields.first_name || booking.first_name}</strong></div>
        <div><span>last_purchased_item_destination</span><strong>${fields.last_purchased_item_destination || fields.next_trip_destination || booking.destination}</strong></div>
      </article>
      <article class="summary-card">
        <h2>Lifecycle attributes</h2>
        <div><span>last_booking_started_details</span><strong>${detailText(fields.last_booking_started_details, booking.booking_id)}</strong></div>
        <div><span>last_viewed_offer_details</span><strong>${detailText(fields.last_viewed_offer_details, "none")}</strong></div>
        <div><span>last_viewed_item_list_name</span><strong>${fields.last_viewed_item_list_name || "thank-you_post_booking"}</strong></div>
      </article>
      <article class="summary-card">
        <h2>Next best action</h2>
        <div><span>total_lifetime_purchase_value</span><strong>${money(Number(fields.total_lifetime_purchase_value || fields.booking_value || booking.booking_value))}</strong></div>
        <div><span>recommended_add_on_ids</span><strong>${(fields.recommended_add_on_ids || []).join(", ")}</strong></div>
        <div><span>post_booking_rail</span><strong>thank-you_post_booking</strong></div>
      </article>
    </section>
    ${rail("Next best actions", recs, "thank-you_post_booking")}
  `;
}

function bookedProductsFromBooking(booking) {
  const itemIds = [
    ...(booking.items || []).map((item) => item.item_id || item.id),
    ...(booking.line_items || []).map((item) => item.item_id || item.product_id || item.id),
    ...(booking.package_ids || []),
    ...(booking.hotel_ids || []),
    ...(booking.flight_ids || []),
    ...(booking.add_on_ids || [])
  ].filter(Boolean);
  const resolved = [...new Set(itemIds)].map((id) => findProductById(id)).filter(Boolean);
  if (resolved.length) return resolved;
  return products.filter((product) => product.destination === booking.destination).slice(0, 3);
}
