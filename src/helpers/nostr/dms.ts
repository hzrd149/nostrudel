import dayjs from "dayjs";
import { NostrEvent } from "nostr-tools";
import { sortByDate } from "./event";

export function getDMSender(event: NostrEvent) {
  return event.pubkey;
}
export function getDMRecipient(event: NostrEvent) {
  const pubkey = event.tags.find((t) => t[0] === "p")?.[1];
  if (!pubkey) throw new Error("Missing recipient pubkey");
  return pubkey;
}

export type UnknownConversation = { pubkeys: [string, string]; messages: NostrEvent[] };
export type KnownConversation = UnknownConversation & { myself: string; correspondent: string };

export function groupIntoConversations(messages: NostrEvent[]) {
  const conversations: Record<string, UnknownConversation> = {};

  for (const message of messages) {
    try {
      const sender = getDMSender(message);
      const recipient = getDMRecipient(message);

      const pubkeys = sender > recipient ? [sender, recipient] : [recipient, sender];
      const key = pubkeys.join("-");

      conversations[key] = conversations[key] || { pubkeys, messages: [] };

      conversations[key].messages.push(message);
    } catch (e) {}
  }

  return Object.values(conversations);
}

export function getCorrespondent(conversion: UnknownConversation, myself: string) {
  return myself === conversion.pubkeys[0] ? conversion.pubkeys[1] : conversion.pubkeys[0];
}

export function identifyConversation(conversations: UnknownConversation, myself: string): KnownConversation {
  const correspondent = getCorrespondent(conversations, myself);
  return { ...conversations, myself, correspondent };
}

export function hasResponded(conversion: KnownConversation) {
  const latestReceived = conversion.messages.find((m) => getDMSender(m) === conversion.correspondent);
  const latestSent = conversion.messages.find((m) => getDMSender(m) === conversion.myself);

  if (latestReceived && latestSent && latestSent.created_at > latestReceived.created_at) return true;
  return false;
}

export function sortConversationsByLastReceived(conversations: KnownConversation[]) {
  return conversations.sort((a, b) => {
    const aLatest = a.messages.find((m) => getDMSender(m) === a.correspondent) || a.messages[0];
    const bLatest = b.messages.find((m) => getDMSender(m) === b.correspondent) || b.messages[0];
    return bLatest.created_at - aLatest.created_at;
  });
}

/** Groups messages into bubble sets based on the pubkey and time */
export function groupMessages(messages: NostrEvent[], minutes = 5, ascending = false) {
  const sorted = messages.sort(sortByDate);

  const groups: { id: string; pubkey: string; events: NostrEvent[] }[] = [];
  for (const message of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.pubkey === message.pubkey) {
      const lastEvent = last.events[last.events.length - 1];
      if (lastEvent && dayjs.unix(lastEvent.created_at).diff(dayjs.unix(message.created_at), "minute") < minutes) {
        last.events.push(message);
        continue;
      }
    }

    const group = { id: message.id, pubkey: message.pubkey, events: [message] };
    groups.push(group);
  }

  if (ascending) {
    for (const group of groups) group.events.reverse();
    return groups.reverse();
  } else return groups;
}
