import { recommendationRail } from "../recommendations/strategies.js";
import { money } from "../utils/format.js";
import { rail } from "./components.js";

export function thankYouPage(state) {
  const booking = state.booking;
  if (!booking) {
    return `<section class="empty-panel"><h1>No confirmed booking yet</h1><a class="primary" href="/checkout" data-link>Go to checkout</a></section>`;
  }
  const fields = state.profile?.fields || {};
  const recs = recommendationRail("thank-you", state);
  return `
    <section class="confirmation">
      <div>
        <p class="eyebrow">Booking confirmed</p>
        <h1>${booking.booking_id}</h1>
        <p>Your ${booking.destination} trip is confirmed. The post-booking lifecycle has entered its helpful, slightly smug phase.</p>
        <div class="hero-actions">
          <a class="primary" href="/account" data-link>View account</a>
          <a class="secondary" href="/demo-control" data-link>Demo controls</a>
        </div>
      </div>
      <aside class="summary-card">
        <h2>Profile API proof</h2>
        <div><span>email</span><strong>${fields.email || booking.email}</strong></div>
        <div><span>first_name</span><strong>${fields.first_name || booking.first_name}</strong></div>
        <div><span>last_purchased_item_destination</span><strong>${fields.last_purchased_item_destination || fields.next_trip_destination || booking.destination}</strong></div>
        <div><span>last_viewed_item_list_name</span><strong>${fields.last_viewed_item_list_name || "thank-you_post_booking"}</strong></div>
        <div><span>total_lifetime_purchase_value</span><strong>${money(Number(fields.total_lifetime_purchase_value || fields.booking_value || booking.booking_value))}</strong></div>
        <div><span>recommended_add_on_ids</span><strong>${(fields.recommended_add_on_ids || []).join(", ")}</strong></div>
      </aside>
    </section>
    ${rail("Next best actions", recs, "thank-you_post_booking")}
  `;
}
