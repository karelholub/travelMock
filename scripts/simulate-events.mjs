#!/usr/bin/env node
import { products } from "../src/catalog/products.js";
import {
  destinationRegion,
  trackingCartPayload,
  trackingItem,
  trackingLifecyclePayload,
  trackingSearchPayload,
  trackingWishlistPayload
} from "../src/tracking/schema.js";

const defaultEndpoint = "https://travel.eu1.pipes.meiro.io/collect/travel-web";
const defaults = {
  profiles: 5,
  interactions: 1,
  path: "mixed",
  endpoint: process.env.MEIRO_COLLECTION_ENDPOINT || defaultEndpoint,
  baseUrl: process.env.SITE_URL || "https://travelagentmockup.netlify.app",
  delayMs: 0,
  seed: 42,
  send: false,
  includeCustom: false,
  verbose: false
};

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

const rng = createRng(Number(options.seed));
const generated = [];

for (let profileIndex = 0; profileIndex < Number(options.profiles); profileIndex += 1) {
  const profile = makeProfile(profileIndex, rng);
  for (let interactionIndex = 0; interactionIndex < Number(options.interactions); interactionIndex += 1) {
    const path = choosePath(options.path, rng);
    generated.push(...buildJourney({ profile, path, interactionIndex, rng }));
  }
}

if (options.send) {
  await sendEvents(generated, options);
} else {
  for (const event of generated) {
    console.log(JSON.stringify(event));
  }
  console.error(`Dry run: generated ${generated.length} events for ${options.profiles} profiles. Add --send to post to ${options.endpoint}.`);
}

