import { personas } from "../data/personas.js";

export async function hydrateProfile(personaId) {
  try {
    const response = await fetch(`/api/profile?persona=${encodeURIComponent(personaId)}`);
    if (response.ok) return await response.json();
  } catch {
    // Static demos fall back to local profile fields when no serverless proxy is available.
  }

  const persona = personas[personaId] || personas.anonymous;
  return {
    source: "local-static-fallback",
    persona: persona.id,
    fields: {
      next_trip_destination: persona.preferredDestination,
      next_departure_date: "2026-09-12",
      booking_value: persona.id === "vip" ? 4820 : persona.id === "family" ? 2450 : 1640,
      loyalty_tier: persona.loyaltyTier,
      recommended_add_on_ids: persona.id === "business"
        ? ["addon-lounge-nap", "transfer-emotional-support"]
        : ["transfer-emotional-support", "addon-baggage-metaphorical", "exp-sunset-networking"]
    }
  };
}
