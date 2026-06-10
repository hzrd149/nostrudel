/**
 * Visualize timeline events on a canvas with time-based scrolling and relay visualization
 * @tags loader, timeline, scrolling, visualization
 * @related loader/paginated-timeline, feed/relay-timeline
 */
import { EventStore } from "applesauce-core";
import { getSeenRelays, mergeRelaySets, unixNow } from "applesauce-core/helpers";
import { createTimelineLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThrottle } from "react-use";

const pool = new RelayPool();

const COLORS = ["red", "green", "blue", "orange", "purple", "darkcyan"];

export default function TimelineExample() {
  const now = useMemo(() => unixNow(), []);
  const [limit, setLimit] = useState(50);
  const [frame, _setFrame] = useState(60 * 60);
  const [relays, _setRelays] = useState(
    mergeRelaySets([
      "wss://nostrue.com/",
      "wss://nos.lol/",
      "wss://nostr.bitcoiner.social/",
      "wss://relay.damus.io/",
      "wss://nostrelites.org/",
      "wss://nostr.wine/",
    ]),
  );
  useEffect(() => {
    if (ctx.current) ctx.current.canvas.height = relays.length * 32;
  }, [relays]);

  const [seconds, setSeconds] = useState(0);

  // Create a new timeline loader when the relays change
  const loader = useMemo(() => {
    return createTimelineLoader(pool, relays, [{ kinds: [1] }], { limit });
  }, [relays, limit]);

  // clear the canvas when loader changes
  useEffect(() => {
    if (ctx.current) {
      ctx.current.clearRect(0, 0, ctx.current.canvas.width, ctx.current.canvas.height);
      ctx.current.canvas.width = frame;
    }
  }, [loader, frame]);

  // throttle how fast the seconds change
  const secondsThrottled = useThrottle(seconds, 1000);

  // Request a new block of events from the loader when the seconds change
  useEffect(() => {
    loader(now - secondsThrottled).subscribe((event) => {
      const from = Array.from(getSeenRelays(event) || [])[0];
      if (!from) return;
      store.add(event);

      if (ctx.current) {
        ctx.current.fillStyle = COLORS[relays.indexOf(from)] || "black";
        ctx.current.fillRect(now - event.created_at, relays.indexOf(from) * 32, 1, 32);
      }
    });
  }, [secondsThrottled, loader, now]);

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  useEffect(() => {
    if (canvas.current) ctx.current = canvas.current.getContext("2d");
  }, []);

  const store = useMemo(() => new EventStore(), []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="join">
        <button className="btn join-item" onClick={() => setLimit(50)}>
          50
        </button>
        <button className="btn join-item" onClick={() => setLimit(100)}>
          100
        </button>
        <button className="btn join-item" onClick={() => setLimit(200)}>
          200
        </button>
      </div>

      <div className="flex flex-row gap-2 text-sm p-1">
        {relays.map((relay, i) => (
          <code key={relay} style={{ color: COLORS[i] }}>
            {relay}
          </code>
        ))}
      </div>

      <canvas
        width={frame}
        height={relays.length * 32}
        style={{ width: "100%" }}
        ref={canvas}
        className="border border-base-300"
      />

      <input
        type="range"
        className="range w-full"
        min={0}
        max={frame}
        value={seconds}
        onInput={(e) => {
          const v = parseInt(e.currentTarget.value);
          if (Number.isFinite(v)) setSeconds(v);
        }}
      />

      <p className="text-sm">scroll: {seconds}s</p>
    </div>
  );
}
