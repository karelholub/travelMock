export const personas = {
  anonymous: {
    id: "anonymous",
    label: "Anonymous browser",
    hero: "Find somewhere else to have the same thoughts.",
    loyaltyTier: "Guest",
    preferredDestination: "Lisbon",
    preferredTripType: "city",
    travelerKind: "leisure",
    budgetAffinity: "mid",
    recentProductIds: ["flight-lisbon-enlightenment", "hotel-lisbon-optimistic-view"],
    cartRestoreIds: ["flight-lisbon-enlightenment", "hotel-lisbon-optimistic-view"]
  },
  abandoner: {
    id: "abandoner",
    label: "Returning cart abandoner",
    hero: "Your almost-booked escape is still waiting.",
    loyaltyTier: "Silver Almost There",
    preferredDestination: "Lisbon",
    preferredTripType: "city",
    travelerKind: "leisure",
    budgetAffinity: "mid",
    recentProductIds: ["hotel-lisbon-optimistic-view", "exp-sunset-networking"],
    cartRestoreIds: ["flight-lisbon-enlightenment", "hotel-lisbon-optimistic-view", "transfer-emotional-support"]
  },
  vip: {
    id: "vip",
    label: "VIP calm seeker",
    hero: "Priority calm, upgraded views, fewer queues.",
    loyaltyTier: "Platinum Calm",
    preferredDestination: "Kyoto",
    preferredTripType: "culture",
    travelerKind: "vip",
    budgetAffinity: "premium",
    recentProductIds: ["package-kyoto-pretend-understand", "exp-pretend-understand"],
    cartRestoreIds: ["package-kyoto-pretend-understand", "addon-lounge-nap"]
  },
  family: {
    id: "family",
    label: "Family traveler",
    hero: "Trips engineered for snacks, naps, and tactical patience.",
    loyaltyTier: "Gold Snack Strategist",
    preferredDestination: "Mallorca",
    preferredTripType: "family",
    travelerKind: "family",
    budgetAffinity: "value",
    recentProductIds: ["package-mallorca-family-patience", "addon-baggage-metaphorical"],
    cartRestoreIds: ["package-mallorca-family-patience", "transfer-emotional-support"]
  },
  business: {
    id: "business",
    label: "Business traveler",
    hero: "Meetings elsewhere, but with better breakfast.",
    loyaltyTier: "Corporate Smooth",
    preferredDestination: "Zurich",
    preferredTripType: "business",
    travelerKind: "business",
    budgetAffinity: "premium",
    recentProductIds: ["flight-zurich-breakfast-meeting", "hotel-zurich-executive-nap"],
    cartRestoreIds: ["flight-zurich-breakfast-meeting", "hotel-zurich-executive-nap", "addon-lounge-nap"]
  }
};

export const scenarioNotes = [
  "Anonymous intent capture",
  "Destination affinity",
  "Itinerary abandonment",
  "Transport and add-on upsells",
  "Facultative excursion cross-sells",
  "Loyalty/VIP personalization",
  "Family and business persona switching",
  "Post-booking lifecycle"
];
