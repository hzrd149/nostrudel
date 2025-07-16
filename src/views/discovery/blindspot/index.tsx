import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Card,
  Flex,
  Heading,
  Select,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";
import { memo, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useUserContactList from "../../../hooks/use-user-contact-list";
import { socialGraph$ } from "../../../services/social-graph";
import SimpleView from "../../../components/layout/presets/simple-view";

const UserCard = memo(({ pubkey, blindspot }: { pubkey: string; blindspot: string[] }) => {
  return (
    <Card display="block" p="4">
      <UserAvatar pubkey={pubkey} mr="4" float="left" />
      <Heading size="md" isTruncated>
        <HoverLinkOverlay as={RouterLink} to={`/discovery/blindspot/${nip19.npubEncode(pubkey)}`}>
          <UserName pubkey={pubkey} />
        </HoverLinkOverlay>
      </Heading>
      <Text>Following {blindspot.length} users you don't follow</Text>
    </Card>
  );
});

export default function BlindspotHomeView() {
  const account = useActiveAccount()!;
  const [sort, setSort] = useState("quality"); // follows, quality

  const graph = useObservableEagerState(socialGraph$);
  const contacts = useUserContactList(account.pubkey);

  const pubkeys = useMemo(() => graph.getFollowedByUser(account.pubkey), [graph, account.pubkey]);

  const blindspots = useMemo(() => {
    if (!contacts || !pubkeys) return [];

    const arr = Array.from(pubkeys)
      .map((pubkey) => {
        const following = graph.getFollowedByUser(pubkey);
        const blindspot = Array.from(following).filter((p) => !pubkeys.has(p) && p !== account.pubkey) ?? [];

        return { pubkey, blindspot };
      })
      .filter((p) => p.blindspot.length > 2);

    if (sort === "follows") {
      return arr.sort((a, b) => b.blindspot.length - a.blindspot.length);
    } else {
      // the average distance to pubkeys in the blindspot
      const quality = new Map<string, number>();
      for (const { pubkey, blindspot } of arr) {
        const total = blindspot.reduce((t, p) => t + (graph.getFollowDistance(p) ?? 0), 0);
        quality.set(pubkey, total / blindspot.length);
      }

      return arr.sort((a, b) => quality.get(a.pubkey)! - quality.get(b.pubkey)!);
    }
  }, [account.pubkey, pubkeys, graph, sort]);

  return (
    <SimpleView title="Blindspots" center maxW="container.xl">
      <Flex direction={{ base: "column", md: "row" }} gap="2" alignItems="center">
        <Text>Pick another user and see what they are seeing that your not.</Text>
        <Select ml="auto" maxW="48" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="quality">Quality</option>
          <option value="follows">Follows</option>
        </Select>
      </Flex>

      {blindspots.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
          {blindspots.map(({ pubkey, blindspot }) => (
            <UserCard key={pubkey} blindspot={blindspot} pubkey={pubkey} />
          ))}
        </SimpleGrid>
      ) : (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No blind spots!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Unable to find any blind spots. maybe try following some people?
          </AlertDescription>
        </Alert>
      )}
    </SimpleView>
  );
}
