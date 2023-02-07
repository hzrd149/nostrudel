import { Flex } from "@chakra-ui/react";
import moment from "moment";
import { useState } from "react";
import { Post } from "../../components/post";
import { useEventDir } from "../../hooks/use-event-dir";
import useSubject from "../../hooks/use-subject";
import { useSubscription } from "../../hooks/use-subscription";
import { useUserContacts } from "../../hooks/use-user-contacts";
import identity from "../../services/identity";
import settings from "../../services/settings";

export const FollowingTab = () => {
  const relays = useSubject(settings.relays);
  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);

  const [since, setSince] = useState(moment().subtract(1, "hour"));
  const [after, setAfter] = useState(moment());

  const following = contacts?.contacts || [];
  const sub = useSubscription(
    relays,
    {
      authors: following,
      kinds: [1],
      since: since.unix(),
    },
    "home-following"
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
