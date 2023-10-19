import { Button, Center, Flex, Heading, Link, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { nip19 } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { ErrorBoundary } from "../../components/error-boundary";
import useSubscribedCommunitiesList from "../../hooks/use-subscribed-communities-list";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { EmbedEventPointer } from "../../components/embed-event";
import { AddressPointer } from "nostr-tools/lib/nip19";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import CommunityCard from "./components/community-card";

function LoadCommunityCard({ pointer }: { pointer: AddressPointer }) {
  const community = useReplaceableEvent(pointer);
  if (!community) return <span>{nip19.naddrEncode(pointer)}</span>;
  return <CommunityCard community={community} />;
}

function CommunitiesHomePage() {
  const account = useCurrentAccount()!;
  const { pointers: communities } = useSubscribedCommunitiesList(account.pubkey);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Button as={RouterLink} to="/communities/explore">
          Explore Communities
        </Button>
      </Flex>
      {communities.length > 0 ? (
        <SimpleGrid spacing="2" columns={{ base: 1, lg: 2 }}>
          {communities.map((pointer) => (
            <ErrorBoundary key={pointer.kind + pointer.pubkey + pointer.identifier}>
              <LoadCommunityCard pointer={pointer} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      ) : (
        <Center aspectRatio={3 / 4} flexDirection="column" gap="4">
          <Heading size="md">No communities :(</Heading>
          <Text>
            go find a cool one to join.{" "}
            <Link as={RouterLink} to="/communities/explore" color="blue.500">
              Explore
            </Link>
          </Text>
        </Center>
      )}
    </VerticalPageLayout>
  );
}

export default function CommunitiesHomeView() {
  const account = useCurrentAccount();
  return account ? <CommunitiesHomePage /> : <Navigate to="/communities/explore" />;
}
