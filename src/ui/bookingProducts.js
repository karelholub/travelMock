import { findProductById } from "../catalog/lookups.js";
import { products } from "../catalog/products.js";

export function bookedProductsFromBooking(booking) {
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
