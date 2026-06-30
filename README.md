# Elsewhere Travel Co. Demo

Mock travel ecommerce site for Meiro CDP and Engage journey demos.

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

Useful options:

- `--profiles=N`: number of synthetic profiles
- `--interactions=N`: journeys per profile
- `--path=mixed|complete|abandoned|browse|watch|post-trip`
- `--endpoint=URL`: override the collection endpoint
- `--base-url=URL`: set the site URL used in `page_url`
- `--include-custom`: also send custom playbook events like `trip_completed` and `payment_failed`
- `--verbose`: print send progress

The generated payloads include the fields needed for the travel playbooks: search intent, watched routes, booking start, abandoned booking, purchase, product types, line items, ancillaries, trip completion, and review signals.
