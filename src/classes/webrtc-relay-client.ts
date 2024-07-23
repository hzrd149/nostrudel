import NostrWebRTCPeer from "./nostr-webrtc-peer";
import { AbstractRelay, AbstractRelayConstructorOptions } from "nostr-tools/abstract-relay";

export class WebRtcWebSocket extends EventTarget implements WebSocket {
  binaryType: BinaryType = "blob";
  bufferedAmount: number = 0;
  extensions: string = "";
  protocol: string = "webrtc";

  peer: NostrWebRTCPeer;
  url: string;

  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;

  constructor(peer: NostrWebRTCPeer) {
    super();
    this.peer = peer;
    this.url = `webrtc+nostr:` + peer.answerEvent?.pubkey;

    this.peer.on("message", this.handleMessage, this);
    this.peer.on("connected", this.handleConnect, this);
    this.peer.on("disconnected", this.handleDisconnect, this);

    if (this.readyState === WebRtcWebSocket.OPEN) {
      setTimeout(() => this.handleConnect(), 100);
    }
  }

  get readyState() {
    const state = this.peer.connection?.connectionState;
    switch (state) {
      case "closed":
      case "disconnected":
        return this.CLOSED;
      case "failed":
        return this.CLOSED;
      case "connected":
        return this.OPEN;
      case "new":
      case "connecting":
      default:
        return this.CONNECTING;
    }
  }

  private handleMessage(data: string) {
    const event = new MessageEvent("message", { data });
    this.onmessage?.(event);
    this.dispatchEvent(event);
  }
  private handleConnect() {
    const event = new Event("open");
    this.onopen?.(event);
    this.dispatchEvent(event);
  }
  private handleDisconnect() {
    const event = new CloseEvent("close", { reason: "none" });
    this.onclose?.(event);
    this.dispatchEvent(event);

    this.peer.off("message", this.handleMessage, this);
    this.peer.off("connected", this.handleConnect, this);
    this.peer.off("disconnected", this.handleDisconnect, this);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  send(data: unknown): void {
    if (typeof data === "string") {
      this.peer.send(data);
    } else throw new Error("Unsupported data type");
  }

  close(code?: number, reason?: string): void;
  close(code?: number, reason?: string): void;
  close(code?: unknown, reason?: unknown): void {
    this.peer.hangup();

    this.peer.off("message", this.handleMessage, this);
    this.peer.off("connected", this.handleConnect, this);
    this.peer.off("disconnected", this.handleDisconnect, this);
  }

  readonly CONNECTING = WebSocket.CONNECTING;
  readonly OPEN = WebSocket.OPEN;
  readonly CLOSING = WebSocket.CLOSING;
  readonly CLOSED = WebSocket.CLOSED;
  static readonly CONNECTING = WebSocket.CONNECTING;
  static readonly OPEN = WebSocket.OPEN;
  static readonly CLOSING = WebSocket.CLOSING;
  static readonly CLOSED = WebSocket.CLOSED;
}

export default class WebRtcRelayClient extends AbstractRelay {
  constructor(peer: NostrWebRTCPeer, opts: AbstractRelayConstructorOptions) {
    super("wss://example.com", opts);

    // @ts-expect-error
    this.url = `webrtc+nostr:` + peer.answerEvent?.pubkey;

    this.connectionTimeout = 30_000;

    // @ts-expect-error
    this._WebSocket = function () {
      return new WebRtcWebSocket(peer);
    };
  }
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.WebRtcWebSocket = WebRtcWebSocket;
  // @ts-expect-error
  window.WebRtcRelayClient = WebRtcRelayClient;
}
