# Notification sync results

Implemented all notification tabs and overview using shared cache-first sync, bounded two-day initial history, explicit older loading, live subscriptions and partial failure/retry states. Replies and quotes resolve missing parents on demand. Shared social snapshots batch classification and grouping while preserving events, mute changes, deletions and late parent updates.

## Matched local acquisition measurements

Five matched trials per case; milliseconds, median / p95. All methods returned identical event IDs. These measure acquisition against a local protocol fixture, excluding browser startup, persistent-cache I/O and rendering.

| Case | Previous timeline | Example pattern | App sync |
| --- | ---: | ---: | ---: |
| Empty cache, NIP-77 | 1275 / 1671 | 1182 / 1236 | 1180 / 1218 |
| Populated cache, NIP-77 | 1303 / 1452 | 25 / 43 | 25 / 29 |
| Empty cache, REQ | 1321 / 1372 | 1264 / 1328 | 1250 / 1276 |
| Broken NIP-77 fallback | 1280 / 1360 | 1253 / 1294 | 1246 / 1266 |

Reference examples pinned at `bfc1a373e820bea22467a7acf1bbd4d0f5b3b5ed`; installed applesauce-loaders 7.0.2 and core 7.0.1. Raw results are in `notification-sync-benchmarks/`. Failed or mismatched rounds are excluded. Public-relay trials had no matched complete rounds, so they establish no public performance parity claim.

## Validation

- 127 tests across 21 files pass; TypeScript and production build pass.
- Browser verification passed 13 scenarios with zero runtime errors: all tabs, overview, older history, live arrival, persistent-cache reload, partial failure/retry, mutes, account changes and mobile layout.
- Implementation-only lint scores 100 with zero findings. Full branch lint still reports 20 pre-existing errors in 11 unrelated files.
- The processing fixture reduces a 1000-event burst from 1000 thread projections to one shared social projection. Batching adds a deliberate 100 ms trailing delay; cold CPU p95 did not improve in that small sample.

## Manual handoff

Automated performance testing is complete; the user will verify real-account/public-relay performance manually. Open `/notifications`, compare first load and cached reload, then visit replies, mentions, threads, quotes, reposts and zaps. Check useful first results, counts, older history and incoming live events.

“All Known” counts events already in the store; initial acquisition stays bounded, with older history loaded explicitly. Local measurements show acquisition parity with the examples, while real-network end-to-end performance remains unverified.
