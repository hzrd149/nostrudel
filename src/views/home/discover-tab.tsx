import { useEffect, useMemo } from "react";
import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Note } from "../../components/note";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { isReply } from "../../helpers/nostr-event";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import userContactsService, { UserContacts } from "../../services/user-contacts";
import { PersistentSubject } from "../../classes/subject";
import useSubject from "../../hooks/use-subject";
import { useThrottle } from "react-use";

class DiscoverContacts {
  pubkey: string;
  relays: string[];
  pubkeys = new PersistentSubject<string[]>([]);

  constructor(pubkey: string, relays: string[]) {
    this.pubkey = pubkey;
    this.relays = relays;

    userContactsService.requestContacts(pubkey, relays).subscribe(this.handleContacts, this);
  }

  private personalContacts: UserContacts | undefined;
  handleContacts(contacts: UserContacts) {
    if (contacts.pubkey === this.pubkey) {
      this.personalContacts = contacts;

      // unsubscribe from old contacts
      if (this.pubkeys.value.length > 0) {
        for (const key of this.pubkeys.value) {
          userContactsService.getSubject(key).unsubscribe(this.handleContacts, this);
        }
        this.pubkeys.next([]);
      }

      // request new contacts
      for (const key of contacts.contacts) {
        userContactsService.requestContacts(key, this.relays).subscribe(this.handleContacts, this);
      }
    } else {
      // add the pubkeys to contacts
      const keysToAdd = contacts.contacts.filter(
        (key) =>
          (!this.personalContacts || !this.personalContacts.contacts.includes(key)) && !this.pubkeys.value.includes(key)
      );
      this.pubkeys.next([...this.pubkeys.value, ...keysToAdd]);
    }
  }

  cleanup() {
    userContactsService.getSubject(this.pubkey).unsubscribe(this.handleContacts, this);
    for (const key of this.pubkeys.value) {
      userContactsService.getSubject(key).unsubscribe(this.handleContacts, this);
    }
  }
}

export default function DiscoverTab() {
  useAppTitle("discover");
  const account = useCurrentAccount();
  const relays = useReadRelayUrls();

  const discover = useMemo(() => new DiscoverContacts(account.pubkey, relays), [account.pubkey, relays.join("|")]);
  const pubkeys = useSubject(discover.pubkeys);
  const throttledPubkeys = useThrottle(pubkeys, 1000);

  const { events, loading, loadMore } = useTimelineLoader(
    `${account.pubkey}-discover`,
    relays,
    { authors: throttledPubkeys, kinds: [1], since: moment().subtract(1, "hour").unix() },
    { pageSize: moment.duration(1, "hour").asSeconds(), enabled: throttledPubkeys.length > 0 }
  );

  const timeline = events.filter((e) => !isReply(e));

  return (
    <Flex direction="column" gap="2">
      {timeline.map((event) => (
        <Note key={event.id} event={event} maxHeight={600} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
}
