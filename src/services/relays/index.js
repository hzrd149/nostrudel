import { Signal } from "../../helpers/signal";
import { getRelays } from "../settings";
import { Relay } from "./relay";

const connections = new Map();
export const onEvent = new Signal();

export function getAllActive() {
  return Array.from(connections.values()).filter((relay) => relay.connected);
}

export async function connectToRelay(url) {
  if (!connections.has(url)) {
    const relay = new Relay(url);
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
