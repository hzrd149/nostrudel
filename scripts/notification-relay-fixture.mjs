import { createServer } from "node:http";
import { createRequire } from "node:module";
import { finalizeEvent, getPublicKey, matchFilters, nip19 } from "nostr-tools";

const require = createRequire(import.meta.resolve("vite"));
const { WebSocketServer } = require("ws");
// The fixture must speak the same NIP-77 version as the pinned client package.
const { Negentropy, NegentropyStorageVector } = await import(
  new URL("./lib/negentropy.js", import.meta.resolve("applesauce-relay/relay"))
);
const ownKey = new Uint8Array(32).fill(1);
const otherKey = new Uint8Array(32).fill(2);
export const FIXTURE_USER = getPublicKey(ownKey);
export const FIXTURE_INVOICE =
  "lnbc100n1p5pjxjk9qypqqqdqqxqrrsssp54ttukd5xxy2nmdzf864yjereuf9v3pyzl66hpqgxa0e8fvlzf6aspp5z6twjtwde82ec7wfcqw2m63v48r6fyw78753wxh7zjlvuru7tapsp6c9lq6m4d55u9jkxuqpepdknnzznfu05wl73swyn52z3pnkzyxrlkqf3t5jkw2hq7ukasuh5wgazvfwkkzrf0aqk4k0zluzu4rx8wqq8sut0l";

export function createNotificationFixture(user, since, until, count = 1000) {
  const sign = (kind, created_at, tags, content = "", key = otherKey) =>
    finalizeEvent({ kind, created_at, tags, content }, key);
  const root = sign(1, Math.max(0, since - 86400), [], "Older parent", ownKey);
  const events = [root];
  for (let index = 0; index < count; index++) {
    const created_at = until - 1 - Math.floor((index * (until - since - 1)) / count);
    const tags = [
      ["p", user],
      ["e", root.id, "", "root"],
      ["e", root.id, "", "reply"],
    ];
    const content = `Fixture ${index}: nostr:${nip19.npubEncode(user)}`;
    events.push(
      index % 5 === 0
        ? sign(
            1111,
            created_at,
            [
              ["p", user],
              ["E", root.id],
              ["K", "1"],
              ["e", root.id],
              ["k", "1"],
            ],
            content,
          )
        : sign(1, created_at, tags, content),
    );
  }
  const extra = [
    [
      1,
      10,
      [
        ["p", user],
        ["q", root.id],
      ],
      "Fixture quote",
    ],
    [
      30023,
      11,
      [
        ["p", user],
        ["d", "fixture-article"],
      ],
      `nostr:${nip19.npubEncode(user)}`,
    ],
    [
      6,
      12,
      [
        ["p", user],
        ["e", root.id],
      ],
      JSON.stringify(root),
    ],
  ];
  for (const [kind, offset, tags, content] of extra)
    events.push(sign(kind, Math.max(0, until - offset), tags, content));
  const request = sign(9734, Math.max(0, until - 13), [
    ["p", user],
    ["e", root.id],
    ["relays", "ws://127.0.0.1/"],
  ]);
  events.push(
    sign(9735, Math.max(0, until - 13), [
      ["p", user],
      ["e", root.id],
      ["description", JSON.stringify(request)],
      ["bolt11", FIXTURE_INVOICE],
    ]),
  );
  return events;
}

/** A localhost NIP-01/NIP-11/NIP-77 fixture; never publishes to external relays. */
export async function startNotificationRelay(events, { mode = "negentropy", latency = 10, port = 0 } = {}) {
  const metrics = { requests: 0, negotiations: 0, sentEvents: 0, sentBytes: 0, receivedBytes: 0 };
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/nostr+json", "Access-Control-Allow-Origin": "*" });
    res.end(
      JSON.stringify({ supported_nips: mode === "request" ? [1, 11] : [1, 11, 77], limitation: { max_limit: 100 } }),
    );
  });
  const wss = new WebSocketServer({ server });
  wss.on("connection", (socket) => attachConnection(socket, events, metrics, mode, latency));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    url: `ws://127.0.0.1:${server.address().port}/`,
    metrics,
    publish: (event) => {
      events.push(event);
      for (const socket of wss.clients) socket.publishFixtureEvent(event);
    },
    close: async () => {
      for (const socket of wss.clients) socket.terminate();
      await new Promise((resolve) => wss.close(resolve));
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

function attachConnection(socket, events, metrics, mode, latency) {
  const states = new Map();
  const subscriptions = new Map();
  const timers = new Set();
  const send = (message) => {
    if (socket.readyState !== 1) return;
    const data = JSON.stringify(message);
    metrics.sentBytes += Buffer.byteLength(data);
    if (message[0] === "EVENT") metrics.sentEvents++;
    socket.send(data);
  };
  const respond = async (message) => {
    const [verb, id, ...args] = message;
    if (verb === "REQ") {
      metrics.requests++;
      if (mode === "auth") {
        send(["AUTH", "fixture-challenge"]);
        send(["CLOSED", id, "auth-required: fixture"]);
        return;
      }
      subscriptions.set(id, args);
      const selected = new Map();
      for (const filter of args) {
        const matches = events
          .filter((event) => matchFilters([filter], event))
          .sort((a, b) => b.created_at - a.created_at);
        for (const event of matches.slice(0, Math.min(filter.limit ?? 100, 100))) selected.set(event.id, event);
      }
      for (const event of selected.values()) send(["EVENT", id, event]);
      send(["EOSE", id]);
    } else if (verb === "NEG-OPEN") {
      metrics.negotiations++;
      if (mode === "fallback" || mode === "request" || mode === "auth") {
        send(["NEG-ERR", id, mode === "auth" ? "auth-required: fixture" : "error: fixture sync unavailable"]);
        return;
      }
      const storage = new NegentropyStorageVector();
      for (const event of events.filter((event) => matchFilters([args[0]], event)))
        storage.insert(event.created_at, event.id);
      storage.seal();
      const state = new Negentropy(storage);
      states.set(id, state);
      const [reply] = await state.reconcile(args[1]);
      if (reply !== null) send(["NEG-MSG", id, reply]);
    } else if (verb === "NEG-MSG" && states.has(id)) {
      const [reply] = await states.get(id).reconcile(args[0]);
      if (reply !== null) send(["NEG-MSG", id, reply]);
    } else if (verb === "NEG-CLOSE") states.delete(id);
    else if (verb === "CLOSE") subscriptions.delete(id);
  };
  socket.on("message", (data) => {
    metrics.receivedBytes += data.length;
    const message = JSON.parse(String(data));
    const handle = setTimeout(() => {
      timers.delete(handle);
      respond(message).catch((error) => send(["NOTICE", error.message]));
    }, latency);
    timers.add(handle);
  });
  socket.on("close", () => {
    for (const timer of timers) clearTimeout(timer);
  });
  socket.on("error", () => socket.terminate());
  socket.publishFixtureEvent = (event) => {
    for (const [id, filters] of subscriptions) if (matchFilters(filters, event)) send(["EVENT", id, event]);
  };
}
