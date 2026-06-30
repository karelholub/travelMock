import { localProfile, normalizeProfileResponse } from "./profileAttributes.js";

function profileQuery(personaId, identity = {}) {
  const params = new URLSearchParams({ persona: personaId || "anonymous" });
  const userId = identity.user_id || identity.userId;
  if (userId) params.set("user_id", userId);
  if (identity.email) params.set("email", identity.email);
  if (identity.phone) params.set("phone", identity.phone);
  return params;
}

export async function hydrateProfile(personaId, identity = {}) {
  const fallback = localProfile(personaId, identity);
  try {
    const response = await fetch(`/api/profile?${profileQuery(personaId, identity)}`);
    if (response.ok) return normalizeProfileResponse(await response.json(), fallback.fields);
  } catch {
    // Static demos fall back to local profile fields when no serverless proxy is available.
  }

  return fallback;
}
