# Elsewhere Travel Co. Demo

Mock travel ecommerce site for Meiro CDP and Engage journey demos.

## Profile API

The app calls `/api/profile` from the browser. On Netlify this is handled by a serverless proxy so the Meiro Profile API key never ships to frontend code.

Set these Netlify environment variables before enabling live Profile API hydration:

- `MEIRO_PROFILE_API_KEY`: Profile API key
- `MEIRO_PROFILE_API_URL`: optional override, defaults to `https://travel.eu1.pipes.meiro.io/profile-api/customer-lookup`

The proxy currently requests and normalizes these attributes, while preserving any future fields returned by Meiro:

- `Last Purchased Item Destination`
- `User's Email (from Purchase or Shipping)`
- `User's First Name (from Shipping)`
- `Last Viewed Item List Name`
- `Total Lifetime Purchase Value`

Without an API key or checkout identity, the app returns local demo profile fields.

## Event Simulator

Generate realistic web-event journeys from the command line:

```bash
npm run simulate:events -- --profiles=3 --path=mixed
```

By default the simulator is a dry run and prints NDJSON. Add `--send` to POST to the Meiro collection endpoint:

```bash
npm run simulate:events -- --profiles=25 --interactions=2 --path=complete --send
npm run simulate:events -- --profiles=25 --path=abandoned --send
```

When events do not appear in Meiro, start with a tiny debug batch:

```bash
npm run simulate:events -- --profiles=1 --interactions=1 --path=complete --send --debug --fail-fast
```

Debug mode prints the endpoint, event counts, sample payloads, every HTTP response status/header/body snippet, and a final success/failure summary.

Useful options:

- `--profiles=N`: number of synthetic profiles
- `--interactions=N`: journeys per profile
- `--path=mixed|complete|abandoned|browse|watch|post-trip`
- `--endpoint=URL`: override the collection endpoint
- `--base-url=URL`: set the site URL used in `page_url`
- `--include-custom`: also send custom playbook events like `trip_completed` and `payment_failed`
- `--verbose`: print send progress
- `--debug`: print payload samples and HTTP response details
- `--fail-fast`: stop at the first failed POST
- `--sample=N`: number of payload samples to print in debug mode

The generated payloads include the fields needed for the travel playbooks: search intent, watched routes, booking start, abandoned booking, purchase, product types, line items, ancillaries, trip completion, and review signals.
Family-style journeys also include `adult_count`, `child_count`, `child_ages`, and total `pax`.
