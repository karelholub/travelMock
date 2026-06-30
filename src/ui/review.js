import { money, productTypeLabel, compactDate } from "../utils/format.js";
import { bookedProductsFromBooking } from "./bookingProducts.js";

export function reviewPage(state) {
  const booking = state.booking;
  if (!booking) {
    return `
      <section class="empty-panel review-empty">
        <p class="eyebrow">Post-trip review</p>
        <h1>No trip to review yet</h1>
        <p>Complete a booking first, then come back with opinions and a tiny gavel.</p>
        <div class="hero-actions">
          <a class="primary" href="/itinerary" data-link>Review itinerary</a>
          <a class="secondary" href="/search" data-link>Find a trip</a>
        </div>
      </section>
    `;
  }

  const bookedProducts = bookedProductsFromBooking(booking);
  const heroProduct = bookedProducts[0];
  const bookingValue = Number(booking.booking_value || booking.total_value || 0);

  if (state.review?.submittedAt) {
    return `
      <section class="review-complete">
        <div class="review-complete-media">
          ${heroProduct ? `<img src="${heroProduct.image}" alt="${heroProduct.destination} reviewed trip" />` : ""}
        </div>
        <article class="review-card review-complete-card">
          <p class="eyebrow">Review received</p>
          <h1>Thanks for the signal</h1>
          <p>Your review for ${booking.destination} is now ready for post-trip lifecycle journeys, loyalty nudges, and the ancient art of pretending surveys are fun.</p>
          <div class="review-proof">
            <div><span>Booking</span><strong>${booking.booking_id}</strong></div>
            <div><span>Rating</span><strong>${state.review.rating}/5</strong></div>
            <div><span>NPS</span><strong>${state.review.nps}</strong></div>
            <div><span>Value</span><strong>${money(bookingValue)}</strong></div>
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
    <section class="review-hero">
      ${heroProduct ? `
        <img src="${heroProduct.image}" alt="${heroProduct.destination} trip review" />
      ` : ""}
      <div class="review-hero-copy">
        <p class="eyebrow">Post-trip review</p>
        <h1>How was ${booking.destination}?</h1>
        <p>Close the lifecycle loop with a review event the CDP can actually use.</p>
        <div class="review-trip-meta">
          <span>${booking.booking_id}</span>
          <span>${compactDate(booking.travel_start_date || booking.departure_date)}</span>
          <span>${booking.traveler_count || booking.pax || 1} traveler${Number(booking.traveler_count || booking.pax || 1) === 1 ? "" : "s"}</span>
        </div>
      </div>
    </section>

    <form class="review-shell" data-review-form>
      <article class="review-card">
        <div class="review-card-head">
          <span class="eyebrow">Trip rating</span>
          <h2>Give the journey a number, then emotionally justify it</h2>
          <p>The default is generous because the demo has self-esteem.</p>
        </div>
        <fieldset class="rating-row">
          <legend>Overall rating</legend>
          ${[1, 2, 3, 4, 5].map((rating) => `
            <label>
              <input type="radio" name="rating" value="${rating}" ${rating === 5 ? "checked" : ""} />
              <span>${rating}</span>
              <small>${ratingLabel(rating)}</small>
            </label>
          `).join("")}
        </fieldset>
        <label class="nps-field">Likelihood to recommend
          <div class="nps-control">
            <input name="nps" type="range" min="0" max="10" value="9" data-nps-input />
            <output data-nps-output>9</output>
          </div>
        </label>
        <label>Favorite moment
          <select name="favoriteMoment">
            <option>transfer arrived before panic</option>
            <option>hotel view contained actual view</option>
            <option>excursion made me briefly cultured</option>
            <option>checkout did not ask for a fax</option>
          </select>
        </label>
        <label>Comment
          <textarea name="comment" rows="5">Loved the trip. Mildly suspicious that the recommendations knew me this well.</textarea>
        </label>
        <button class="primary full" type="submit">Submit review</button>
      </article>

      <aside class="review-side">
        <article class="summary-card review-summary">
          <h2>Review payload</h2>
          <div><span>booking_id</span><strong>${booking.booking_id}</strong></div>
          <div><span>destination</span><strong>${booking.destination}</strong></div>
          <div><span>traveler_count</span><strong>${booking.traveler_count || booking.pax}</strong></div>
          <div><span>booking_value</span><strong>${money(bookingValue)}</strong></div>
          <div><span>event</span><strong>survey_answer</strong></div>
        </article>
        ${bookedProducts.length ? `
          <article class="review-trip-card">
            <span class="eyebrow">Booked items</span>
            ${bookedProducts.slice(0, 3).map((product) => `
              <div>
                <strong>${product.name}</strong>
                <span>${productTypeLabel(product.type)} · ${product.destination}</span>
              </div>
            `).join("")}
          </article>
        ` : ""}
      </aside>
    </form>
  `;
}

function ratingLabel(rating) {
  return {
    1: "never again",
    2: "survived",
    3: "fine-ish",
    4: "pretty good",
    5: "suspiciously great"
  }[rating];
}
