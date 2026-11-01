// Adapted from ../napplet-frame/src/lib/cvm.ts; transport and identity remain host-owned.
import {
  finalizeEvent,
  generateSecretKey,
  matchFilter,
  nip44,
  verifyEvent,
  type Event as NostrEvent,
  type Filter,
} from "nostr-tools";
import type { ServiceHandler } from "@kehto/runtime";
import { logger } from "../../helpers/debug";
import type { NappletTransportSigner } from "./transport-identity";
import type { CvmRelayTransport } from "./cvm-relay-transport";
const log = logger.extend("napplet-cvm");

type Json = Record<string, unknown>;
type Send = (message: Json & { type: string }) => void;
type Message = Json & { jsonrpc: "2.0"; id?: string | number; method?: string };
type Server = { pubkey: string; relays?: string[] };
type Operation = {
  done: boolean;
  signal: AbortSignal;
  session?: Session;
  payment?: unknown;
  finish(error?: string, payload?: Json): void;
  check(): void;
};
type Correlation = {
  operation: Operation;
  original: string | number;
  internal: boolean;
  progress?: string | number;
  resolve(message: Message): void;
};
type Session = {
  server: Server;
  signer: NappletTransportSigner;
  pubkey: string;
  stop?: () => void;
  publishRelays?: string[];
  responseRelays?: string[];
  routing?: Promise<void>;
  initialized: boolean;
  initializing?: Promise<void>;
  closed: boolean;
  pending: Map<string, Correlation>;
  used: Set<string>;
  incoming: Set<string>;
  seen: Set<string>;
  send: Send;
};
const object = (value: unknown): value is Json => !!value && typeof value === "object" && !Array.isArray(value);
const hex = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const rpcId = (value: unknown): value is string | number =>
  typeof value === "string" || (typeof value === "number" && Number.isSafeInteger(value));
const idKey = (value: string | number) => JSON.stringify(value);
function announcementMetadata(content: string): Json {
  try {
    const parsed = JSON.parse(content);
    return object(parsed) ? parsed : {};
  } catch {
    // Some announcements carry their metadata only in tags.
    return {};
  }
}
const kinds = [11316, 11317];
const defaultRelays = ["wss://relay.contextvm.org"];
const maxBytes = 256 * 1024;

function relayHints(value: unknown): string[] {
  if (value === undefined) return [...defaultRelays];
  if (!Array.isArray(value) || value.length > 8) throw new Error("invalid request");
  if (!value.length) return [...defaultRelays];
  return [
    ...new Set(
      value.map((item) => {
        if (typeof item !== "string") throw new Error("invalid request");
        let url: URL;
        try {
          url = new URL(item);
          if (url.protocol !== "wss:") throw new Error();
          if (
            url.hostname === "localhost" ||
            url.hostname.endsWith(".localhost") ||
            url.hostname.endsWith(".local") ||
            url.hostname.includes(":") ||
            /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)
          )
            throw new Error();
        } catch {
          throw new Error("invalid request");
        }
        if (url.username || url.password || url.hash) throw new Error("invalid request");
        return url.href;
      }),
    ),
  ];
}

function serverRef(value: unknown): Server {
  if (!object(value) || !hex(value.pubkey)) throw new Error("invalid request");
  return { pubkey: value.pubkey, relays: relayHints(value.relays) };
}

function mcpMessage(value: unknown): Message {
  if (!object(value) || value.jsonrpc !== "2.0") throw new Error("invalid message");
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 48 * 1024) throw new Error();
  } catch {
    throw new Error("invalid message");
  }
  const hasId = "id" in value;
  if (hasId && !rpcId(value.id)) throw new Error("invalid message");
  if ("method" in value) {
    if (
      typeof value.method !== "string" ||
      !value.method ||
      "result" in value ||
      "error" in value ||
      ("params" in value && !object(value.params))
    )
      throw new Error("invalid message");
  } else if (
    !hasId ||
    "result" in value === "error" in value ||
    "params" in value ||
    ("result" in value && !object(value.result)) ||
    ("error" in value &&
      (!object(value.error) || !Number.isSafeInteger(value.error.code) || typeof value.error.message !== "string"))
  )
    throw new Error("invalid message");
  return value as Message;
}

