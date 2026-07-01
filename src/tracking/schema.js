export const trackingEvents = {
  search: ["origin", "destination", "region", "depart_date", "return_date", "pax", "adult_count", "child_count", "child_ages", "cabin_class", "trip_type", "product_category"],
  view_search_results: ["origin", "destination", "region", "result_count", "items"],
  select_item: ["item_id", "item_name", "item_type", "list_name"],
  view_item_list: ["list_name", "items"],
  view_item: ["item_id", "item_name", "item_type", "product_type", "destination", "region", "price", "currency"],
  add_to_cart: ["item_id", "item_name", "item_type", "product_type", "items", "cart_value", "total_value"],
  remove_from_cart: ["item_id", "item_name", "item_type", "items", "cart_value"],
  add_to_wishlist: ["item_id", "destination", "region", "route", "saved_price", "saved_at"],
  view_cart: ["items", "line_items", "product_types", "cart_value", "booking_value", "total_value"],
  begin_checkout: ["booking_id", "destination", "total_value", "currency", "travel_start_date", "travel_end_date", "pax", "adult_count", "child_count", "child_ages"],
  add_shipping_info: ["country", "traveler_count", "pax", "adult_count", "child_count", "child_ages", "items", "booking_value", "total_value"],
  add_payment_info: ["payment_type", "items", "booking_value", "total_value"],
  purchase: [
    "transaction_id",
    "booking_id",
    "email",
    "phone",
    "first_name",
    "surname",
    "destination",
    "departure_date",
    "return_date",
    "travel_start_date",
    "travel_end_date",
    "traveler_count",
    "pax",
    "adult_count",
    "child_count",
    "child_ages",
    "trip_type",
    "line_items",
    "product_types",
    "items",
    "booking_value",
    "total_value",
    "missed_sales_opportunities",
    "missed_sales_opportunity_count",
    "missed_sales_opportunity_value",
    "missed_sales_opportunity_ids",
    "missed_sales_opportunity_types",
    "missed_sales_followup_reasons"
  ],
  trip_completed: ["booking_id", "destination", "region", "travel_end_date"],
  review_submitted: ["booking_id", "rating"],
  survey_answer: ["booking_id", "rating"],
  payment_failed: ["booking_id", "reason"],
  set_consent: ["analytics", "personalization", "marketing"],
  identify_user: ["email", "phone", "loyalty_tier"]
};

export const meiroBuiltInEventTypes = [
  "page_view",
  "click",
  "form_start",
  "form_submit",
  "scroll",
  "file_download",
  "view_search_results",
  "session_start",
  "first_visit",
  "user_engagement",
  "video_start",
  "video_progress",
  "video_complete",
  "add_to_cart",
  "view_item",
  "view_item_list",
  "select_item",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "refund",
  "remove_from_cart",
  "view_cart",
  "add_to_wishlist",
  "select_promotion",
  "view_promotion",
  "generate_lead",
  "qualify_lead",
  "close_convert_lead",
  "close_unconvert_lead",
  "disqualify_lead",
  "search",
  "select_content",
  "survey_answer",
  "share",
  "login",
  "sign_up",
  "join_group",
  "tutorial_begin",
  "tutorial_complete",
  "level_start",
  "level_end",
  "level_up",
  "post_score",
  "unlock_achievement",
  "earn_virtual_currency",
  "spend_virtual_currency",
  "web_banner_impression",
  "web_banner_click",
  "web_banner_close"
];

export const travelPlaybookEventMap = {
  search_performed: "search",
  destination_viewed: "view_item",
  offer_viewed: "view_item",
  wishlist_added: "add_to_wishlist",
  booking_started: "begin_checkout",
  payment_completed: "add_payment_info",
  booking_confirmed: "purchase",
  ancillary_added: "add_to_cart",
  trip_completed: "trip_completed",
  review_submitted: "survey_answer",
  payment_failed: "payment_failed"
};

const destinationRegions = {
  Lisbon: "Southern Europe",
  Mallorca: "Mediterranean",
  Zurich: "Central Europe",
  Kyoto: "East Asia",
  Reykjavik: "Nordics"
};

const defaultOrigin = "Prague";

export function isMeiroBuiltInEventType(name) {
  return meiroBuiltInEventTypes.includes(name);
}

export function destinationRegion(destination) {
  return destinationRegions[destination] || "Europe";
}

export function travelRoute(origin = defaultOrigin, destination = "") {
  return `${origin}-${destination}`.replace(/\s+/g, "_").toUpperCase();
}

export function normalizedProductType(product) {
  if (["add_on", "insurance", "experience", "transfer"].includes(product.type)) return "ancillary";
  return product.type;
}

