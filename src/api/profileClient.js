import { localProfile, normalizeProfileResponse } from "./profileAttributes.js";

function profileQuery(personaId, identity = {}) {
  const params = new URLSearchParams({ persona: personaId || "anonymous" });
  ["email", "phone", "userId", "meiroUserId"].forEach((key) => {
    if (identity[key]) params.set(key, identity[key]);
  });
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
