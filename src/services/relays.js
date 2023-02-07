import { Signal } from "../helpers/signal";
import { getRelays } from "./settings";

class RelayConnection {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.url = url;

    this.onEvent = new Signal();
    this.onNotice = new Signal();

    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  send(json) {
    this.ws.send(JSON.stringify(json));
  }

  get connected() {
    return this.ws.readyState === WebSocket.OPEN;
  }
  get state() {
    return this.ws.readyState;
  }

  handleMessage(event) {
    const data = JSON.parse(event.data);
    const type = data[0];

    switch (type) {
      case "EVENT":
        this.onEvent.emit({ subId: data[1], body: data[2] });
        break;
      case "NOTICE":
        this.onEvent.emit({ message: data[1] });
        break;
    }
  }
  handleClose() {
    console.log(this.url, "closed");
  }
}

const connections = new Map();
export const onEvent = new Signal();

export function getAllActive() {
  return Array.from(connections.values()).filter((relay) => relay.connected);
}

export async function connectToRelay(url) {
  if (!connections.has(url)) {
    const relay = new RelayConnection(url);
    connections.set(url, relay);

    // send all onEvent events to the main onEvent signal
    relay.onEvent.addConnection(onEvent);
  }
}
export async function connectToRelays() {
  const relayUrls = await getRelays();

  for (const url of relayUrls) {
    await connectToRelay(url);
  }
}

const messageQueue = [];
export async function sendNextMessage() {
  const next = messageQueue.shift();
  if (!next) return;
  let sent = false;
  for (const [url, relay] of connections) {
    if (relay.connected) {
      relay.send(next);
      sent = true;
    }
  }
  if (!sent) {
    messageQueue.unshift(next);
  }
}
setInterval(sendNextMessage, 100);

export function subscribeToAuthor(pubkey) {
  messageQueue.push(["REQ", "test", { authors: [pubkey] }]);
}
