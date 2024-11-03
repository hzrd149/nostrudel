import { Button, Flex, Heading, Link } from "@chakra-ui/react";
import { Navigate, useParams, Link as RouterLink } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { useMemo } from "react";
import dictionaryService from "../../services/dictionary";
import { useReadRelays } from "../../hooks/use-client-relays";
import WikiPageHeader from "./components/wiki-page-header";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import { WikiPagePage } from "./page";
import { useWebOfTrust } from "../../providers/global/web-of-trust-provider";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { getPageDefer } from "../../helpers/nostr/wiki";

export default function WikiTopicView() {
  const { topic } = useParams();
  if (!topic) return <Navigate to="/wiki" />;

  const webOfTrust = useWebOfTrust();
  const readRelays = useReadRelays();
  const subject = useMemo(() => dictionaryService.requestTopic(topic, readRelays, true), [topic, readRelays]);

  const pages = useObservable(subject);

  let sorted = pages ? Array.from(pages.values()) : [];
  if (webOfTrust) sorted = webOfTrust.sortByDistanceAndConnections(sorted, (p) => p.pubkey);

  // remove defer versions
  sorted = sorted.filter((p) => !getPageDefer(p));

  const { value: selected, setValue: setSelected, clearValue } = useRouteSearchValue("pubkey");
  const selectedPage: NostrEvent | undefined = sorted.find((p) => p.pubkey === selected) || sorted[0];

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
            colorScheme={(!selected && i === 0) || selected === page.pubkey ? "primary" : undefined}
            onClick={() => setSelected(page.pubkey)}
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

      {selectedPage && <WikiPagePage page={selectedPage} />}
    </VerticalPageLayout>
  );
}