export function travelerBreakdown(search = {}) {
  const fallbackTravelers = Number(search.travelers || search.pax || 1);
  const adultCount = Math.max(1, Number(search.adults || search.adultCount || (fallbackTravelers - Number(search.children || search.childCount || 0)) || 1));
  const childCount = Math.max(0, Number(search.children || search.childCount || 0));
  const childAges = Array.isArray(search.childAges)
    ? search.childAges
    : String(search.childAges || "")
      .split(",")
      .map((age) => Number(age.trim()))
      .filter((age) => Number.isFinite(age) && age >= 0);
  const normalizedChildAges = childAges.slice(0, childCount);
  return {
    adult_count: adultCount,
    child_count: childCount,
    child_ages: normalizedChildAges,
    child_ages_csv: normalizedChildAges.join(","),
    pax: adultCount + childCount
  };
}

export function trackingSearchPayload(search) {
  const origin = search.origin || defaultOrigin;
  const travelers = travelerBreakdown(search);
  return {
    playbook_event: "search_performed",
    origin,
    destination: search.destination,
    region: destinationRegion(search.destination),
    route: travelRoute(origin, search.destination),
    depart_date: search.departureDate,
    departure_date: search.departureDate,
    return_date: search.returnDate,
    pax: travelers.pax,
    traveler_count: travelers.pax,
    adult_count: travelers.adult_count,
    child_count: travelers.child_count,
    child_ages: travelers.child_ages,
    child_ages_csv: travelers.child_ages_csv,
    cabin_class: search.cabinClass || "economy",
    trip_type: search.tripType,
    product_category: search.productCategory || "package",
    searched_at: new Date().toISOString()
  };
}

export function trackingItem(product, quantity = 1, context = {}) {
  const origin = context.origin || defaultOrigin;
  const travelStartDate = product.departureDate || context.departureDate;
  const travelEndDate = product.returnDate || context.returnDate;
  return {
    playbook_event: product.type === "flight" ? "destination_viewed" : "offer_viewed",
    item_id: product.id,
    item_slug: product.slug,
    item_name: product.name,
    item_type: product.type,
    product_type: normalizedProductType(product),
    destination: product.destination,
    region: destinationRegion(product.destination),
    route: travelRoute(origin, product.destination),
    trip_type: product.tripType,
    price: product.price,
    value: product.price * quantity,
    currency: "EUR",
    travel_start_date: travelStartDate,
    travel_end_date: travelEndDate,
    quantity
  };
}

export function trackingWishlistPayload(product, context = {}) {
  return {
    playbook_event: "wishlist_added",
    item_id: product.id,
    destination: product.destination,
    region: destinationRegion(product.destination),
    route: travelRoute(context.origin || defaultOrigin, product.destination),
    price: product.price,
    saved_price: product.price,
    currency: "EUR",
    saved_at: new Date().toISOString()
  };
}

export function trackingCartPayload(enrichedItems, totals, context = {}) {
  const lineItems = enrichedItems.map((item) => trackingItem(item.product, item.quantity, context));
  const firstItem = lineItems[0];
  const destinations = [...new Set(lineItems.map((item) => item.destination))];
  const productTypes = [...new Set(lineItems.map((item) => item.product_type))];
  const travelers = travelerBreakdown(context);
  return {
    playbook_event: context.playbookEvent,
    booking_id: context.bookingId,
    destination: firstItem?.destination || context.destination,
    destinations,
    region: firstItem?.region || context.region,
    route: firstItem?.route || (context.destination ? travelRoute(context.origin || defaultOrigin, context.destination) : undefined),
    travel_start_date: context.departureDate || firstItem?.travel_start_date,
    travel_end_date: context.returnDate || firstItem?.travel_end_date,
    departure_date: context.departureDate || firstItem?.travel_start_date,
    return_date: context.returnDate || firstItem?.travel_end_date,
    pax: travelers.pax,
    traveler_count: travelers.pax,
    adult_count: travelers.adult_count,
    child_count: travelers.child_count,
    child_ages: travelers.child_ages,
    child_ages_csv: travelers.child_ages_csv,
    cabin_class: context.cabinClass || "economy",
    trip_type: context.tripType,
    items: lineItems,
    line_items: lineItems,
    product_types: productTypes,
    booked_product_types: productTypes.join(","),
    cart_value: totals.total,
    booking_value: totals.total,
    total_value: totals.total,
    item_count: totals.count,
    currency: "EUR"
  };
}

export function trackingLifecyclePayload(booking, overrides = {}) {
  const destination = booking?.destination || overrides.destination || "Lisbon";
  return {
    booking_id: booking?.booking_id || overrides.booking_id || `ELSE-LIFE-${Date.now()}`,
    destination,
    region: destinationRegion(destination),
    travel_start_date: booking?.travel_start_date || booking?.departure_date || overrides.travel_start_date,
    travel_end_date: booking?.travel_end_date || booking?.return_date || overrides.travel_end_date || new Date().toISOString().slice(0, 10),
    total_value: booking?.total_value || booking?.booking_value || overrides.total_value,
    currency: booking?.currency || "EUR",
    pax: booking?.pax || booking?.traveler_count || overrides.pax || 1
  };
}
