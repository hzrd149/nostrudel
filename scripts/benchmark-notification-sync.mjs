// aislop-ignore-file ai-slop/console-leftover -- this command reports benchmark measurements as JSON on stdout
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { COMMENT_KIND } from "applesauce-common/helpers";
import { createSyncLoader, createTimelineLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import { kinds, matchFilter, nip19, verifyEvent } from "nostr-tools";
import {
  concat,
  defer,
  firstValueFrom,
  from,
  ignoreElements,
  map,
  of,
  Subscription,
  take,
  tap,
  filter as rxFilter,
  timeout,
} from "rxjs";
import { isFromCache, markFromCache } from "applesauce-core/helpers";
import { loadTypescript } from "./load-typescript.mjs";
import { createNotificationFixture, FIXTURE_USER, startNotificationRelay } from "./notification-relay-fixture.mjs";

const { values } = parseArgs({
  options: {
    pubkey: { type: "string" },
    relays: { type: "string" },
    since: { type: "string" },
    until: { type: "string" },
    runs: { type: "string", default: "5" },
    timeout: { type: "string", default: "60000" },
    cache: { type: "string" },
    fixture: { type: "boolean" },
    "fixture-count": { type: "string", default: "1000" },
    "fixture-mode": { type: "string", default: "negentropy" },
    "fixture-latency": { type: "string", default: "10" },
    "fixture-cache": { type: "string", default: "empty" },
    help: { type: "boolean" },
  },
});

if (values.help) {
  console.log(`Usage: node scripts/benchmark-notification-sync.mjs --pubkey <hex|npub> --relays <wss://relay,...>
  --since <unix> --until <unix>  Freeze the inclusive range (default: last 2 days)
  --runs <n>                   Paired trials, rotating method order (default: 5)
  --timeout <ms>               Deadline per trial (default: 60000)
  --cache <json-file>          Optional array of events, hydrated into each fresh store
  --fixture                   Use a localhost relay with real NIP-77 negotiation
  --fixture-count <n>          Generated inbound events (default: 1000)
  --fixture-mode <mode>        negentropy, request, fallback or auth
  --fixture-latency <ms>       Response delay per fixture message (default: 10)
  --fixture-cache <mode>       empty, partial or full cache seed

Compares acquisition only: timeline (old loader defaults), example-sync (hydrate then sync),
and app-sync (the production helper, including live acquisition). Uses identical kind 1,
kind 30023 and kind 1111 #p filters. Each trial gets a new pool and store. Does not sign.
Reports partial/error trials separately. This excludes browser startup, persistent cache I/O,
notification classification and rendering. A seeded cache is an in-memory restart simulation.`);
  process.exit(0);
}

const requestedPubkey = values.pubkey ?? (values.fixture ? FIXTURE_USER : undefined);
const pubkey = requestedPubkey?.startsWith("npub") ? nip19.decode(requestedPubkey).data : requestedPubkey;
if (typeof pubkey !== "string" || !/^[a-f0-9]{64}$/i.test(pubkey)) throw new Error("Provide a hex pubkey or npub");
let relays = [...new Set((values.relays ?? "").split(",").filter(Boolean))];
if ((!values.fixture && !relays.length) || relays.some((relay) => !/^wss?:\/\//.test(relay)))
  throw new Error("Provide WebSocket relay URLs");
const until = Number(values.until ?? Math.floor(Date.now() / 1000));
const since = Number(values.since ?? Math.max(0, until - 2 * 86400));
const runs = Number(values.runs);
const deadline = Number(values.timeout);
if (
  ![since, until, runs, deadline].every(Number.isSafeInteger) ||
  since < 0 ||
  since >= until ||
  runs < 1 ||
  deadline < 1
) {
  throw new Error("Invalid range, run count or deadline");
}
const filter = { kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND], "#p": [pubkey], since, until };
const fixtureCount = Number(values["fixture-count"]);
const fixtureLatency = Number(values["fixture-latency"]);
if (
  !Number.isSafeInteger(fixtureCount) ||
  fixtureCount < 1 ||
  !Number.isSafeInteger(fixtureLatency) ||
  fixtureLatency < 0 ||
  !["negentropy", "request", "fallback", "auth"].includes(values["fixture-mode"]) ||
  !["empty", "partial", "full"].includes(values["fixture-cache"])
)
  throw new Error("Invalid fixture options");
const fixtureEvents = values.fixture ? createNotificationFixture(pubkey, since, until, fixtureCount) : [];
const fixture = values.fixture
  ? await startNotificationRelay(fixtureEvents, { mode: values["fixture-mode"], latency: fixtureLatency })
  : undefined;
if (fixture) relays = [fixture.url];
let cached = values.cache ? JSON.parse(await readFile(values.cache, "utf8")) : [];
if (!Array.isArray(cached)) throw new Error("Cache file must contain a JSON event array");

if (fixture && !values.cache && values["fixture-cache"] !== "empty") {
  cached =
    values["fixture-cache"] === "full" ? fixtureEvents : fixtureEvents.slice(0, Math.floor(fixtureEvents.length / 2));
}
const { createNotificationSync } = await loadTypescript(
  new URL("../src/helpers/notification-sync.ts", import.meta.url),
);
try {
  const results = [];
  const methods = ["timeline", "example-sync", "app-sync"];
  for (let round = 0; round < runs; round++) {
    for (let offset = 0; offset < methods.length; offset++) {
      const method = methods[(round + offset) % methods.length];
      results.push(await measure(method, round + 1, createNotificationSync));
    }
  }
  const coverage = Array.from({ length: runs }, (_, i) => {
    const trials = results.filter((trial) => trial.round === i + 1);
    const union = new Set(trials.flatMap((trial) => trial.ids));
    return {
      round: i + 1,
      comparable: trials.every((trial) => trial.complete),
      methods: trials.map((trial) => ({
        method: trial.method,
        events: trial.ids.length,
        missingFromUnion: [...union].filter((id) => !trial.ids.includes(id)),
      })),
    };
  });
  const matchedRounds = new Set(
    coverage
      .filter((round) => round.comparable && round.methods.every((method) => method.missingFromUnion.length === 0))
      .map((round) => round.round),
  );
  const summary = methods.map((method) => {
    const trials = results.filter(
      (trial) => trial.method === method && trial.complete && matchedRounds.has(trial.round),
    );
    const durations = trials.map((trial) => trial.elapsedMs).sort((a, b) => a - b);
    const percentile = (p) => (durations.length ? durations[Math.max(0, Math.ceil(p * durations.length) - 1)] : null);
    return {
      method,
      completeTrials: results.filter((trial) => trial.method === method && trial.complete).length,
      matchedTrials: trials.length,
      medianMs: percentile(0.5),
      p95Ms: percentile(0.95),
    };
  });
  console.log(
    JSON.stringify(
      {
        environment: {
          node: process.version,
          platform: process.platform,
          transport: fixture ? "localhost NIP-77 fixture" : "public relay",
          signatureVerifier: "nostr-tools",
          cacheBackend: "in-memory seed",
        },
        fixture: fixture
          ? {
              mode: values["fixture-mode"],
              events: fixtureCount,
              latency: fixtureLatency,
              cache: values["fixture-cache"],
            }
          : undefined,
        filter,
        relays,
        cachedEvents: cached.length,
        deadline,
        summary,
        coverage,
        results: results.map(({ ids, ...result }) => ({ ...result, events: ids.length })),
      },
      (_key, value) => (value instanceof Error ? { name: value.name, message: value.message } : value),
      2,
    ),
  );
} finally {
  await fixture?.close();
}

async function measure(method, round, createNotificationSync) {
  const eventStore = new EventStore({ verifyEvent: (event) => isFromCache(event) || verifyEvent(event) });
  const initialMetrics = fixture ? { ...fixture.metrics } : undefined;
  const pool = new RelayPool();
  const subscriptions = new Subscription();
  const syncLoader = createSyncLoader({ eventStore, pool });
  const cacheRequest = (filters) => {
    const selected = new Map();
    for (const filter of filters) {
      const matches = cached.filter((event) => matchFilter(filter, event)).sort((a, b) => b.created_at - a.created_at);
      for (const event of matches.slice(0, filter.limit ?? Infinity)) selected.set(event.id, event);
    }
    return from(
      [...selected.values()].map((event) => {
        const copy = structuredClone(event);
        markFromCache(copy);
        return copy;
      }),
    );
  };
  const started = performance.now();
  let firstEventMs;
  let relayStatus;
  let complete = false;
  let error;
  subscriptions.add(
    eventStore.insert$.subscribe((event) => {
      if (matchFilter(filter, event)) firstEventMs ??= performance.now() - started;
    }),
  );
  try {
    const status$ = createTrialStatus(method, {
      eventStore,
      pool,
      subscriptions,
      syncLoader,
      cacheRequest,
      createNotificationSync,
      onError: (cause) => {
        error = cause instanceof Error ? cause.message : String(cause);
      },
    });
    const settled = await firstValueFrom(
      status$.pipe(
        tap((status) => {
          relayStatus = status.relays;
        }),
        rxFilter((status) => status.done),
        take(1),
        timeout(deadline),
      ),
    );
    relayStatus = settled.relays;
    complete = !settled.failed && !error;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    subscriptions.unsubscribe();
    pool.close();
  }
  const result = {
    method,
    round,
    complete,
    elapsedMs: performance.now() - started,
    firstEventMs,
    wire: fixture
      ? Object.fromEntries(Object.entries(fixture.metrics).map(([key, value]) => [key, value - initialMetrics[key]]))
      : undefined,
    error,
    relayStatus,
    ids: eventStore.getByFilters(filter).map((event) => event.id),
  };
  eventStore.dispose();
  return result;
}

function createTrialStatus(
  method,
  { eventStore, pool, subscriptions, syncLoader, cacheRequest, createNotificationSync, onError },
) {
  let status$;
  if (method === "timeline") {
    const { since: _since, until: _until, ...timeless } = filter;
    const loader = createTimelineLoader(pool, relays, timeless, { eventStore, cache: cacheRequest, limit: 100 });
    status$ = loader.status$.pipe(
      map((statuses) => ({
        done:
          statuses.filter((status) => status.source !== "cache").length === relays.length &&
          statuses.every(
            (status) => status.state === "covered" || status.state === "prefetching" || status.state === "incomplete",
          ),
        failed: statuses.some((status) => status.state === "incomplete"),
        relays: statuses,
      })),
    );
    subscriptions.add(
      loader({ since, until }).subscribe({
        error: (cause) => {
          onError(cause);
        },
      }),
    );
  } else if (method === "example-sync") {
    status$ = concat(
      cacheRequest([filter]).pipe(mapEventsToStore(eventStore), ignoreElements()),
      defer(() => syncLoader({ relays, filter }).status$),
    ).pipe(
      map((status) => ({
        done: status.done,
        failed: Object.values(status.relays).some((relay) => relay.state === "error" || relay.state === "skipped"),
        relays: status.relays,
      })),
    );
  } else {
    status$ = createNotificationSync({
      filter,
      window: { since, until },
      relays$: of(relays),
      eventStore,
      syncLoader,
      cacheRequest,
      subscribeLive: (relays, filter) => pool.subscription(relays, filter),
      onError: (cause) => {
        onError(cause);
      },
    }).pipe(
      map((state) => ({
        done: state.done,
        failed: state.failedRelays.length > 0 || !!state.liveError,
        relays: state.windows[0]?.status?.relays,
      })),
    );
  }
  return status$;
}
