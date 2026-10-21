# Notification sync performance: research and proposed plan

Status: first mentions slice implemented; performance parity and expansion remain unverified.
Date: 2026-10-21.

## Goal

Bring noStrudel notification cold-start sync times close to the applesauce notification examples while preserving notification completeness, grouping, mute behavior, live updates, and historical browsing.

No successful matched cold-start timings have been collected yet. The observations below identify candidates, not measured bottlenecks. No active roadmap phase has been selected or created.

## Reference material

Read through Applesauce MCP `read_example`:

- `notifications/mentions`: cache hydration, inbound sync, live mentions, on-demand thread sync.
- `notifications/threads`: own events from outboxes, inbound events from inboxes, thread discovery, per-step timing and on-demand thread history.
- `notifications/zaps`: receipt sync, outbox response sync, batched derived state and live updates.
- `loader/sync-loader`: single-filter reconciliation with NIP-77 and paginated REQ fallback.

Also consulted MCP `search_methods` for SyncLoader/SyncLoadRequest and `search_docs` for cache and relay information behavior. Local examples are in `../applesauce/apps/examples/src/examples/`; that checkout was clean at `bfc1a373e820bea22467a7acf1bbd4d0f5b3b5ed`. MCP content may track a different revision; pin the benchmark implementation before timing.

Compatibility was checked against the installed `node_modules/applesauce-loaders/dist/loaders/sync-loader.d.ts`, version 7.0.2. No dependency upgrade is assumed.

## Findings

| Concern | Examples | Current app | Proposed investigation/change |
| --- | --- | --- | --- |
| Historical acquisition | `createSyncLoader`, NIP-77 with paginated fallback | `createTimelineLoader`, limit 100, cache integration in `src/services/notifications/common.ts` | Benchmark bounded sync against current timeline windows with equal filters and completeness |
| Cache | Hydrate matching events into EventStore before starting reconciliation | Existing cache abstraction, trusted cache markers and store integration | Reuse `cacheRequest` and `mapEventsToStore`; avoid a second IndexedDB database or copying example verification shortcuts |
| Relay discovery | A stable sync run receives observable full relay lists | `combineLatest` maps account/inbox emissions to newly created timeline loaders | Normalize and deduplicate lists; test whether mailbox emissions recreate work; let sync loader add/remove relays incrementally |
| Relay roles | Own notes/comments from outboxes, inbound notifications from inboxes | Social loader fetches both inbound and authored events from inboxes | Separate own-event acquisition from inbound acquisition; compare coverage before changing filters |
| Extra relays | Examples include popular relays alongside inboxes | App uses inboxes or fallback relays | Benchmark the same relay set first; evaluate coverage/cost separately using app relay policy rather than copying hardcoded example relays |
| Live updates | Separate subscriptions, started alongside sync | Notification views use timeline windows/cursor loading | Trace existing subscription semantics; add explicit live acquisition with overlap/dedup to prevent a sync-to-live gap |
| Route ownership | Examples mount the data acquisition they need | Overview starts three loaders; replies route reads store only, other tabs use cursor hooks | Give direct navigation a defined acquisition owner and share work across views |
| Derived processing | Examples batch before expensive projections with `auditTime(100/200)` | Thread/repost/zap scans map/sort before downstream throttling | Profile CPU; batch expensive snapshots while retaining every event in accumulated state |
| Completion | Per-relay status, elapsed times and fallback visibility | Counts/lists do not establish sync completeness | Expose diagnostics and distinguish partial/error results from complete results |

Important correctness candidate: `replies.ts` uses `combineLatest([userEvents$, replyEvents$])` where `replyEvents$` emits individual events. A reply seen before its parent enters the authored-event set may not be reconsidered when the parent arrives: only the latest reply is combined again. Reproduce with fixtures before choosing a replacement. Faster parallel loading must not make results depend on arrival order.

The examples' cache hydration helps persistent-cache restarts. It cannot explain the entire advantage for a genuinely empty-cache start. Separate those cases.

## Plan 1: establish a reproducible baseline

1. Pin example revision and installed package versions. Record browser/device, cache backend, account, filters, relays and network conditions with every run. Use public account data without requiring signing.
2. Instrument timestamps for route entry, cache readiness/hydration, mailbox discovery, first request, first accepted notification, useful first render, derived-state settling, and per-relay terminal status. Record event counts, request counts, fallback reasons, bytes where available, and main-thread processing time.
3. Compare example and app using identical frozen `since`/`until`, event kinds and relay sets. Run paired trials in alternating order; report median and p95 with sample count. Keep full app startup time separate from sync-start-to-done time.
4. Cover empty persistent cache + empty store, populated persistent cache + empty store, and in-session navigation. Separate direct tab entry from overview-to-tab navigation.
5. Include NIP-77, REQ-only, advertised-but-broken NIP-77, slow/offline, and auth-required relays. Record partial failure instead of counting it as successful complete sync.

Deliverable: baseline table and trace identifying network, cache, classification and render contributions. Fix the parity tolerance after observing variance; an initial candidate is app median within 20% of the matched example, with a separately recorded p95 guard. This tolerance is proposed, not an established requirement.

