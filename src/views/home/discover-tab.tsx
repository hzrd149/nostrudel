import { useEffect, useState } from "react";
import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Note } from "../../components/note";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { isNote } from "../../helpers/nostr-event";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";

function useExtendedContacts(pubkey: string) {
  const readRelays = useReadRelayUrls();
  const [extendedContacts, setExtendedContacts] = useState<string[]>([]);
  const contacts = useUserContacts(pubkey);

  // useEffect(() => {
  //   if (contacts) {
  //     const following = contacts.contacts;
  //     const subject = contacts.contacts.map((contact) => userContactsService.requestContacts(contact, readRelays));

  //     const rxSub = from(subject)
  //       .pipe(mergeAll())
  //       .subscribe((contacts) => {
  //         if (contacts) {
  //           setExtendedContacts((value) => {
  //             const more = contacts.contacts.filter((key) => !following.includes(key));
  //             return Array.from(new Set([...value, ...more]));
  //           });
  //         }
  //       });

  //     return () => rxSub.unsubscribe();
  //   }
  // }, [contacts, setExtendedContacts]);

  return extendedContacts;
}

export const DiscoverTab = () => {
  useAppTitle("discover");
  const account = useCurrentAccount();
  const relays = useReadRelayUrls();

  const contactsOfContacts = useExtendedContacts(account.pubkey);
  const { events, loading, loadMore } = useTimelineLoader(
    `discover`,
    relays,
    { authors: contactsOfContacts, kinds: [1], since: moment().subtract(1, "hour").unix() },
    { pageSize: moment.duration(1, "hour").asSeconds(), enabled: contactsOfContacts.length > 0 }
  );

  const timeline = events.filter(isNote);

  return (
    <Flex direction="column" gap="2">
      {timeline.map((event) => (
        <Note key={event.id} event={event} maxHeight={300} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};