function options(value: unknown) {
  if (value !== undefined && !object(value)) throw new Error("invalid request");
  const opts = (value ?? {}) as Json;
  const timeout = opts.timeoutMs === undefined ? 30000 : opts.timeoutMs;
  if (typeof timeout !== "number" || !Number.isInteger(timeout) || timeout < 1 || timeout > 300000)
    throw new Error("invalid timeout");
  if (
    (opts.initialize !== undefined && typeof opts.initialize !== "boolean") ||
    (opts.payment !== undefined && !["deny", "prompt", "allow"].includes(String(opts.payment)))
  )
    throw new Error("invalid request");
  return { timeout, initialize: opts.initialize !== false, payment: opts.payment ?? "prompt" };
}

/** One instance per verified endpoint; a supplied transport identity is shared with WebRTC. */
export function createCvmService(
  authorize: (signal: AbortSignal) => Promise<string | void>,
  signer: NappletTransportSigner,
  transport: CvmRelayTransport,
) {
  let active = true;
  let permissionScope: string | void;
  const sessions = new Map<string, Session>();
  const operations = new Set<Operation>();

  async function permitted(op: Operation) {
    const scope = await authorize(op.signal);
    op.check();
    if (permissionScope !== scope) {
      permissionScope = scope;
      for (const session of sessions.values()) close(session);
      op.check();
    }
  }

  function start(type: string, id: string, send: Send, timeout: number, work: (op: Operation) => Promise<Json>) {
    const controller = new AbortController();
    const timer = setTimeout(() => op.finish("relay timeout"), timeout);
    const op: Operation = {
      done: false,
      signal: controller.signal,
      check() {
        if (!active || op.done || op.session?.closed) throw new Error("session closed");
      },
      finish(error, payload = {}) {
        if (op.done) return;
        op.done = true;
        clearTimeout(timer);
        operations.delete(op);
        controller.abort();
        send({ type: `${type}.result`, id, ...(error ? { error } : payload) });
      },
    };
    operations.add(op);
    void work(op).then(
      (payload) => op.finish(undefined, payload),
      (error) => op.finish(error instanceof Error ? error.message : "policy denied"),
    );
  }

  function close(session: Session) {
    if (session.closed) return;
    session.closed = true;
    sessions.delete(session.server.pubkey);
    for (const op of operations) if (op.session === session) op.finish("session closed");
    session.stop?.();
    session.pending.clear();
    session.incoming.clear();
  }

  async function publish(session: Session, message: Message, op: Operation) {
    op.check();
    await permitted(op);
    op.check();
    const inner = await session.signer.signEvent({
      kind: 25910,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", session.server.pubkey], ["support_encryption"], ["support_encryption_ephemeral"]],
      content: JSON.stringify(message),
    });
    const wrapKey = generateSecretKey();
    const wrap = finalizeEvent(
      {
        kind: 21059,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", session.server.pubkey]],
        content: nip44.v2.encrypt(
          JSON.stringify(inner),
          nip44.v2.utils.getConversationKey(wrapKey, session.server.pubkey),
        ),
      },
      wrapKey,
    );
    wrapKey.fill(0);
    op.check();
    const result = await transport.publish(wrap, session.publishRelays!);
    op.check();
    if (!result) throw new Error("relay timeout");
  }

  async function resolveRouting(session: Session, op: Operation) {
    if (!session.routing)
      session.routing = (async () => {
        const fallback = session.server.relays!;
        session.publishRelays = fallback;
        session.responseRelays = fallback;
        if (!transport.loadRelayList) return;
        try {
          const { event } = await transport.loadRelayList(session.server.pubkey);
          // CEP-17 is NIP-65. Verify the actual event, not just parsed helper items.
          if (!event || event.pubkey !== session.server.pubkey || event.kind !== 10002 || !verifyEvent(event)) return;
          const forDirection = (direction: "read" | "write") =>
            event.tags
              .filter((tag) => tag[0] === "r" && (!tag[2] || tag[2] === direction))
              .flatMap((tag) => {
                try {
                  return relayHints([tag[1]]);
                } catch {
                  return [];
                }
              })
              .slice(0, 8);
          const inbound = forDirection("read");
          const outbound = forDirection("write");
          if (inbound.length) session.publishRelays = [...new Set(inbound)];
          if (outbound.length) session.responseRelays = [...new Set(outbound)];
        } catch (error) {
          log("Relay metadata unavailable", error);
        }
      })();
    await session.routing;
    op.check();
  }

  function correlated(session: Session, message: Message, op: Operation, internal = false): Promise<Message> {
    op.check();
    const transportId = crypto.randomUUID();
    const params = object(message.params) ? message.params : undefined;
    const meta = params && object(params._meta) ? params._meta : undefined;
    const progress = rpcId(meta?.progressToken) ? meta.progressToken : undefined;
    const outgoing =
      progress === undefined
        ? message
        : { ...message, params: { ...params, _meta: { ...meta, progressToken: transportId } } };
    return new Promise((resolve, reject) => {
      const abort = () => {
        session.pending.delete(transportId);
        reject(new Error("session closed"));
      };
      op.signal.addEventListener("abort", abort, { once: true });
      session.pending.set(transportId, {
        operation: op,
        original: message.id!,
        internal,
        progress,
        resolve(reply) {
          session.pending.delete(transportId);
          op.signal.removeEventListener("abort", abort);
          resolve({ ...reply, id: message.id });
        },
      });
      void publish(session, { ...outgoing, id: transportId }, op).catch((error) => {
        session.pending.delete(transportId);
        op.signal.removeEventListener("abort", abort);
        reject(error);
      });
    });
  }

  async function receive(session: Session, event: NostrEvent) {
    if (
      !active ||
      session.closed ||
      typeof event.content !== "string" ||
      event.content.length > maxBytes * 2 ||
      session.seen.has(event.id)
    )
      return;
    try {
      if (
        ![1059, 21059].includes(event.kind) ||
        !verifyEvent(event) ||
        !event.tags.some((t) => t[0] === "p" && t[1] === session.pubkey)
      )
        return;
      const inner = JSON.parse(await session.signer.nip44.decrypt(event.pubkey, event.content)) as NostrEvent;
      if (!active || session.closed) return;
      if (
        inner.kind !== 25910 ||
        inner.pubkey !== session.server.pubkey ||
        !verifyEvent(inner) ||
        !inner.tags.some((t) => t[0] === "p" && t[1] === session.pubkey)
      )
        return;
      if (session.seen.has(inner.id)) return;
      session.seen.add(event.id);
      session.seen.add(inner.id);
      if (session.seen.size > 2048) close(session);
      if (session.closed) return;
      const message = mcpMessage(JSON.parse(inner.content));
      const payment =
        message.method === "notifications/payment_required" || (object(message.error) && message.error.code === -32042);
      if (payment) {
        // There is deliberately no wallet, retry, or paid-authorization path.
        for (const op of operations)
          if (op.session === session)
            op.finish(op.payment === "deny" || op.payment === "allow" ? "payment denied" : "payment required");
        close(session);
        return;
      }
      if (!message.method) {
        const pending = session.pending.get(String(message.id));
        if (pending && !pending.operation.done) pending.resolve(message);
        // Unknown/late responses never become unsolicited events.
        return;
      }
      if (message.method === "notifications/progress") {
        const params = object(message.params) ? message.params : undefined;
        const pending = session.pending.get(String(params?.progressToken));
        if (!pending || pending.internal || pending.operation.done || pending.progress === undefined) return;
        message.params = { ...params, progressToken: pending.progress };
        // Progress is not a deadline extension. CEP-22/41 are not advertised.
      }
      if (message.id !== undefined) {
        if (session.incoming.size >= 32 || session.incoming.has(idKey(message.id))) return;
        session.incoming.add(idKey(message.id));
      }
      session.send({ type: "cvm.event", server: { pubkey: session.server.pubkey }, message });
    } catch (error) {
      log("Ignored invalid CVM message", error);
    }
  }

  function subscribe(session: Session) {
    if (session.stop) return;
    const filter: Filter = { kinds: [1059, 21059], "#p": [session.pubkey] };
    const stop = transport.subscribe(session.responseRelays!, filter, {
      eoseEventsCallback: (events) => {
        for (const event of events) receive(session, event);
      },
      liveEventCallback: (event) => receive(session, event),
      closedCallback: () => close(session),
    });
    if (session.closed) stop();
    else session.stop = stop;
  }

  async function initialize(session: Session, op: Operation) {
    if (session.initialized) return;
    if (!session.initializing) {
      session.initializing = (async () => {
        const reply = await correlated(
          session,
          {
            jsonrpc: "2.0",
            id: "initialize",
            method: "initialize",
            params: {
              protocolVersion: "2025-11-25",
              capabilities: {},
              clientInfo: { name: "noStrudel", version: "1.0.0" },
            },
          },
          op,
          true,
        );
        op.check();
        if (
          reply.error ||
          !object(reply.result) ||
          reply.result.protocolVersion !== "2025-11-25" ||
          !object(reply.result.capabilities)
        )
          throw new Error("initialization failed");
        await publish(session, { jsonrpc: "2.0", method: "notifications/initialized" }, op);
        session.initialized = true;
      })().catch((error) => {
        // An uncertain initialization must not leave a reusable half-session.
        for (const waiting of operations) if (waiting.session === session) waiting.finish("initialization failed");
        close(session);
        throw error;
      });
    }
    await session.initializing;
    op.check();
  }

  async function request(raw: Json, send: Send, op: Operation): Promise<Json> {
    const server = serverRef(raw.server);
    const message = mcpMessage(raw.message);
    const opts = options(raw.options);
    op.payment = opts.payment;
    // Shell-owned initialization/payment negotiation cannot be driven as raw MCP.
    const methods = [
      "tools/list",
      "tools/call",
      "resources/list",
      "resources/read",
      "prompts/list",
      "prompts/get",
      "ping",
      "notifications/cancelled",
    ];
    if (message.method && !methods.includes(message.method)) throw new Error("policy denied");
    await permitted(op);
    let session = sessions.get(server.pubkey);
    if (!session) {
      if (sessions.size >= 8) throw new Error("policy denied");
      const pubkey = await signer.getPublicKey();
      op.check();
      session = sessions.get(server.pubkey) ?? {
        server,
        signer,
        pubkey,
        initialized: false,
        closed: false,
        pending: new Map(),
        used: new Set(),
        incoming: new Set(),
        seen: new Set(),
        send,
      };
      sessions.set(server.pubkey, session);
    }
    op.session = session;
    if (message.method && message.id !== undefined) {
      if (session.used.has(idKey(message.id)) || session.used.size >= 4096) throw new Error("invalid message");
      session.used.add(idKey(message.id));
    } else if (!message.method && !session.incoming.delete(idKey(message.id!))) throw new Error("invalid message");
    let outgoing = message;
    if (message.method === "notifications/cancelled") {
      const original = object(message.params) ? message.params.requestId : undefined;
      const entry = [...session.pending].find(([, pending]) => !pending.internal && pending.original === original);
      if (!entry) throw new Error("invalid message");
      outgoing = { ...message, params: { ...(message.params as Json), requestId: entry[0] } };
    }
    await resolveRouting(session, op);
    subscribe(session);
    if (opts.initialize && message.method && message.method !== "notifications/cancelled")
      await initialize(session, op);
    op.check();
    if (!message.method || message.id === undefined) {
      await publish(session, outgoing, op);
      return { message: null };
    }
    return { message: await correlated(session, outgoing, op) };
  }

  async function discover(raw: unknown, op: Operation): Promise<Json> {
    if (raw !== undefined && !object(raw)) throw new Error("invalid request");
    const query = (raw ?? {}) as Json;
    if (
      (query.search !== undefined && typeof query.search !== "string") ||
      (query.limit !== undefined && (!Number.isSafeInteger(query.limit) || Number(query.limit) < 1))
    )
      throw new Error("invalid request");
    if (query.limit !== undefined && Number(query.limit) > 100) throw new Error("invalid request");
    const requested = query.kinds === undefined ? kinds : query.kinds;
    if (!Array.isArray(requested) || requested.some((kind) => !Number.isInteger(kind) || kind < 0))
      throw new Error("invalid request");
    if (requested.some((kind) => !kinds.includes(kind))) throw new Error("unsupported kind");
    if (!requested.length) return { servers: [] };
    const relays = relayHints(query.relays);
    await permitted(op);
    op.check();
    const announcements = new Map<string, NostrEvent>();
    await new Promise<void>((resolve, reject) => {
      let stop: (() => void) | undefined;
      let complete = false;
      const finish = (error?: Error) => {
        if (complete) return;
        complete = true;
        stop?.();
        op.signal.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve();
      };
      const abort = () => finish(new Error("relay timeout"));
      const filter = { kinds: requested, limit: Math.min(Number(query.limit ?? 100) * 2, 200) };
      const accept = (event: NostrEvent) => {
        try {
          if (event.content.length > maxBytes || !verifyEvent(event) || !matchFilter(filter, event)) return;
          const key = `${event.pubkey}:${event.kind}`;
          const previous = announcements.get(key);
          if (
            previous &&
            (previous.created_at > event.created_at ||
              (previous.created_at === event.created_at && previous.id < event.id))
          )
            return;
          if (announcements.size < 400 || previous) announcements.set(key, event);
        } catch {
          return;
        }
      };
      op.signal.addEventListener("abort", abort, { once: true });
      try {
        stop = transport.subscribe(relays, filter, {
          maxEoseTimeout: 6000,
          eoseEventsCallback(events) {
            events.forEach(accept);
            finish();
          },
          liveEventCallback: accept,
          closedCallback: () => finish(new Error("relay timeout")),
        });
        if (complete) stop();
      } catch (error) {
        finish(error instanceof Error ? error : new Error("relay timeout"));
      }
    });
    op.check();
    const found = new Map<string, Json>();
    for (const event of announcements.values()) {
      const server = found.get(event.pubkey) ?? { pubkey: event.pubkey };
      const tag = (name: string) => event.tags.find((tag) => tag[0] === name)?.[1];
      if (event.kind === 11316) {
        const metadata = announcementMetadata(event.content);
        const name = tag("name") ?? metadata.name;
        const description = tag("about") ?? metadata.description;
        if (typeof name === "string") server.name = name.slice(0, 256);
        if (typeof description === "string") server.description = description.slice(0, 4096);
      }
      if (event.kind === 11317) server.capabilities = ["tools"];
      // Discovery relays are not evidence of operational relays; pricing stays unknown.
      found.set(event.pubkey, server);
    }
    const search = String(query.search ?? "").toLowerCase();
    return {
      servers: [...found.values()]
        .filter((server) =>
          `${server.name ?? ""} ${server.description ?? ""} ${server.capabilities ?? ""}`
            .toLowerCase()
            .includes(search),
        )
        .slice(0, Number(query.limit ?? 100)),
    };
  }

  const service: ServiceHandler & { dispose(): void; revoke(): void } = {
    descriptor: { name: "cvm", version: "1.0.0" },
    handleMessage(_windowId, message, send: Send) {
      const raw = message as unknown as Json;
      const type = String(raw.type);
      const recognized = [
        "cvm.discover",
        "cvm.request",
        "cvm.close",
        "cvm.registry.list",
        "cvm.registry.has",
        "cvm.registry.describe",
        "cvm.registry.call",
      ];
      if (!recognized.includes(type) || typeof raw.id !== "string") return;
      const fail = (error: string) => send({ type: `${type}.result`, id: raw.id as string, error });
      if (!active) {
        fail("session closed");
        return;
      }
      try {
        if (type === "cvm.close") {
          const server = serverRef(raw.server);
          const session = sessions.get(server.pubkey);
          if (session) close(session);
          send({ type: `${type}.result`, id: raw.id });
        } else if (type.startsWith("cvm.registry.")) {
          if (type === "cvm.registry.has") send({ type: `${type}.result`, id: raw.id, has: false });
          else fail("unsupported method");
        } else {
          if (operations.size >= 8) {
            fail("policy denied");
            return;
          }
          const timeout = type === "cvm.request" ? options(raw.options).timeout : 30000;
          start(type, raw.id, send, timeout, (op) =>
            type === "cvm.discover" ? discover(raw.query, op) : request(raw, send, op),
          );
        }
      } catch (error) {
        fail(error instanceof Error ? error.message : "invalid request");
      }
    },
    onWindowDestroyed() {
      service.dispose();
    },
    revoke() {
      for (const op of operations) op.finish("policy denied");
      for (const session of sessions.values()) close(session);
    },
    dispose() {
      active = false;
      transport.close();
      for (const op of operations) op.finish("session closed");
      for (const session of sessions.values()) close(session);
    },
  };
  return service;
}
