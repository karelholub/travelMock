import { recommendationRail } from "../recommendations/strategies.js";
import { money } from "../utils/format.js";
import { rail } from "./components.js";

export function thankYouPage(state) {
  const booking = state.booking;
  if (!booking) {
    return `<section class="empty-panel"><h1>No confirmed booking yet</h1><a class="primary" href="/checkout" data-link>Go to checkout</a></section>`;
  }
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
        <div><span>next_trip_destination</span><strong>${state.profile?.fields?.next_trip_destination || booking.destination}</strong></div>
        <div><span>next_departure_date</span><strong>${state.profile?.fields?.next_departure_date || booking.departure_date}</strong></div>
        <div><span>booking_value</span><strong>${money(state.profile?.fields?.booking_value || booking.booking_value)}</strong></div>
        <div><span>loyalty_tier</span><strong>${state.profile?.fields?.loyalty_tier || booking.loyalty_tier}</strong></div>
        <div><span>recommended_add_on_ids</span><strong>${(state.profile?.fields?.recommended_add_on_ids || []).join(", ")}</strong></div>
      </aside>
    </section>
    ${rail("Next best actions", recs, "thank-you_post_booking")}
  `;
}
