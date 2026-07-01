import { products } from "../catalog/products.js";
import { trackingItem } from "./schema.js";

const opportunityRules = [
  {
    type: "transfer",
    opportunityType: "transport",
    requiredWith: ["flight", "hotel", "package"],
    reason: "Transport was not booked for a confirmed trip."
  },
  {
    type: "insurance",
    opportunityType: "insurance",
    requiredWith: ["flight", "hotel", "package"],
    reason: "Insurance was not booked for a confirmed trip."
  },
  {
    type: "experience",
    opportunityType: "facultative_excursion",
    requiredWith: ["hotel", "package"],
    reason: "No facultative excursion was booked for this destination."
  },
  {
    type: "hotel",
    opportunityType: "hotel_attach",
    requiredWith: ["flight"],
    reason: "Flight was booked without a hotel attach."
  }
];

export function buildMissedSalesOpportunities(enrichedItems = [], context = {}) {
  const boughtProducts = enrichedItems.map((item) => item.product).filter(Boolean);
  const boughtIds = new Set(boughtProducts.map((product) => product.id));
  const boughtTypes = new Set(boughtProducts.map((product) => product.type));
  const destinations = [...new Set(boughtProducts.map((product) => product.destination).filter(Boolean))];
  const relevantDestinations = destinations.length ? destinations : [context.destination].filter(Boolean);

  const opportunities = [];
  for (const destination of relevantDestinations) {
    for (const rule of opportunityRules) {
      if (boughtTypes.has(rule.type)) continue;
      if (!rule.requiredWith.some((type) => boughtTypes.has(type))) continue;
      const product = findOpportunityProduct(rule.type, destination, context.tripType, boughtIds);
      if (!product) continue;
      opportunities.push(opportunityPayload(product, rule, context));
    }
  }

  const deduped = opportunities.filter((opportunity, index, list) => (
    list.findIndex((item) => item.item_id === opportunity.item_id && item.opportunity_type === opportunity.opportunity_type) === index
  ));
  const totalValue = deduped.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return {
    missed_sales_opportunities: deduped,
    missed_sales_opportunity_count: deduped.length,
    missed_sales_opportunity_value: totalValue,
    missed_sales_opportunity_ids: deduped.map((item) => item.item_id),
    missed_sales_opportunity_types: [...new Set(deduped.map((item) => item.opportunity_type))],
    missed_sales_followup_reasons: deduped.map((item) => item.followup_reason)
  };
}

function findOpportunityProduct(type, destination, tripType, boughtIds) {
  return products.find((product) => product.type === type && product.destination === destination && !boughtIds.has(product.id))
    || products.find((product) => product.type === type && product.tripType === tripType && !boughtIds.has(product.id))
    || products.find((product) => product.type === type && !boughtIds.has(product.id));
}

function opportunityPayload(product, rule, context) {
  const item = trackingItem(product, 1, context);
  return {
    opportunity_id: `${rule.opportunityType}_${product.id}`,
    opportunity_type: rule.opportunityType,
    followup_reason: rule.reason,
    item_id: item.item_id,
    item_slug: item.item_slug,
    item_name: item.item_name,
    item_type: item.item_type,
    product_type: item.product_type,
    destination: item.destination,
    region: item.region,
    route: item.route,
    trip_type: item.trip_type,
    price: item.price,
    value: item.value,
    currency: item.currency,
    margin: product.margin,
    priority: priorityFor(rule.opportunityType, product),
    details: product.details || []
  };
}

function priorityFor(opportunityType, product) {
  if (opportunityType === "insurance" || opportunityType === "transport") return "high";
  if (product.margin >= 0.45) return "high";
  return "medium";
}
