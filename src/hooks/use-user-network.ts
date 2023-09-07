import { useMemo } from "react";
import { Kind } from "nostr-tools";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import useUserContactList from "./use-user-contact-list";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import { useReadRelayUrls } from "./use-client-relays";
import useSubjects from "./use-subjects";

export default function useUserNetwork(pubkey: string, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const contacts = useUserContactList(pubkey);
  const contactsPubkeys = contacts ? getPubkeysFromList(contacts) : [];

  const subjects = useMemo(() => {
    return contactsPubkeys.map((person) =>
      replaceableEventLoaderService.requestEvent(readRelays, Kind.Contacts, person.pubkey),
    );
  }, [contactsPubkeys, readRelays.join("|")]);

  const lists = useSubjects(subjects);

  return useMemo(() => {
    const pubkeys = new Map<string, number>();
    for (const list of lists) {
      const keys = getPubkeysFromList(list);
      for (const { pubkey } of keys) {
        pubkeys.set(pubkey, (pubkeys.get(pubkey) ?? 0) + 1);
      }
    }
    for (const { pubkey } of contactsPubkeys) pubkeys.delete(pubkey);
    return Array.from(pubkeys)
      .sort((a, b) => b[1] - a[1])
      .map((a) => ({ pubkey: a[0], count: a[1] }));
  }, [lists, contactsPubkeys]);
}
