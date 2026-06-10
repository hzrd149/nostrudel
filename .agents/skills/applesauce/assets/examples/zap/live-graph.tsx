/**
 * Live space-themed force graph of zaps across multiple relays. Designed as a TV screensaver.
 * @tags nip-57, zap, force-graph, live, visualization, screensaver
 * @related zap/timeline, zap/zap-history
 */
import { Zap } from "applesauce-common/casts";
import { castEventStream } from "applesauce-common/observable";
import { castUser, EventStore, mapEventsToStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, kinds } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import { useLocalStorage } from "react-use";

const eventStore = new EventStore();
const pool = new RelayPool();

// Event loader fetches profiles (kind 0) and relay lists when needed
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

// A handful of popular relays where zaps are routinely published
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://nostr.wine",
  "wss://relay.snort.social",
];

// Time-range presets translate to a `since` offset in seconds for the
// relay subscription. "live" is "from now onward".
type TimeRange = "live" | "1m" | "5m" | "10m";
const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "1m", label: "Last minute" },
  { value: "5m", label: "Last 5 minutes" },
  { value: "10m", label: "Last 10 minutes" },
];
const TIME_RANGE_OFFSETS: Record<TimeRange, number> = {
  live: 0,
  "1m": 60,
  "5m": 5 * 60,
  "10m": 10 * 60,
};

// ---------------------------------------------------------------------------
// Graph data model
// ---------------------------------------------------------------------------

type ZapNode = NodeObject & {
  id: string; // pubkey
  pubkey: string;
  zapCount: number;
  totalSats: number;
  spawnedAt: number;
  // Avatar / label populated when the profile arrives
  displayName: string;
  picture?: string;
  imageEl?: HTMLImageElement;
};

type ZapLink = LinkObject & {
  id: string;
  source: string | ZapNode;
  target: string | ZapNode;
  amount: number; // sats
};

/** Avatar radius scales gently with a node's zap activity. */
function nodeRadius(node: ZapNode): number {
  return 14 + Math.min(24, Math.log2(node.totalSats + 1) * 1.6);
}

/** Warm orange/gold gradient that matches the lightning theme. */
function linkColor(amount: number): string {
  if (amount >= 10_000) return "rgba(255, 215, 0, 0.85)";
  if (amount >= 1_000) return "rgba(255, 165, 64, 0.75)";
  return "rgba(255, 120, 90, 0.65)";
}

// ---------------------------------------------------------------------------
// Relay multi-select
// ---------------------------------------------------------------------------