## Plan 2: implement and measure one end-to-end slice

Start with mentions, which exercises shared inbound social acquisition without requiring full thread-history expansion.

1. Build a shared notification sync service using the existing pool, event store, cache and logging. Keep event filter construction outside UI. One sync request accepts one filter; compose independent filters explicitly.
2. Hydrate the requested cache window before reconciling. Define hydration failure fallback and retry/invalidation behavior, including cache backend changes. Avoid permanently treating a failed hydration as successful.
3. Scope shared runs by account, normalized filter/window and relay policy. Feed changing relay lists into a stable run. Define ownership, reference counting and cleanup; no duplicate runs from counts and tabs.
4. Acquire live events with a captured boundary and overlap before or alongside history sync. Preserve app relay authentication behavior. Do not replace the app's pool with the example's standalone pool.
5. Mount the slice on direct mentions entry and show loading/error/empty states based on acquisition status. Keep existing classification and list virtualization initially.
6. Repeat matched benchmarks. Compare event IDs, not just displayed counts. Use traces to decide whether processing changes are needed.

Gate: this slice must demonstrate measured improvement and equivalent results before migrating all views.

## Plan 3: expand acquisition to all notification views

1. Separate authored social events on outboxes from inbound social events on inboxes; retain required kind 1, kind 1111 and long-form behavior. Ensure replies can resolve parents older than the selected notification window without syncing all authored history on every visit. Investigate pointer author hints and targeted parent loading.
2. Make direct replies entry initiate acquisition. Add fixture coverage for reply-before-parent and parent-before-reply ordering, addressable parents, duplicates and account switching.
3. Reuse social acquisition across replies, mentions, quotes and threads, and add independent repost/zap filters. Overview starts only the domains needed for its counts; each tab independently starts its required domain.
4. Keep full thread expansion on demand. Do not copy the examples' response/thank-you workflows or expand notification semantics solely to match their dashboards.
5. Define bounded initial windows and explicit older-history loading. Preserve overview time-range selection and historical browsing; a full sync of all history is not the initial default. Avoid redundant overlapping windows where practical.
6. Test relay additions/removals, account/logout transitions and tab navigation for retained work and stale data. Dynamic relay observables can remain open: use status snapshots for progress, not stream completion. `done` may become false when new relays appear; stabilize the known relay set when reporting benchmark completion.

## Plan 4: optimize derived state where profiling justifies it

1. Fix demonstrated arrival-order issues before tuning batching. Prefer stable ID indexes/sets for dedup and deterministic classification.
2. Keep event accumulation lossless; batch expensive grouping/sorting/output after accumulation and before React updates. Do not throttle the incoming event stream and silently drop notifications.
3. Verify mutable accumulator sharing, event deletion/replacement, mute changes, account changes and late parent arrival. Ensure a final trailing update is delivered.
4. Retain virtualized lists and measure time grouping, metadata loading and row rendering separately. Avoid starting profile/parent loads for every offscreen row.

## Validation and completion

- Deterministic acquisition tests: hydration-before-sync, one shared run, dynamic relays without restart, cancellation/account isolation, cache failure, fallback/auth errors, history/live overlap and bounded-window pagination.
- Deterministic notification fixtures: arrival order, duplicates across relays, NIP-10/NIP-22, long-form/addressable parents, quotes versus mentions, grouping, mutes and late parents.
- Browser checks: overview and all six tabs from a cold direct URL; cached restart; switching tabs; older history; live event arrival; account switching; partial relay failure.
- Implementation checks: focused tests, TypeScript/build, and changed-file aislop gate with a freshly fetched base as described in AGENTS.md. Planning-only work does not require application tests.
- Final benchmark report compares median/p95, useful first render, complete event coverage and request volume against the pinned examples. Reject speedups caused by narrower filters, fewer relays, dropped events or premature completion. Record remaining differences and their measured causes.

## Open decisions to resolve with evidence

- Exact parity tolerance and representative account sizes/time windows.
- How app-configured fallback relays supplement known inboxes, if at all.
- Shared acquisition lifetime across route changes and memory budget for historical windows.
- Minimum UI progress needed to distinguish syncing, empty, and incomplete results.
- Whether cache initialization, verification, parent resolution or derived-state work dominates after acquisition changes.

## Implementation complete (2026-10-21)

All four implementation stages are complete on `perf/notification-sync`. Shared cache-first sync now serves all six notification tabs and the overview, with bounded initial history, explicit older loading, live acquisition, targeted parent resolution, account isolation, and partial failure/retry states. Social projections are shared and batched without dropping events; late parents, deletions, replacements and mute changes update the results.

Local protocol comparisons match the pinned examples with equal event coverage. Browser functional checks passed across all views. Public-relay cold-start performance remains for manual verification: unreliable public connections did not yield a valid paired comparison. Further automated performance testing was stopped at the user's request.

See [results and manual handoff](notification-sync-performance-results.md) for measurements, validation and limitations.
