import { Button, Flex, Heading, Link } from "@chakra-ui/react";
import { Navigate, useParams, Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useSubject from "../../hooks/use-subject";
import { useEffect, useMemo, useState } from "react";
import dictionaryService from "../../services/dictionary";
import { useReadRelays } from "../../hooks/use-client-relays";
import WikiPageHeader from "./components/wiki-page-header";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import { WikiPagePage } from "./page";
import { useWebOfTrust } from "../../providers/global/web-of-trust-provider";

export default function WikiTopicView() {
  const { topic } = useParams();
  if (!topic) return <Navigate to="/wiki" />;

  const webOfTrust = useWebOfTrust();
  const readRelays = useReadRelays();
  const subject = useMemo(() => dictionaryService.requestTopic(topic, readRelays), [topic, readRelays]);

  const pages = useSubject(subject);

  let sorted = pages ? Array.from(pages.values()) : [];
  if (webOfTrust) sorted = webOfTrust.sortByDistanceAndConnections(sorted, (p) => p.pubkey);

  const [selected, setSelected] = useState<NostrEvent>();

  // if the topic changes remove selection
  useEffect(() => setSelected(undefined), [topic]);

  return (
    <VerticalPageLayout>
      <WikiPageHeader />
      <Flex gap="2" overflow="auto">
        {sorted.map((page, i) => (
          <Button
            key={page.pubkey}
            flexShrink={0}
            variant="outline"
            p="1"
            pr="4"
            colorScheme={(!selected && i === 0) || selected === page ? "primary" : undefined}
            onClick={() => setSelected(page)}
          >
            <UserAvatar pubkey={page.pubkey} size="sm" />
            <UserName pubkey={page.pubkey} ml="2" />
          </Button>
        ))}
      </Flex>

      {sorted.length === 0 && (
        <Heading mx="auto" size="md" mt="8">
          Looks like there are no pages,{" "}
          <Link as={RouterLink} to={{ pathname: "/wiki/create", search: "topic=" + topic }} color="blue.500">
            Create one?
          </Link>
        </Heading>
      )}

      {(selected || sorted.length > 0) && <WikiPagePage page={selected || sorted[0]} />}
    </VerticalPageLayout>
  );
}
