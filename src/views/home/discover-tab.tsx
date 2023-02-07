import { useEffect, useState } from "react";
import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { mergeAll, from } from "rxjs";
import { Note } from "../../components/note";
import useSubject from "../../hooks/use-subject";
import { useUserContacts } from "../../hooks/use-user-contacts";
import identity from "../../services/identity";
import userContactsService from "../../services/user-contacts";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { isNote } from "../../helpers/nostr-event";
import settings from "../../services/settings";

function useExtendedContacts(pubkey: string) {
  const [extendedContacts, setExtendedContacts] = useState<string[]>([]);
  const contacts = useUserContacts(pubkey);

  useEffect(() => {
    if (contacts) {
      const following = contacts.contacts;
      const subject = contacts.contacts.map((contact) => userContactsService.requestContacts(contact));

      const rxSub = from(subject)
        .pipe(mergeAll())
        .subscribe((contacts) => {
          if (contacts) {
            setExtendedContacts((value) => {
              const more = contacts.contacts.filter((key) => !following.includes(key));
              return Array.from(new Set([...value, ...more]));
            });
          }
        });

      return () => rxSub.unsubscribe();
    }
  }, [contacts, setExtendedContacts]);

  return extendedContacts;
}

export const DiscoverTab = () => {
  const pubkey = useSubject(identity.pubkey);
  const relays = useSubject(settings.relays);

  const contactsOfContacts = useExtendedContacts(pubkey);
  const { events, loading, loadMore } = useTimelineLoader(
    `discover`,
    relays,
    { authors: contactsOfContacts, kinds: [1], since: moment().subtract(1, "hour").unix() },
    { pageSize: moment.duration(1, "hour").asSeconds(), enabled: contactsOfContacts.length > 0 }
  );

  const timeline = events.filter(isNote);

  return (
    <Flex direction="column" overflow="auto" gap="2">
      {timeline.map((event) => (
        <Note key={event.id} event={event} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};
