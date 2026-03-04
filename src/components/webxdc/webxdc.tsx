import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, type IframeHTMLAttributes } from "react";
import type { Webxdc as WebxdcAPI, ReceivedStatusUpdate } from "@webxdc/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebxdcProps extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src" | "id"> {
  /** Unique session identifier — used as the subdomain: `<id>.webxdc.app`. */
  id: string;
  /** The `.xdc` archive: raw bytes or a URL to fetch them from. */
  xdc: Uint8Array | string;
  /** A `Webxdc` instance that backs the iframe's webxdc API calls. */
  webxdc: WebxdcAPI<unknown>;
}

/** Imperative handle exposed by the Webxdc component. */
export interface WebxdcHandle {
  /** Send a postMessage to the iframe (used for synthetic keyboard events). */
  postMessage: (msg: Record<string, unknown>, transfer?: Transferable[]) => void;
  /** Focus the iframe element. */
  focus: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve `xdc` prop to an ArrayBuffer. */
async function resolveXdc(xdc: Uint8Array | string): Promise<ArrayBuffer> {
  if (typeof xdc === "string") {
    const res = await fetch(xdc);
    if (!res.ok) throw new Error(`Failed to fetch xdc: ${res.status}`);
    return res.arrayBuffer();
  }
  // Uint8Array → ArrayBuffer (copy so we can transfer)
  const copy = new ArrayBuffer(xdc.byteLength);
  new Uint8Array(copy).set(xdc);
  return copy;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a webxdc app inside an iframe hosted on `<id>.webxdc.app`.
 *
 * The component handles the full JSON-RPC lifecycle:
 *  1. Waits for `webxdc.ready` from the frame.
 *  2. Sends `webxdc.init` with the `.xdc` bytes.
 *  3. Proxies every JSON-RPC request to the provided `Webxdc` instance.
 *  4. Forwards `webxdc.update` notifications into the frame.
 */
export const Webxdc = forwardRef<WebxdcHandle, WebxdcProps>(function Webxdc({ id, xdc, webxdc, ...iframeProps }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Keep latest props in refs so the message handler always sees current values
  // without needing to re-register the listener.
  const webxdcRef = useRef(webxdc);
  const xdcRef = useRef(xdc);
  useEffect(() => {
    webxdcRef.current = webxdc;
  }, [webxdc]);
  useEffect(() => {
    xdcRef.current = xdc;
  }, [xdc]);

  const origin = `https://${id}.webxdc.app`;

  // ------------------------------------------------------------------
  // Post a JSON-RPC message to the iframe
  // ------------------------------------------------------------------
  const post = useCallback(
    (msg: Record<string, unknown>, transfer?: Transferable[]) => {
      iframeRef.current?.contentWindow?.postMessage(msg, origin, transfer ?? []);
    },
    [origin],
  );

  // Expose imperative handle so parent components can post messages and focus.
  useImperativeHandle(
    ref,
    () => ({
      postMessage: (msg: Record<string, unknown>, transfer?: Transferable[]) => {
        iframeRef.current?.contentWindow?.postMessage(msg, origin, transfer ?? []);
      },
      focus: () => {
        iframeRef.current?.focus();
      },
    }),
    [origin],
  );

  // ------------------------------------------------------------------
  // Handle messages coming from the iframe
  // ------------------------------------------------------------------
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only accept messages from our iframe's origin.
      if (event.origin !== origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = event.data as any;
      if (!msg || msg.jsonrpc !== "2.0") return;

      const api = webxdcRef.current;

      // --- Notification: webxdc.ready → send webxdc.init ---------------
      if (msg.method === "webxdc.ready" && msg.id === undefined) {
        resolveXdc(xdcRef.current).then((buf) => {
          const initMsg = {
            jsonrpc: "2.0" as const,
            method: "webxdc.init",
            params: {
              xdc: buf,
              selfAddr: api.selfAddr,
              selfName: api.selfName,
              sendUpdateInterval: api.sendUpdateInterval,
              sendUpdateMaxSize: api.sendUpdateMaxSize,
            },
          };
          iframeRef.current?.contentWindow?.postMessage(initMsg, origin, [buf]);
        });
        return;
      }

      // --- Requests (have an `id`) ------------------------------------
      if (msg.id !== undefined && msg.method) {
        handleRequest(msg.id, msg.method, msg.params ?? {});
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleRequest(id: string | number, method: string, params: any) {
      const api = webxdcRef.current;

      const respond = (result: unknown) => post({ jsonrpc: "2.0", id, result });
      const respondError = (code: number, message: string) => post({ jsonrpc: "2.0", id, error: { code, message } });

      try {
        switch (method) {
          case "webxdc.sendUpdate": {
            api.sendUpdate(params.update, "");
            respond(null);
            break;
          }

          case "webxdc.setUpdateListener": {
            const serial: number = params.serial ?? 0;
            // Forward every update into the frame as a notification.
            await api.setUpdateListener((update: ReceivedStatusUpdate<unknown>) => {
              post({
                jsonrpc: "2.0",
                method: "webxdc.update",
                params: { update },
              });
            }, serial);
            respond(null);
            break;
          }

          case "webxdc.getAllUpdates": {
            const updates = await api.getAllUpdates();
            respond(updates);
            break;
          }

          case "webxdc.sendToChat": {
            await api.sendToChat(params.message);
            respond(null);
            break;
          }

          case "webxdc.importFiles": {
            const files = await api.importFiles(params.filter ?? {});
            // File objects can't be serialised — convert to transferable form.
            const result = await Promise.all(
              files.map(async (f) => ({
                name: f.name,
                type: f.type,
                data: bufToBase64(await f.arrayBuffer()),
              })),
            );
            respond(result);
            break;
          }

          case "webxdc.joinRealtimeChannel": {
            const rt = api.joinRealtimeChannel();
            // Generate a channel id to track this listener.
            const channelId = crypto.randomUUID();

            rt.setListener((data: Uint8Array) => {
              post({
                jsonrpc: "2.0",
                method: "webxdc.realtimeChannel.data",
                params: { channelId, data: Array.from(data) },
              });
            });

            // Store on ref so subsequent calls can find it.
            realtimeChannels.current.set(channelId, rt);
            respond({ channelId });
            break;
          }

          case "webxdc.realtimeChannel.send": {
            const ch = realtimeChannels.current.get(params.channelId);
            if (ch) ch.send(new Uint8Array(params.data));
            respond(null);
            break;
          }

          case "webxdc.realtimeChannel.leave": {
            const ch = realtimeChannels.current.get(params.channelId);
            if (ch) {
              ch.leave();
              realtimeChannels.current.delete(params.channelId);
            }
            respond(null);
            break;
          }

          default:
            respondError(-32601, `Method not found: ${method}`);
        }
      } catch (err) {
        respondError(-1, String(err));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin, post]);

  // Realtime channel handles, keyed by channelId.
  const realtimeChannels = useRef<Map<string, ReturnType<WebxdcAPI<unknown>["joinRealtimeChannel"]>>>(new Map());

  // Clean up realtime channels on unmount.
  useEffect(() => {
    const channels = realtimeChannels.current;
    return () => {
      for (const ch of channels.values()) ch.leave();
      channels.clear();
    };
  }, []);

  return <iframe ref={iframeRef} src={`${origin}/`} {...iframeProps} />;
});

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default Webxdc;
