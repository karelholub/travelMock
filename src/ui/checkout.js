import { trackingCartPayload } from "../tracking/schema.js";
import { money } from "../utils/format.js";

export function checkoutPage(state, summary) {
  if (!summary.enriched.length) {
    return `<section class="empty-panel"><h1>Checkout needs an itinerary first</h1><a class="primary" href="/itinerary" data-link>Recover itinerary</a></section>`;
  }
  const travelerCount = Number(state.search.adults || 1) + Number(state.search.children || 0);
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Checkout</p>
        <h1>Confirm booking without alarming finance</h1>
      </div>
      <strong>${money(summary.total)}</strong>
    </section>
    <form class="checkout-grid" data-checkout-form>
      <section class="form-card">
        <h2>1. Traveler details</h2>
        <label>First name<input name="firstName" required value="Alex" /></label>
        <label>Surname<input name="surname" required value="Somewhere" /></label>
        <label>Date of birth<input name="dob" type="date" value="1988-04-12" /></label>
        <label>Traveler count<input name="travelerCount" type="number" min="1" value="${travelerCount}" /></label>
      </section>
      <section class="form-card">
        <h2>2. Contact details</h2>
        <label>Email<input name="email" type="email" required value="alex.somewhere@example.com" /></label>
        <label>Phone<input name="phone" required value="+420777123456" /></label>
        <label>Country<input name="country" value="Czech Republic" /></label>
        <label>Billing address<input name="billingAddress" value="42 Demo Street, Prague" /></label>
      </section>
      <section class="form-card">
        <h2>3. Documents and consent</h2>
        <label>Passport number<input name="passport" value="MOCK123456" /></label>
        <label class="check"><input name="marketingConsent" type="checkbox" /> Marketing consent</label>
        <label class="check"><input name="personalizationConsent" type="checkbox" checked /> Personalization consent</label>
      </section>
      <section class="form-card">
        <h2>4. Payment simulation</h2>
        <label>Payment type<select name="paymentType"><option>Demo card</option><option>Invoice</option><option>Loyalty points and optimism</option></select></label>
        <label>Coupon<input name="coupon" value="CALM-QUEUE-10" /></label>
        <div class="total"><span>Booking value</span><strong>${money(summary.total)}</strong></div>
        <button class="primary full" type="submit">Confirm booking</button>
      </section>
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
