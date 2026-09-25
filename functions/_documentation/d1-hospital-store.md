# Hospital D1 store

The Pages Functions keep working without D1. When the `HOSPITAL_DB` binding is
present, verified HIRA search results are stored as snapshots and reused for
default searches or temporary upstream failures.

## Cloudflare setup

1. Create a D1 database for the Pages project.
2. Bind it to Pages Functions with the variable name `HOSPITAL_DB`.
3. Apply the SQL files in `migrations/` in numeric order.
4. Deploy the GitHub `main` branch again.
5. Check `/api/data-status`. `database.configured` and `database.ready` should
   be true. The hospital count grows as verified live searches are performed.

Do not store visitor submissions in these tables. Only official API responses
with a HIRA institution code, name, and address are accepted by the runtime.

## Current behavior

- Live searches still prefer the HIRA API.
- Successful live results are written with `context.waitUntil()`.
- Non-live requests prefer D1 when it contains matching records.
- Coordinate/radius searches always use the upstream API because the initial
  schema does not claim to implement precise distance ordering.
- A missing binding, missing migration, or empty result falls back to the
  existing static dataset without breaking the site.
