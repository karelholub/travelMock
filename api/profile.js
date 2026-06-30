import { localProfile, meiroProfileAttributes, normalizeProfileResponse } from "../src/api/profileAttributes.js";

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const persona = url.searchParams.get("persona") || "anonymous";
  const identity = {
    email: url.searchParams.get("email") || "",
    phone: url.searchParams.get("phone") || "",
    userId: url.searchParams.get("userId") || "",
    meiroUserId: url.searchParams.get("meiroUserId") || ""
  };
  const fallback = localProfile(persona, identity);
  const token = process.env.MEIRO_PROFILE_API_KEY || process.env.MEIRO_PROFILE_API_TOKEN;
  const apiUrl = process.env.MEIRO_PROFILE_API_URL || "https://travel.eu1.pipes.meiro.io/profile-api/customer-lookup";
  const hasIdentifier = Object.values(identity).some(Boolean);

  if (token && hasIdentifier) {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-api-key": token
      },
      body: JSON.stringify({
        persona,
        identifiers: {
          email: identity.email || undefined,
          phone: identity.phone || undefined,
          user_id: identity.userId || undefined,
          meiro_user_id: identity.meiroUserId || undefined
        },
        attributes: meiroProfileAttributes
      })
    });
    const data = await upstream.json();
    response.status(200).json(normalizeProfileResponse(data, fallback.fields));
    return;
  }

  response.status(200).json({ ...fallback, source: "local-proxy-fallback" });
}
