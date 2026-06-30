export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const persona = url.searchParams.get("persona") || "anonymous";
  const token = process.env.MEIRO_PROFILE_API_TOKEN;

  if (token && process.env.MEIRO_PROFILE_API_URL) {
    const upstream = await fetch(`${process.env.MEIRO_PROFILE_API_URL}?persona=${encodeURIComponent(persona)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await upstream.json();
    response.status(200).json(data);
    return;
  }

  response.status(200).json({
    source: "local-proxy-fallback",
    persona,
    fields: {
      next_trip_destination: persona === "business" ? "Zurich" : persona === "family" ? "Mallorca" : "Lisbon",
      next_departure_date: "2026-09-12",
      booking_value: persona === "vip" ? 4820 : 1640,
      loyalty_tier: persona === "vip" ? "Platinum Calm" : "Standard Adventurer",
      recommended_add_on_ids: ["addon-lounge-nap", "transfer-emotional-support", "exp-pretend-understand"]
    }
  });
}
