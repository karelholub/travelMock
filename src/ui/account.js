import { profileIdentity } from "../app/profileIdentity.js";
import { personas } from "../data/personas.js";
import { recommendationRail } from "../recommendations/strategies.js";
import { money } from "../utils/format.js";
import { detailDestination, detailListName, detailNumber, detailText, maskIdentifier, profileApiStatus } from "../utils/profileDisplay.js";
import { rail } from "./components.js";
import { personalizationBanner } from "./personalizationBanners.js";

export function accountPage(state) {
  const persona = personas[state.personaId] || personas.anonymous;
  const fields = state.profile?.fields || {};
  const lifetimeValue = money(detailNumber(fields.total_lifetime_purchase_value ?? fields.booking_value, 0));
  const destination = detailDestination(
    fields.last_purchased_item_destination,
    fields.next_trip_destination,
    fields.last_search_details,
    fields.last_search_performed_details,
    fields.last_viewed_destination_details
  ) || persona.preferredDestination;
  const lastSearch = detailText(fields.last_search_details || fields.last_search_performed_details, destination);
  const abandoned = detailText(fields.abandoned_booking, "No abandoned booking");
  const wishlist = detailText(fields.last_wishlist_item_added, "Nothing saved yet");
  const viewedList = detailListName(fields.last_viewed_item_list_name, "homepage_recommended");
  const email = detailText(fields.email || state.booking?.email, "Not captured yet");
  const firstName = detailText(fields.first_name || state.booking?.first_name, "");
  const lastName = detailText(fields.last_name || fields.surname || state.booking?.surname, "");
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || persona.label;
  const hasActiveBooking = Boolean(fields.has_active_booking);
  const hasAbandonedBooking = hasSignal(fields.abandoned_booking);
  const activeBooking = hasActiveBooking ? "Active" : "No active booking";
  const searchesLast7d = detailNumber(fields.searches_last_7d, 0);
  const profileActivity = detailText(fields.profile_activity, "No recent profile activity");
  const tripSignal = detailText(fields.last_interest_trip_type, persona.preferredTripType);
  const bookingStarted = detailText(fields.last_booking_started_details, "No booking started");
  const viewedOffer = detailText(fields.last_viewed_offer_details, "No offer viewed");
  const source = state.profile?.source || "pending";
  const identity = profileIdentity(state);
  const lookup = state.profileLookup || {};
  const lookupType = lookup.identityType || (identity.user_id ? "user_id" : identity.email ? "email" : "none");
  const lookupValue = lookup.identityValue || identity.user_id || identity.email || "";
  const checkedAt = lookup.checkedAt ? new Date(lookup.checkedAt).toLocaleTimeString() : "loading";
  const profileStatus = profileApiStatus(state.profile);
  const primaryAction = accountPrimaryAction({ hasAbandonedBooking, hasActiveBooking, destination });
  const recommendationReason = accountRecommendationReason({ firstName, destination, searchesLast7d, viewedList, hasActiveBooking });
  return `
    <section class="page-head dense">
      <div>
        <p class="eyebrow">Account</p>
        <h1>${displayName || persona.label}</h1>
        <p>${persona.label} · ${destination} affinity · ${fields.loyalty_tier || persona.loyaltyTier}</p>
      </div>
      <a class="secondary" href="/demo-control" data-link>Demo controls</a>
    </section>
    <section class="loyalty-hero">
      <div class="account-hero-copy">
        <span class="eyebrow">Traveler profile</span>
        <h2>${primaryAction.heading}</h2>
        <p>${primaryAction.copy}</p>
      </div>
      <div class="account-hero-snapshot" aria-label="Profile summary">
        <article><span>Loyalty</span><strong>${fields.loyalty_tier || persona.loyaltyTier}</strong></article>
        <article><span>Affinity</span><strong>${destination}</strong></article>
        <article><span>Status</span><strong>${activeBooking}</strong></article>
        <article><span>Searches</span><strong>${searchesLast7d} in 7d</strong></article>
      </div>
      <div class="loyalty-actions">
        <a class="primary" href="${primaryAction.href}" data-link>${primaryAction.label}</a>
        <a class="secondary" href="/itinerary" data-link>Review itinerary</a>
      </div>
    </section>
    <section class="account-layout">
      <section class="account-main">
        <section class="profile-signal-grid">
          <article class="summary-card account-signal-card">
            <div class="summary-card-head">
              <span class="eyebrow">Known traveler</span>
              <h2>${displayName}</h2>
            </div>
            <div><span>Email</span><strong>${email}</strong></div>
            <div><span>First name</span><strong>${firstName || "Not captured yet"}</strong></div>
            <div><span>Last name</span><strong>${lastName || "Not captured yet"}</strong></div>
            <div><span>Lifetime value</span><strong>${lifetimeValue}</strong></div>
          </article>
          <article class="summary-card account-signal-card">
            <div class="summary-card-head">
              <span class="eyebrow">Recent intent</span>
              <h2>${destination}</h2>
            </div>
            <div><span>Last search</span><strong>${lastSearch}</strong></div>
            <div><span>Profile activity</span><strong>${profileActivity}</strong></div>
            <div><span>Last viewed list</span><strong>${viewedList}</strong></div>
            <div><span>Wishlist</span><strong>${wishlist}</strong></div>
          </article>
          <article class="summary-card account-signal-card is-recovery">
            <div class="summary-card-head">
              <span class="eyebrow">Recovery</span>
              <h2>${hasAbandonedBooking ? "Trip waiting" : "No panic detected"}</h2>
            </div>
            <div><span>Abandoned booking</span><strong>${abandoned}</strong></div>
            <div><span>Booking started</span><strong>${bookingStarted}</strong></div>
            <div><span>Viewed offer</span><strong>${viewedOffer}</strong></div>
            <a class="secondary full" href="${hasAbandonedBooking ? "/itinerary" : "/search"}" data-link>${hasAbandonedBooking ? "Restore itinerary" : "Create fresh intent"}</a>
          </article>
        </section>
        <section class="account-recommendation-note">
          <span class="eyebrow">Why these offers</span>
          <p>${recommendationReason}</p>
        </section>
        ${personalizationBanner("account", state)}
      </section>
      <aside class="account-side">
        <section class="summary-card profile-proof-card">
          <div class="summary-card-head">
            <span class="eyebrow">Profile API proof</span>
            <h2>${profileStatus.label}</h2>
          </div>
          <span class="status-pill ${profileStatus.tone}">${source}</span>
          <div><span>Lookup</span><strong>${lookupType} · ${maskIdentifier(lookupValue)}</strong></div>
          <div><span>Checked</span><strong>${checkedAt}</strong></div>
          <div><span>Destination</span><strong>${destination}</strong></div>
          <div><span>Trip signal</span><strong>${tripSignal}</strong></div>
          ${profileStatus.detail ? `<p class="signal-note">${profileStatus.detail}</p>` : ""}
          <button class="secondary full" type="button" data-refresh-profile>Refresh profile</button>
        </section>
      </aside>
    </section>
    ${rail("Recommended from profile signals", recommendationRail("account", state), "account_recommendations")}
  `;
}

