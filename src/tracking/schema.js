export const trackingEvents = {
  search: ["destination", "departure_date", "return_date", "traveler_count", "trip_type"],
  view_search_results: ["destination", "result_count", "items"],
  select_item: ["item_id", "item_name", "item_type", "list_name"],
  view_item_list: ["list_name", "items"],
  view_item: ["item_id", "item_name", "item_type", "destination", "price"],
  add_to_cart: ["item_id", "item_name", "item_type", "items", "cart_value"],
  remove_from_cart: ["item_id", "item_name", "item_type", "items", "cart_value"],
  view_cart: ["items", "cart_value", "booking_value"],
  begin_checkout: ["items", "cart_value", "booking_value"],
  add_shipping_info: ["country", "traveler_count", "items", "booking_value"],
  add_payment_info: ["payment_type", "items", "booking_value"],
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
    "traveler_count",
    "trip_type",
    "items",
    "booking_value"
  ],
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

export function isMeiroBuiltInEventType(name) {
  return meiroBuiltInEventTypes.includes(name);
}

export function trackingItem(product, quantity = 1) {
  return {
    item_id: product.id,
    item_slug: product.slug,
    item_name: product.name,
    item_type: product.type,
    destination: product.destination,
    trip_type: product.tripType,
    price: product.price,
    quantity
  };
}

export function trackingCartPayload(enrichedItems, totals) {
  return {
    items: enrichedItems.map((item) => trackingItem(item.product, item.quantity)),
    cart_value: totals.total,
    booking_value: totals.total,
    item_count: totals.count,
    currency: "EUR"
  };
}