function RelayMultiSelect({ selected, onChange }: { selected: string[]; onChange: (relays: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const [known, setKnown] = useLocalStorage<string[]>("zap-live-graph-known-relays", DEFAULT_RELAYS);

  const allRelays = useMemo(() => {
    const set = new Set<string>([...DEFAULT_RELAYS, ...(known ?? []), ...selected]);
    return Array.from(set);
  }, [known, selected]);

  const toggle = (relay: string) => {
    if (selected.includes(relay)) onChange(selected.filter((r) => r !== relay));
    else onChange([...selected, relay]);
  };

  const addCustom = () => {
    const url = custom.trim();
    if (!url || !url.startsWith("wss://")) return;
    setKnown(Array.from(new Set([...(known ?? []), url])));
    if (!selected.includes(url)) onChange([...selected, url]);
    setCustom("");
  };

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-sm bg-black/40 border border-white/20 text-white hover:bg-black/60">
        Relays · {selected.length}
      </summary>
      <div className="dropdown-content z-10 mt-2 w-80 rounded-box bg-base-200/95 backdrop-blur border border-white/10 p-3 shadow-xl">
        <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
          {allRelays.map((relay) => (
            <label key={relay} className="label cursor-pointer justify-start gap-2 py-1">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-warning"
                checked={selected.includes(relay)}
                onChange={() => toggle(relay)}
              />
              <span className="font-mono text-xs truncate">{relay}</span>
            </label>
          ))}
        </div>
        <div className="join mt-2 w-full">
          <input
            type="text"
            placeholder="wss://your-relay.example"
            className="input input-sm input-bordered join-item flex-1"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
          />
          <button className="btn btn-sm btn-warning join-item" onClick={addCustom}>
            Add
          </button>
        </div>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Main example
// ---------------------------------------------------------------------------

export default function ZapLiveGraph() {
  // Selected relays (persisted)
  const [selectedRelays, setSelectedRelays] = useLocalStorage<string[]>(
    "zap-live-graph-relays",
    DEFAULT_RELAYS.slice(0, 3),
  );
  const relays = selectedRelays ?? [];

  // Time range — picks how far back the relay subscription's `since` reaches.
  const [timeRange, setTimeRange] = useLocalStorage<TimeRange>("zap-live-graph-range", "live");
  const range = timeRange ?? "live";

  // Resizable container
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Fullscreen toggle — the container element becomes the fullscreen target so
  // the canvas resizes correctly via our existing ResizeObserver.
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (containerRef.current) {
      void containerRef.current.requestFullscreen();
    }
  }, []);

  // Persistent graph state — kept on a ref so we never reset positions
  const nodesRef = useRef<Map<string, ZapNode>>(new Map());
  const linksRef = useRef<Map<string, ZapLink>>(new Map());

  // React-visible snapshot of graph data
  const [graphData, setGraphData] = useState<{ nodes: ZapNode[]; links: ZapLink[] }>({
    nodes: [],
    links: [],
  });

  // Stats
  const [zapsSeen, setZapsSeen] = useState(0);

  // Debounce graph refresh to avoid re-rendering on every event
  const refreshScheduled = useRef(false);
  const scheduleRefresh = useCallback(() => {
    if (refreshScheduled.current) return;
    refreshScheduled.current = true;
    requestAnimationFrame(() => {
      refreshScheduled.current = false;
      setGraphData({
        nodes: Array.from(nodesRef.current.values()),
        links: Array.from(linksRef.current.values()),
      });
    });
  }, []);

  // Make sure new nodes have a profile observer attached.
  // We track pubkeys we've already wired up.
  const wiredProfiles = useRef<Set<string>>(new Set());
  const wireProfile = useCallback(
    (node: ZapNode) => {
      if (wiredProfiles.current.has(node.pubkey)) return;
      wiredProfiles.current.add(node.pubkey);
      const user = castUser(node.pubkey, eventStore);
      const sub = user.profile$.subscribe((profile) => {
        node.displayName = getDisplayName(profile, node.pubkey.slice(0, 8));
        const picture = getProfilePicture(profile, `https://robohash.org/${node.pubkey}.png?size=128x128`);
        if (picture && picture !== node.picture) {
          node.picture = picture;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.referrerPolicy = "no-referrer";
          img.src = picture;
          img.onload = () => {
            node.imageEl = img;
            scheduleRefresh();
          };
          img.onerror = () => {
            if (!picture.includes("robohash")) {
              const fallback = new Image();
              fallback.crossOrigin = "anonymous";
              fallback.src = `https://robohash.org/${node.pubkey}.png?size=128x128`;
              fallback.onload = () => {
                node.imageEl = fallback;
                scheduleRefresh();
              };
            }
          };
        }
        scheduleRefresh();
      });
      // No cleanup needed; we want the profile observer to live for the
      // lifetime of this screensaver.
      void sub;
    },
    [scheduleRefresh],
  );

  // Ensure a node exists for a pubkey
  const ensureNode = useCallback(
    (pubkey: string, now: number): ZapNode => {
      const existing = nodesRef.current.get(pubkey);
      if (existing) return existing;
      // Spawn near the center with a small random offset so the engine has
      // something to work with from the very first frame.
      const node: ZapNode = {
        id: pubkey,
        pubkey,
        zapCount: 0,
        totalSats: 0,
        spawnedAt: now,
        displayName: pubkey.slice(0, 8),
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
      };
      nodesRef.current.set(pubkey, node);
      wireProfile(node);
      return node;
    },
    [wireProfile],
  );

  // (1) Relay → EventStore ingestion
  // The `since` filter is anchored to a stable timestamp computed from the
  // selected time range so we don't restart the subscription on every render.
  const since = useMemo(() => {
    const offsetSec = TIME_RANGE_OFFSETS[range];
    return Math.floor(Date.now() / 1000) - offsetSec;
  }, [range]);

  use$(() => {
    if (relays.length === 0) return;

    return pool
      .subscription(relays, { kinds: [kinds.Zap], since }, { reconnect: true })
      .pipe(mapEventsToStore(eventStore));
  }, [relays.join("|"), since]);

  // (2) EventStore → graph processing
  useEffect(() => {
    const sub = eventStore
      .filters({ kinds: [kinds.Zap] })
      .pipe(castEventStream(Zap, eventStore))
      .subscribe((zap) => {
        if (!zap) return;
        const senderKey = zap.sender.pubkey;
        const recipientKey = zap.recipient.pubkey;
        if (senderKey === recipientKey) return; // self-zaps don't make for a useful edge

        // EventStore dedupes by event id, but we still skip if we've already
        // drawn this receipt (e.g. it arrived again from another source).
        const linkId = zap.event.id;
        if (linksRef.current.has(linkId)) return;

        const amount = Math.max(1, Math.round(zap.amount / 1000));

        const sender = ensureNode(senderKey, Date.now());
        const recipient = ensureNode(recipientKey, Date.now());
        sender.zapCount += 1;
        sender.totalSats += amount;
        recipient.zapCount += 1;
        recipient.totalSats += amount;

        linksRef.current.set(linkId, {
          id: linkId,
          source: senderKey,
          target: recipientKey,
          amount,
        });

        setZapsSeen((c) => c + 1);
        scheduleRefresh();
      });
    return () => sub.unsubscribe();
  }, [ensureNode, scheduleRefresh]);

  // ForceGraph2D ref — used to tune the physics for slow, gentle motion
  const fgRef = useRef<ForceGraphMethods<ZapNode, ZapLink>>();
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Push nodes apart so avatars don't overlap, and pull connected pairs softly together
    fg.d3Force("charge")?.strength(-180);
    const linkForce = fg.d3Force("link");
    if (linkForce && "distance" in linkForce) {
      (linkForce as any).distance(140).strength(0.04);
    }

    // Gentle gravity toward (0, 0) — keeps disconnected clusters from drifting
    // off-screen. Written as a tiny custom d3-force so we don't pull in
    // `d3-force-3d` as a direct dependency.
    let gravityNodes: ZapNode[] = [];
    const gravity = (alpha: number) => {
      const strength = 0.03;
      for (const node of gravityNodes) {
        if (typeof node.x === "number") node.vx = (node.vx ?? 0) - node.x * strength * alpha;
        if (typeof node.y === "number") node.vy = (node.vy ?? 0) - node.y * strength * alpha;
      }
    };
    gravity.initialize = (nodes: ZapNode[]) => {
      gravityNodes = nodes;
    };
    fg.d3Force("gravity", gravity);
  }, []);

  // Node painter: glowing halo + circular avatar + name below
  const paintNode = useCallback((node: ZapNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (typeof node.x !== "number" || typeof node.y !== "number") return;
    const r = nodeRadius(node);

    // Soft glow halo whose intensity grows with the node's total sats
    const haloIntensity = Math.min(1, Math.log2(node.totalSats + 1) / 12);
    const glow = ctx.createRadialGradient(node.x, node.y, r * 0.6, node.x, node.y, r * 2.6);
    glow.addColorStop(0, `rgba(255, 200, 80, ${0.35 + haloIntensity * 0.4})`);
    glow.addColorStop(1, "rgba(255, 200, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Avatar (clipped to circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (node.imageEl && node.imageEl.complete && node.imageEl.naturalWidth > 0) {
      ctx.drawImage(node.imageEl, node.x - r, node.y - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = "#1a1f3a";
      ctx.fillRect(node.x - r, node.y - r, r * 2, r * 2);
    }
    ctx.restore();

    // Ring around the avatar
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 220, 150, 0.85)";
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    // Username label below
    const fontSize = Math.max(10, 12 / globalScale);
    ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const label = node.displayName || node.pubkey.slice(0, 8);
    const labelY = node.y + r + 4;
    // Drop shadow for legibility against the starfield
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillText(label, node.x + 1, labelY + 1);
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.fillText(label, node.x, labelY);
  }, []);

  // Link painter: glowing line with the zap amount mid-edge
  const paintLink = useCallback((link: ZapLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = link.source as ZapNode;
    const target = link.target as ZapNode;
    if (
      !source ||
      !target ||
      typeof source.x !== "number" ||
      typeof source.y !== "number" ||
      typeof target.x !== "number" ||
      typeof target.y !== "number"
    ) {
      return;
    }
    const sx = source.x;
    const sy = source.y;
    const tx = target.x;
    const ty = target.y;

    ctx.strokeStyle = linkColor(link.amount);
    // Thicker lines for bigger zaps, but tame the upper bound
    ctx.lineWidth = (0.5 + Math.min(4, Math.log2(link.amount + 1) / 3)) / globalScale;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Amount label
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    const fontSize = Math.max(9, 11 / globalScale);
    ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = `⚡ ${link.amount.toLocaleString()}`;
    // Pill background
    const pad = 4 / globalScale;
    const w = ctx.measureText(text).width + pad * 2;
    const h = fontSize + pad;
    ctx.fillStyle = "rgba(10, 12, 30, 0.85)";
    ctx.fillRect(mx - w / 2, my - h / 2, w, h);
    ctx.fillStyle = "rgba(255, 215, 0, 1)";
    ctx.fillText(text, mx, my);
  }, []);

  // Starfield background — drawn before the graph each frame so it sits behind
  // nodes and links. Stars are stored once in world coordinates so they move
  // with the pan/zoom of the canvas (no jarring jumps).
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number; speed: number }[]>([]);
  if (starsRef.current.length === 0) {
    const stars: { x: number; y: number; r: number; phase: number; speed: number }[] = [];
    for (let i = 0; i < 350; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        r: Math.random() * 1.2 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    starsRef.current = stars;
  }

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    const t = performance.now() / 1000;
    ctx.save();
    for (const star of starsRef.current) {
      const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.85})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r / Math.max(0.5, globalScale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #0b1030 0%, #06091c 45%, #02030a 100%)",
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTime={Infinity}
        d3AlphaDecay={0.008}
        d3VelocityDecay={0.55}
        warmupTicks={20}
        enableNodeDrag={false}
        enableZoomInteraction
        enablePanInteraction
        minZoom={0.2}
        maxZoom={4}
        autoPauseRedraw={false}
        nodeRelSize={1}
        nodeLabel={(n) => (n as ZapNode).displayName}
        linkLabel={(l) => `⚡ ${(l as ZapLink).amount.toLocaleString()} sats`}
        onRenderFramePre={drawStars}
        nodeCanvasObject={paintNode as any}
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as ZapNode;
          if (typeof n.x !== "number" || typeof n.y !== "number") return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeRadius(n), 0, Math.PI * 2);
          ctx.fill();
        }}
        linkCanvasObject={paintLink as any}
        linkCanvasObjectMode={() => "replace"}
        linkDirectionalParticles={(l) => Math.min(6, Math.ceil(Math.log2((l as ZapLink).amount + 1)))}
        linkDirectionalParticleWidth={(l) => 2 + Math.min(3, Math.log2((l as ZapLink).amount + 1) / 3)}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => "rgba(255, 230, 120, 0.9)"}
      />

      {/* HUD */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none text-white/90">
        <div className="text-xs uppercase tracking-widest opacity-70">Live zaps</div>
        <div className="text-3xl font-bold drop-shadow">{zapsSeen.toLocaleString()}</div>
        <div className="text-xs opacity-70">
          {graphData.nodes.length} users · {graphData.links.length} zaps
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
        <select
          className="select select-sm bg-black/40 border border-white/20 text-white hover:bg-black/60"
          value={range}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          title="Time range"
        >
          {TIME_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-black">
              {opt.label}
            </option>
          ))}
        </select>
        <RelayMultiSelect selected={relays} onChange={(r) => setSelectedRelays(r)} />
        <button
          className="btn btn-sm bg-black/40 border border-white/20 text-white hover:bg-black/60"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullscreen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9V4M9 9H4M9 9L4 4M15 9V4M15 9h5M15 9l5-5M9 15v5M9 15H4M9 15l-5 5M15 15v5M15 15h5M15 15l5 5"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
          )}
        </button>
      </div>

      {relays.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white/80 text-center bg-black/40 px-6 py-4 rounded-box border border-white/10">
            Select at least one relay to start watching zaps.
          </div>
        </div>
      )}
    </div>
  );
}