function hasSignal(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return !["none", "no", "false", "pending"].includes(String(value).toLowerCase());
}

function accountPrimaryAction({ hasAbandonedBooking, hasActiveBooking, destination }) {
  if (hasAbandonedBooking) {
    return {
      href: "/itinerary",
      label: "Restore itinerary",
      heading: "A trip is waiting to be rescued",
      copy: `${destination} intent is already warm, so the account can lead with recovery instead of starting from zero.`
    };
  }
  if (hasActiveBooking) {
    return {
      href: "/itinerary",
      label: "Manage booking",
      heading: "Booking active, upsells unlocked",
      copy: "Use the account page to show post-booking add-ons, transfers, excursions, and loyalty-aware next steps."
    };
  }
  return {
    href: "/search",
    label: "Plan next trip",
    heading: `${destination} is the next best excuse`,
    copy: "Profile signals are ready for a fresh search, mildly dramatic offers included."
  };
}

function accountRecommendationReason({ firstName, destination, searchesLast7d, viewedList, hasActiveBooking }) {
  const name = firstName || "This traveler";
  if (hasActiveBooking) return `${name} has an active booking, so transfers, excursions, and calm little add-ons should surface first.`;
  if (searchesLast7d > 0) return `${name} searched ${destination} ${searchesLast7d} time${searchesLast7d === 1 ? "" : "s"} recently, with ${viewedList} as the latest list signal.`;
  return `${name} shows ${destination} affinity, so the account keeps matching offers close at hand.`;
}
