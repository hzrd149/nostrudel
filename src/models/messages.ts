import { Model } from "applesauce-core";
import { isSafeRelayURL, mergeRelaySets, normalizeURL, processTags } from "applesauce-core/helpers";
import { OutboxMap } from "applesauce-core/helpers/relay-selection";
import { getConversationParticipants } from "applesauce-common/helpers";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, map } from "rxjs";

/** A model that loads the relays that a user has used to send direct messages */
export function DirectMessageRelaysModel(pubkey: string | ProfilePointer): Model<string[] | undefined> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;

  return (events) =>
    events.replaceable({ kind: kinds.DirectMessageRelaysList, ...pointer }).pipe(
      map((e) => {
        if (!e) return undefined;

        return processTags(e.tags, (t) =>
          t[0] === "relay" && t[1] && isSafeRelayURL(t[1]) ? normalizeURL(t[1]) : undefined,
        );
      }),
    );
}

/** A model that loads the direct message inboxes of all participants in a group */
export function GroupMessageInboxesModel(group: string, cache?: boolean): Model<Record<string, string[] | undefined>> {
  const pubkeys = getConversationParticipants(group);

  return (events) =>
    combineLatest(
      Object.fromEntries(
        pubkeys.map((pubkey) => {
          const inboxes = events.mailboxes({ pubkey }).pipe(map((m) => m?.inboxes));
          const relays = events.model(DirectMessageRelaysModel, { pubkey, cache });

          return [pubkey, combineLatest([inboxes, relays]).pipe(map(([inboxes, relays]) => relays || inboxes))];
        }),
      ),
    );
}

/** A model that returns the relays holding a user's received NIP-04 messages, their NIP-65 inboxes and NIP-17 DM relays */
export function LegacyMessageInboxesModel(pubkey: string): Model<string[]> {
  return (events) =>
    combineLatest([
      events.mailboxes({ pubkey }).pipe(map((m) => m?.inboxes)),
      events.model(DirectMessageRelaysModel, pubkey),
    ]).pipe(map(([inboxes, relays]) => mergeRelaySets(inboxes, relays)));
}

/** A model that returns the relays holding a user's sent NIP-04 messages, their NIP-65 outboxes */
export function LegacyMessageOutboxesModel(pubkey: string): Model<string[]> {
  return (events) => events.mailboxes({ pubkey }).pipe(map((m) => m?.outboxes ?? []));
}

/**
 * A model that maps each relay to the users whose NIP-04 messages from this conversation it holds.
 * Messages to self live on self's inboxes and the other user's outboxes, messages to the other user on the reverse
 */
export function LegacyConversationRelaysModel(self: string, other: string): Model<OutboxMap> {
  return (events) =>
    combineLatest([
      events.model(LegacyMessageInboxesModel, self),
      events.model(LegacyMessageOutboxesModel, other),
      events.model(LegacyMessageInboxesModel, other),
      events.model(LegacyMessageOutboxesModel, self),
    ]).pipe(
      map(([toSelf, fromOther, toOther, fromSelf]) => {
        const relays: OutboxMap = {};
        const add = (relay: string, pubkey: string) => {
          const users = (relays[relay] ??= []);
          if (!users.some((user) => user.pubkey === pubkey)) users.push({ pubkey });
        };
        for (const relay of [...toSelf, ...fromOther]) add(relay, self);
        for (const relay of [...toOther, ...fromSelf]) add(relay, other);
        return relays;
      }),
    );
}
