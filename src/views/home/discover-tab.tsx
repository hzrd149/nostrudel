import { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import moment from "moment";
import { mergeAll, from } from "rxjs";
import { Post } from "../../components/post";
import { useEventDir } from "../../hooks/use-event-dir";
import useSubject from "../../hooks/use-subject";
import { useSubscription } from "../../hooks/use-subscription";
import { useUserContacts } from "../../hooks/use-user-contacts";
import identity from "../../services/identity";
import settings from "../../services/settings";
import userContactsService from "../../services/user-contacts";

function useExtendedContacts(pubkey: string) {
  const relays = useSubject(settings.relays);
  const [extendedContacts, setExtendedContacts] = useState<string[]>([]);
  const { contacts } = useUserContacts(pubkey);

  useEffect(() => {
    if (contacts) {
      const following = contacts.contacts.map((c) => c.pubkey);
      const subscriptions = contacts.contacts.map((contact) =>
        userContactsService.requestContacts(contact.pubkey, relays)
      );

      const rxSub = from(subscriptions)
        .pipe(mergeAll())
        .subscribe((contacts) => {
          if (contacts) {
            setExtendedContacts((value) => {
              const more = contacts.contacts.map((c) => c.pubkey).filter((key) => !following.includes(key));
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
  const relays = useSubject(settings.relays);
  const pubkey = useSubject(identity.pubkey);

  const contactsOfContacts = useExtendedContacts(pubkey);

  const [since, setSince] = useState(moment().subtract(1, "hour"));
  const [after, setAfter] = useState(moment());

  const sub = useSubscription(
    relays,
    {
      authors: contactsOfContacts,
      kinds: [1],
      since: since.unix(),
    },
    "home-discover"
  );

  const { events } = useEventDir(sub);
  const timeline = Object.values(events).sort((a, b) => b.created_at - a.created_at);

  return (
    <Flex direction="column" overflow="auto" gap="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};
