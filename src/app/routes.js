import { accountPage } from "../ui/account.js";
import { checkoutPage } from "../ui/checkout.js";
import { demoControlPage } from "../ui/demoControl.js";
import { homePage } from "../ui/home.js";
import { itineraryPage } from "../ui/itinerary.js";
import { productPage } from "../ui/product.js";
import { reviewPage } from "../ui/review.js";
import { searchPage } from "../ui/search.js";
import { thankYouPage } from "../ui/thankYou.js";
import { wishlistPage } from "../ui/wishlist.js";

export const routes = ["/", "/search", "/product", "/itinerary", "/wishlist", "/checkout", "/thank-you", "/review", "/account", "/demo-control"];

export function routeView(path, state, summary) {
  if (path === "/") return homePage(state);
  if (path === "/search") return searchPage(state);
  if (path.startsWith("/product/")) return productPage(state, decodeURIComponent(path.split("/").pop()));
  if (path === "/itinerary") return itineraryPage(state, summary);
  if (path === "/wishlist") return wishlistPage(state);
  if (path === "/checkout") return checkoutPage(state, summary);
  if (path === "/thank-you") return thankYouPage(state);
  if (path === "/review") return reviewPage(state);
  if (path === "/account") return accountPage(state);
  if (path === "/demo-control") return demoControlPage(state);
  return `<section class="empty-panel"><h1>Route not found</h1><a class="primary" href="/" data-link>Go home</a></section>`;
}

export function layout(content, summary, state) {
  const savedCount = state.savedProductIds?.length || 0;
  return `
    <header class="site-header">
      <a class="brand" href="/" data-link>
        <img src="/assets/logo-mark.svg" alt="" />
        <span>Elsewhere Travel Co.</span>
      </a>
      <nav>
        <a href="/search" data-link>Search</a>
        <a href="/itinerary" data-link>Itinerary (${summary.count})</a>
        <a href="/wishlist" data-link>Wishlist (${savedCount})</a>
        <a href="/account" data-link>Account</a>
        <a href="/demo-control" data-link>Demo</a>
      </nav>
    </header>
    <main>${content}</main>
  `;
}
