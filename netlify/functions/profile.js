import { localProfile, meiroProfileAttributes, normalizeProfileResponse } from "../../src/api/profileAttributes.js";

const defaultProfileApiUrl = "https://travel.eu1.pipes.meiro.io/profile-api/customer-lookup";

function env(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name];
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function identityFromUrl(url) {
  return {
    email: url.searchParams.get("email") || "",
    phone: url.searchParams.get("phone") || "",
    userId: url.searchParams.get("user_id") || url.searchParams.get("userId") || ""
  };
}

function lookupPayload(identity, persona) {
  return {
    persona,
    identifiers: {
      user_id: identity.userId || undefined,
      email: identity.email || undefined
    },
    attributes: meiroProfileAttributes
  };
}

function identifierCandidates(identifiers) {
  return [
    ["user_id", identifiers.user_id],
    ["email", identifiers.email]
  ].filter(([, value]) => value);
}

async function fetchProfileWithIdentifier(apiUrl, headers, identifier) {
  const [identifierType, identifierValue] = identifier;
  const getUrl = new URL(apiUrl);
  getUrl.searchParams.set("identifier_type", identifierType);
  getUrl.searchParams.set("identifier_value", identifierValue);
  return fetch(getUrl, { headers });
}

async function fetchProfile(apiUrl, apiKey, payload) {
  const headers = {
    accept: "application/json",
    "X-API-Token": apiKey
  };
  const candidates = identifierCandidates(payload.identifiers);
  let lastResponse = null;
  for (const candidate of candidates) {
    const response = await fetchProfileWithIdentifier(apiUrl, headers, candidate);
    if (response.ok || ![404, 422].includes(response.status)) return response;
    lastResponse = response;
  }
  return lastResponse || new Response(null, { status: 400 });
}

export default async (request) => {
  const url = new URL(request.url);
  const persona = url.searchParams.get("persona") || "anonymous";
  const identity = identityFromUrl(url);
  const fallback = localProfile(persona, identity);
  const apiKey = env("MEIRO_PROFILE_API_KEY") || env("MEIRO_PROFILE_API_TOKEN");
  const apiUrl = env("MEIRO_PROFILE_API_URL") || defaultProfileApiUrl;
  const hasIdentifier = Object.values(identity).some(Boolean);

  if (!apiKey || !hasIdentifier) return json(fallback);

  try {
    const upstream = await fetchProfile(apiUrl, apiKey, lookupPayload(identity, persona));
    if (!upstream.ok) {
      return json({
        ...fallback,
        source: "local-fallback-after-profile-api-error",
        profileApiStatus: upstream.status
      });
    }
    return json(normalizeProfileResponse(await upstream.json(), fallback.fields));
  } catch (error) {
    return json({
      ...fallback,
      source: "local-fallback-after-profile-api-error",
      profileApiError: error instanceof Error ? error.message : "Profile API lookup failed"
    });
  }
};

export const config = {
  path: "/api/profile",
  method: ["GET"]
};
