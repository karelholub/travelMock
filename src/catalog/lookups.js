import { products } from "./products.js";

const productById = new Map(products.map((product) => [product.id, product]));
const productBySlug = new Map(products.map((product) => [product.slug, product]));

export function findProductById(id) {
  return productById.get(id) || null;
}

export function findProductByIdOrSlug(idOrSlug) {
  return productById.get(idOrSlug) || productBySlug.get(idOrSlug) || null;
}

export function findProductsByIds(ids) {
  return ids.map((id) => findProductById(id)).filter(Boolean);
}

export function enrichCartItems(items) {
  return items
    .map((item) => {
      const product = findProductById(item.productId);
      return product ? { ...item, product, lineTotal: product.price * item.quantity } : null;
    })
    .filter(Boolean);
}

export function cartTotal(enrichedItems) {
  return enrichedItems.reduce((total, item) => total + item.lineTotal, 0);
}

export function bookingItemCount(enrichedItems) {
  return enrichedItems.reduce((count, item) => count + item.quantity, 0);
}
