import { money } from "../utils/format.js";

export function reviewPage(state) {
  const booking = state.booking;
  if (!booking) {
    return `<section class="empty-panel"><h1>No trip to review yet</h1><p>Complete a booking first, then come back with opinions and a tiny gavel.</p><a class="primary" href="/itinerary" data-link>Review itinerary</a></section>`;
  }
  if (state.review?.submittedAt) {
    return `
      <section class="review-shell">
        <article class="review-card">
          <p class="eyebrow">Review received</p>
          <h1>Thanks for the signal</h1>
          <p>Your review for ${booking.destination} is now available for post-trip lifecycle journeys, loyalty nudges, and the ancient art of pretending surveys are fun.</p>
          <div class="review-proof">
            <div><span>Booking</span><strong>${booking.booking_id}</strong></div>
            <div><span>Rating</span><strong>${state.review.rating}/5</strong></div>
            <div><span>NPS</span><strong>${state.review.nps}</strong></div>
            <div><span>Value</span><strong>${money(Number(booking.booking_value || booking.total_value || 0))}</strong></div>
          </div>
          <div class="hero-actions">
            <a class="primary" href="/account" data-link>View account</a>
            <a class="secondary" href="/demo-control" data-link>Demo controls</a>
          </div>
        </article>
      </section>
    `;
  }
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Post-trip review</p>
        <h1>How was ${booking.destination}?</h1>
        <p>Close the lifecycle loop with a review event the CDP can actually use.</p>
      </div>
      <strong>${booking.booking_id}</strong>
    </section>
    <form class="review-shell" data-review-form>
      <article class="review-card">
        <div>
          <span class="eyebrow">Trip rating</span>
          <h2>Give the journey a number, then emotionally justify it</h2>
        </div>
        <fieldset class="rating-row">
          <legend>Rating</legend>
          ${[1, 2, 3, 4, 5].map((rating) => `
            <label>
              <input type="radio" name="rating" value="${rating}" ${rating === 5 ? "checked" : ""} />
              <span>${rating}</span>
            </label>
          `).join("")}
        </fieldset>
        <label>NPS
          <input name="nps" type="range" min="0" max="10" value="9" />
        </label>
        <label>Comment
          <textarea name="comment" rows="4">Loved the trip. Mildly suspicious that the recommendations knew me this well.</textarea>
        </label>
        <label>Favorite moment
          <select name="favoriteMoment">
            <option>transfer arrived before panic</option>
            <option>hotel view contained actual view</option>
            <option>excursion made me briefly cultured</option>
            <option>checkout did not ask for a fax</option>
          </select>
        </label>
        <button class="primary full" type="submit">Submit review</button>
      </article>
      <aside class="summary-card review-summary">
        <h2>Review payload</h2>
        <div><span>booking_id</span><strong>${booking.booking_id}</strong></div>
        <div><span>destination</span><strong>${booking.destination}</strong></div>
        <div><span>traveler_count</span><strong>${booking.traveler_count || booking.pax}</strong></div>
        <div><span>event</span><strong>survey_answer</strong></div>
      </aside>
    </form>
  `;
}