function parseArgs(args) {
  const parsed = { ...defaults };
  for (const arg of args) {
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--send") parsed.send = true;
    else if (arg === "--include-custom") parsed.includeCustom = true;
    else if (arg === "--verbose") parsed.verbose = true;
    else if (arg.startsWith("--profiles=")) parsed.profiles = Number(valueOf(arg));
    else if (arg.startsWith("--interactions=")) parsed.interactions = Number(valueOf(arg));
    else if (arg.startsWith("--journeys-per-profile=")) parsed.interactions = Number(valueOf(arg));
    else if (arg.startsWith("--path=")) parsed.path = valueOf(arg);
    else if (arg.startsWith("--endpoint=")) parsed.endpoint = valueOf(arg);
    else if (arg.startsWith("--base-url=")) parsed.baseUrl = valueOf(arg);
    else if (arg.startsWith("--delay-ms=")) parsed.delayMs = Number(valueOf(arg));
    else if (arg.startsWith("--seed=")) parsed.seed = Number(valueOf(arg));
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (!Number.isInteger(parsed.profiles) || parsed.profiles < 1) throw new Error("--profiles must be a positive integer");
  if (!Number.isInteger(parsed.interactions) || parsed.interactions < 1) throw new Error("--interactions must be a positive integer");
  if (!["mixed", "complete", "abandoned", "browse", "watch", "post-trip"].includes(parsed.path)) {
    throw new Error("--path must be one of mixed, complete, abandoned, browse, watch, post-trip");
  }
  if (!Number.isFinite(parsed.delayMs) || parsed.delayMs < 0) throw new Error("--delay-ms must be zero or greater");
  return parsed;
}

function valueOf(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function printHelp() {
  console.log(`Usage:
  npm run simulate:events -- [options]
  node scripts/simulate-events.mjs [options]

Options:
  --profiles=N              Number of synthetic profiles. Default: ${defaults.profiles}
  --interactions=N          Journeys per profile. Default: ${defaults.interactions}
  --path=TYPE               mixed, complete, abandoned, browse, watch, post-trip. Default: mixed
  --endpoint=URL            Collection endpoint. Default: MEIRO_COLLECTION_ENDPOINT or travel demo endpoint
  --base-url=URL            Site URL used in page_url fields. Default: ${defaults.baseUrl}
  --seed=N                  Deterministic random seed. Default: ${defaults.seed}
  --delay-ms=N              Delay between sends when --send is used. Default: 0
  --send                    Actually POST events. Without this, prints NDJSON dry-run output.
  --include-custom          Also emits custom playbook events such as trip_completed and payment_failed.
  --verbose                 Print each send result to stderr.

Examples:
  npm run simulate:events -- --profiles=3 --path=mixed
  npm run simulate:events -- --profiles=25 --interactions=2 --path=complete --send
  MEIRO_COLLECTION_ENDPOINT=https://travel.eu1.pipes.meiro.io/collect/travel-web npm run simulate:events -- --profiles=10 --path=abandoned --send
`);
}

function createRng(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function choosePath(path, rng) {
  if (path !== "mixed") return path;
  const roll = rng();
  if (roll < 0.45) return "complete";
  if (roll < 0.75) return "abandoned";
  if (roll < 0.9) return "watch";
  return "browse";
}

function makeProfile(index, rng) {
  const firstNames = ["Alex", "Mira", "Jonas", "Sofia", "Karim", "Petra", "Nina", "Theo"];
  const surnames = ["Somewhere", "Novak", "Rivera", "Klein", "Ito", "Horak", "Moreau", "Silva"];
  const firstName = firstNames[index % firstNames.length];
  const surname = surnames[Math.floor(rng() * surnames.length)];
  const id = `sim-profile-${String(index + 1).padStart(4, "0")}`;
  return {
    id,
    anonymousId: `anon-${id}`,
    email: `${firstName.toLowerCase()}.${surname.toLowerCase()}.${index + 1}@example.com`,
    phone: `+420777${String(100000 + index).slice(-6)}`,
    firstName,
    surname,
    loyaltyTier: rng() > 0.82 ? "Platinum Calm" : rng() > 0.55 ? "Gold Snack Strategist" : "Standard Adventurer",
    country: "Czech Republic"
  };
}

function buildJourney({ profile, path, interactionIndex, rng }) {
  const sessionId = `sim-session-${profile.id}-${interactionIndex + 1}`;
  const context = buildSearchContext(rng, interactionIndex);
  const relevantProducts = productsForDestination(context.destination);
  const primary = pickPrimaryProduct(relevantProducts, context, rng);
  const addOns = addOnsForDestination(context.destination);
  const cartProducts = path === "browse" || path === "watch" ? [] : [primary, ...addOns.slice(0, path === "complete" ? 2 : 1)];
  const bookingId = `SIM-${profile.id.split("-").pop()}-${interactionIndex + 1}-${Math.floor(1000 + rng() * 9000)}`;
  const events = [];
  const clock = createClock(interactionIndex, rng);

  events.push(envelope("page_view", profile, sessionId, "/", { route: "/", page_type: "home" }, clock()));
  events.push(envelope("search", profile, sessionId, "/search", trackingSearchPayload(context), clock()));
  events.push(envelope("view_search_results", profile, sessionId, "/search", {
    ...trackingSearchPayload(context),
    result_count: relevantProducts.length,
    items: relevantProducts.map((product) => trackingItem(product, 1, context))
  }, clock()));
  events.push(envelope("view_item_list", profile, sessionId, "/search", {
    list_name: "search_results",
    items: relevantProducts.map((product) => trackingItem(product, 1, context))
  }, clock()));

  for (const product of [primary, ...addOns.slice(0, 1)]) {
    events.push(envelope("select_item", profile, sessionId, `/product/${product.slug}`, {
      item_id: product.id,
      item_name: product.name,
      item_type: product.type,
      product_type: trackingItem(product, 1, context).product_type,
      list_name: "search_results",
      destination: product.destination
    }, clock()));
    events.push(envelope("view_item", profile, sessionId, `/product/${product.slug}`, trackingItem(product, 1, context), clock()));
  }

  if (path === "watch" || rng() > 0.72) {
    events.push(envelope("add_to_wishlist", profile, sessionId, `/product/${primary.slug}`, trackingWishlistPayload(primary, context), clock()));
  }

  if (path === "browse" || path === "watch") return events;

  const cart = [];
  for (const product of cartProducts) {
    cart.push({ product, quantity: 1, lineTotal: product.price });
    const totals = totalsFor(cart);
    events.push(envelope("add_to_cart", profile, sessionId, `/product/${product.slug}`, {
      ...trackingItem(product, 1, context),
      ancillary_type: ["transfer", "experience", "insurance", "add_on"].includes(product.type) ? product.type : undefined,
      ...trackingCartPayload(cart, totals, {
        ...context,
        bookingId,
        playbookEvent: ["transfer", "experience", "insurance", "add_on"].includes(product.type) ? "ancillary_added" : undefined
      })
    }, clock()));
  }

  const totals = totalsFor(cart);
  const cartPayload = trackingCartPayload(cart, totals, { ...context, bookingId });
  events.push(envelope("view_cart", profile, sessionId, "/itinerary", cartPayload, clock()));
  events.push(envelope("begin_checkout", profile, sessionId, "/checkout", {
    ...cartPayload,
    playbook_event: "booking_started"
  }, clock()));

  if (path === "abandoned") {
    if (rng() > 0.6) {
      events.push(envelope("payment_failed", profile, sessionId, "/checkout", {
        ...trackingLifecyclePayload({ ...cartPayload, booking_id: bookingId }, context),
        playbook_event: "payment_failed",
        reason: "demo_card_declined"
      }, clock(), { custom: true }));
    }
    return events;
  }

  const purchasePayload = buildPurchasePayload({ profile, context, cart, totals, bookingId });
  events.push(envelope("add_shipping_info", profile, sessionId, "/checkout", purchasePayload, clock()));
  events.push(envelope("add_payment_info", profile, sessionId, "/checkout", {
    ...purchasePayload,
    playbook_event: "payment_completed",
    payment_type: "Demo card"
  }, clock()));
  events.push(envelope("purchase", profile, sessionId, "/thank-you", {
    ...purchasePayload,
    playbook_event: "booking_confirmed"
  }, clock()));

  if (path === "post-trip" || rng() > 0.8) {
    const lifecycle = trackingLifecyclePayload(purchasePayload);
    events.push(envelope("trip_completed", profile, sessionId, "/account", {
      ...lifecycle,
      playbook_event: "trip_completed"
    }, clock(), { custom: true }));
    events.push(envelope("survey_answer", profile, sessionId, "/account", {
      ...lifecycle,
      playbook_event: "review_submitted",
      rating: 5
    }, clock()));
  }

  return events;
}

function buildSearchContext(rng, interactionIndex) {
  const optionsByDestination = [
    { destination: "Lisbon", tripType: "city", departureDate: "2026-09-12", returnDate: "2026-09-18" },
    { destination: "Mallorca", tripType: "family", departureDate: "2026-08-08", returnDate: "2026-08-15" },
    { destination: "Zurich", tripType: "business", departureDate: "2026-10-03", returnDate: "2026-10-05" },
    { destination: "Kyoto", tripType: "culture", departureDate: "2026-11-02", returnDate: "2026-11-11" },
    { destination: "Reykjavik", tripType: "wellness", departureDate: "2026-12-04", returnDate: "2026-12-08" }
  ];
  const base = optionsByDestination[(interactionIndex + Math.floor(rng() * optionsByDestination.length)) % optionsByDestination.length];
  const origin = ["Prague", "Vienna", "Berlin", "London", "Amsterdam"][Math.floor(rng() * 5)];
  const travelers = base.tripType === "family" ? 4 : base.tripType === "business" ? 1 : 2;
  const cabinClass = base.tripType === "business" ? "business" : rng() > 0.78 ? "premium_economy" : "economy";
  return { ...base, origin, travelers, cabinClass };
}

function productsForDestination(destination) {
  const exact = products.filter((product) => product.destination === destination);
  return exact.length ? exact : products.slice(0, 4);
}

function pickPrimaryProduct(candidates, context, rng) {
  const preferred = candidates.find((product) => ["package", "flight", "hotel"].includes(product.type) && product.tripType === context.tripType);
  return preferred || candidates[Math.floor(rng() * candidates.length)] || products[0];
}

function addOnsForDestination(destination) {
  const exact = products.filter((product) => product.destination === destination && ["transfer", "experience", "insurance", "add_on"].includes(product.type));
  const fallback = products
    .filter((product) => ["transfer", "experience", "insurance", "add_on"].includes(product.type))
    .map((product) => ({
      ...product,
      id: `${product.id}-${destination.toLowerCase()}`,
      slug: `${product.slug}-${destination.toLowerCase()}`,
      destination,
      tripType: exact[0]?.tripType || product.tripType
    }));
  return exact
    .concat(fallback)
    .filter((product, index, list) => list.findIndex((item) => item.type === product.type) === index)
    .slice(0, 3);
}

function totalsFor(cart) {
  return {
    total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    count: cart.reduce((sum, item) => sum + item.quantity, 0)
  };
}

function buildPurchasePayload({ profile, context, cart, totals, bookingId }) {
  const cartPayload = trackingCartPayload(cart, totals, {
    ...context,
    bookingId,
    playbookEvent: "booking_confirmed"
  });
  const flightIds = cart.filter((item) => item.product.type === "flight").map((item) => item.product.id);
  const hotelIds = cart.filter((item) => item.product.type === "hotel").map((item) => item.product.id);
  const packageIds = cart.filter((item) => item.product.type === "package").map((item) => item.product.id);
  const addOnIds = cart.filter((item) => !["flight", "hotel", "package"].includes(item.product.type)).map((item) => item.product.id);

  return {
    transaction_id: `txn_sim_${bookingId.toLowerCase()}`,
    booking_id: bookingId,
    email: profile.email,
    phone: profile.phone,
    first_name: profile.firstName,
    surname: profile.surname,
    origin: context.origin,
    destination: cartPayload.destination || context.destination,
    region: cartPayload.region || destinationRegion(context.destination),
    route: cartPayload.route,
    departure_date: context.departureDate,
    depart_date: context.departureDate,
    return_date: context.returnDate,
    travel_start_date: context.departureDate,
    travel_end_date: context.returnDate,
    traveler_count: context.travelers,
    pax: context.travelers,
    cabin_class: context.cabinClass,
    trip_type: context.tripType,
    flight_ids: flightIds,
    hotel_ids: hotelIds,
    package_ids: packageIds,
    add_on_ids: addOnIds,
    cart_value: totals.total,
    booking_value: totals.total,
    total_value: totals.total,
    currency: "EUR",
    coupon: "SIM-DEMO",
    loyalty_tier: profile.loyaltyTier,
    payment_type: "Demo card",
    country: profile.country,
    marketing_consent: true,
    personalization_consent: true,
    items: cartPayload.items,
    line_items: cartPayload.line_items,
    product_types: cartPayload.product_types,
    booked_product_types: cartPayload.booked_product_types,
    item_count: cartPayload.item_count
  };
}

function createClock(interactionIndex, rng) {
  const start = Date.now() - (interactionIndex + 1) * 60 * 60 * 1000;
  let offset = 0;
  return () => {
    offset += 45 + Math.floor(rng() * 90);
    return new Date(start + offset * 1000).toISOString();
  };
}

function envelope(eventName, profile, sessionId, path, payload, timestamp, flags = {}) {
  return {
    event_name: eventName,
    type: eventName,
    timestamp,
    collection: "travel-web",
    source: "cli-web-bot",
    custom_event: flags.custom === true,
    profile_id: profile.id,
    anonymous_id: profile.anonymousId,
    user_id: profile.email,
    session_id: sessionId,
    page_url: `${options.baseUrl}${path}`,
    referrer: options.baseUrl,
    user_agent: "ElsewhereTravelBot/1.0",
    payload: {
      ...payload,
      profile_id: profile.id,
      email: profile.email,
      phone: profile.phone,
      loyalty_tier: profile.loyaltyTier,
      session_id: sessionId,
      event_source: "cli-web-bot"
    }
  };
}

async function sendEvents(events, opts) {
  let sent = 0;
  let skipped = 0;
  for (const event of events) {
    if (event.custom_event && !opts.includeCustom) {
      skipped += 1;
      if (opts.verbose) console.error(`skip custom ${event.event_name} for ${event.profile_id}`);
      continue;
    }
    const response = await fetch(opts.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event)
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`POST ${event.event_name} failed with ${response.status}: ${body.slice(0, 300)}`);
    }
    sent += 1;
    if (opts.verbose) console.error(`sent ${event.event_name} for ${event.profile_id}`);
    if (opts.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, opts.delayMs));
  }
  console.error(`Sent ${sent} events to ${opts.endpoint}${skipped ? `, skipped ${skipped} custom events` : ""}.`);
}
