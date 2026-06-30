import { trackingCartPayload } from "../tracking/schema.js";
import { money } from "../utils/format.js";

export function checkoutPage(state, summary) {
  if (!summary.enriched.length) {
    return `<section class="empty-panel"><h1>Checkout needs an itinerary first</h1><a class="primary" href="/itinerary" data-link>Recover itinerary</a></section>`;
  }
  const travelerCount = Number(state.search.adults || 1) + Number(state.search.children || 0);
  const serviceFee = 29;
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Checkout</p>
        <h1>Confirm booking without alarming finance</h1>
      </div>
      <strong>${money(summary.total)}</strong>
    </section>
    <form class="checkout-flow" data-checkout-form>
      <div class="checkout-main">
        <section class="checkout-progress">
          <span class="is-active">Travelers</span>
          <span>Contact</span>
          <span>Add-ons</span>
          <span>Payment</span>
        </section>
        <section class="form-card checkout-section">
          <div>
            <span class="eyebrow">Step 1</span>
            <h2>Traveler details</h2>
          </div>
          <div class="form-grid">
            <label>First name<input name="firstName" required value="Alex" /></label>
            <label>Surname<input name="surname" required value="Somewhere" /></label>
            <label>Date of birth<input name="dob" type="date" value="1988-04-12" /></label>
            <label>Traveler count<input name="travelerCount" type="number" min="1" value="${travelerCount}" /></label>
          </div>
        </section>
        <section class="form-card checkout-section">
          <div>
            <span class="eyebrow">Step 2</span>
            <h2>Contact and documents</h2>
          </div>
          <div class="form-grid">
            <label>Email<input name="email" type="email" required value="alex.somewhere@example.com" /></label>
            <label>Phone<input name="phone" required value="+420777123456" /></label>
            <label>Country<input name="country" value="Czech Republic" /></label>
            <label>Passport number<input name="passport" value="MOCK123456" /></label>
            <label class="wide">Billing address<input name="billingAddress" value="42 Demo Street, Prague" /></label>
          </div>
        </section>
        <section class="form-card checkout-section">
          <div>
            <span class="eyebrow">Step 3</span>
            <h2>Payment simulation</h2>
          </div>
          <div class="form-grid">
            <label>Payment type<select name="paymentType"><option>Demo card</option><option>Invoice</option><option>Loyalty points and optimism</option></select></label>
            <label>Coupon<input name="coupon" value="CALM-QUEUE-10" /></label>
            <label class="check"><input name="marketingConsent" type="checkbox" /> Marketing consent</label>
            <label class="check"><input name="personalizationConsent" type="checkbox" checked /> Personalization consent</label>
          </div>
        </section>
      </div>
      <aside class="summary-card checkout-summary">
        <h2>Booking summary</h2>
        <div class="checkout-mini-items">
          ${summary.enriched.map((item) => `
            <article>
              <img src="${item.product.image}" alt="${item.product.destination} thumbnail" />
              <span>${item.product.destination}</span>
              <strong>${money(item.lineTotal)}</strong>
            </article>
          `).join("")}
        </div>
        <div><span>Trip value</span><strong>${money(summary.total)}</strong></div>
        <div><span>Service fee</span><strong>${money(serviceFee)}</strong></div>
        <div class="total"><span>Due today</span><strong>${money(summary.total + serviceFee)}</strong></div>
        <p>Purchase event will include email, phone, item array, booking value, and the calm confidence of a completed demo.</p>
        <button class="primary full" type="submit">Confirm booking</button>
      </aside>
    </form>
  `;
}

export function buildPurchasePayload(form, state, summary) {
  const data = Object.fromEntries(new FormData(form).entries());
  const draftBookingId = state.checkoutDraft?.bookingId || `ELSE-${Math.floor(100000 + Math.random() * 899999)}`;
  const cartPayload = trackingCartPayload(summary.enriched, { total: summary.total, count: summary.count }, {
    ...state.search,
    bookingId: draftBookingId,
    playbookEvent: "booking_confirmed"
  });
  const firstDestination = summary.enriched[0]?.product.destination || state.search.destination;
  const flightIds = summary.enriched.filter((item) => item.product.type === "flight").map((item) => item.product.id);
  const hotelIds = summary.enriched.filter((item) => item.product.type === "hotel").map((item) => item.product.id);
  const packageIds = summary.enriched.filter((item) => item.product.type === "package").map((item) => item.product.id);
  const addOnIds = summary.enriched.filter((item) => !["flight", "hotel", "package"].includes(item.product.type)).map((item) => item.product.id);
  const contact = { email: data.email, phone: data.phone };
  const adultCount = Number(state.search.adults || state.search.travelers || 1);
  const childCount = Number(state.search.children || 0);
  const childAges = Array.isArray(state.search.childAges) ? state.search.childAges : [];
  const travelerCount = Number(data.travelerCount || adultCount + childCount);
  return {
    transaction_id: `txn_${Date.now()}`,
    booking_id: draftBookingId,
    user_id: contact.email,
    email: contact.email,
    phone: contact.phone,
    first_name: data.firstName,
    surname: data.surname,
    destination: firstDestination,
    origin: state.search.origin || "Prague",
    region: cartPayload.region,
    route: cartPayload.route,
    departure_date: state.search.departureDate,
    return_date: state.search.returnDate,
    depart_date: state.search.departureDate,
    travel_start_date: state.search.departureDate,
    travel_end_date: state.search.returnDate,
    traveler_count: travelerCount,
    pax: travelerCount,
    adult_count: adultCount,
    child_count: childCount,
    child_ages: childAges,
    child_ages_csv: childAges.join(","),
    cabin_class: state.search.cabinClass || "economy",
    trip_type: state.search.tripType,
    flight_ids: flightIds,
    hotel_ids: hotelIds,
    package_ids: packageIds,
    add_on_ids: addOnIds,
    cart_value: summary.total,
    booking_value: summary.total,
    total_value: summary.total,
    currency: "EUR",
    coupon: data.coupon,
    loyalty_tier: state.profile?.fields?.loyalty_tier || "Guest",
    items: cartPayload.items,
    line_items: cartPayload.line_items,
    product_types: cartPayload.product_types,
    booked_product_types: cartPayload.booked_product_types,
    payment_type: data.paymentType,
    country: data.country,
    marketing_consent: data.marketingConsent === "on",
    personalization_consent: data.personalizationConsent === "on",
    item_count: cartPayload.item_count
  };
}
