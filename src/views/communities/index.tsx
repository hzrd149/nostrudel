import { Button, Center, Flex, Heading, Link, SimpleGrid, Text, useDisclosure, useToast } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import dayjs from "dayjs";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { ErrorBoundary } from "../../components/error-boundary";
import useSubscribedCommunitiesList from "../../hooks/use-subscribed-communities-list";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { PointerCommunityCard } from "./components/community-card";
import CommunityCreateModal, { FormValues } from "./components/community-create-modal";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent } from "../../types/nostr-event";
import { COMMUNITY_DEFINITION_KIND, getCommunityName } from "../../helpers/nostr/communities";
import NostrPublishAction from "../../classes/nostr-publish-action";
import { unique } from "../../helpers/array";
import clientRelaysService from "../../services/client-relays";
import replaceableEventLoaderService from "../../services/replaceable-event-requester";
import { getImageSize } from "../../helpers/image";

function CommunitiesHomePage() {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const createModal = useDisclosure();
  const { pointers: communities } = useSubscribedCommunitiesList(account.pubkey, { alwaysRequest: true });

  const createCommunity = async (values: FormValues) => {
    try {
      const draft: DraftNostrEvent = {
        kind: COMMUNITY_DEFINITION_KIND,
        created_at: dayjs().unix(),
        content: "",
        tags: [["d", values.name]],
      };

      for (const pubkey of values.mods) {
        draft.tags.push(["p", pubkey, "", "moderator"]);
      }
      for (const url of values.relays) {
        draft.tags.push(["relay", url]);
      }

      if (values.description) draft.tags.push(["description", values.description]);
      if (values.banner) {
        try {
          const size = await getImageSize(values.banner);
          draft.tags.push(["image", values.banner, `${size.width}x${size.height}`]);
        } catch (e) {
          draft.tags.push(["image", values.banner]);
        }
      }
      if (values.ranking) draft.tags.push(["rank_mode", values.ranking]);

      const signed = await requestSignature(draft);
      new NostrPublishAction(
        "Create Community",
        unique([...clientRelaysService.getWriteUrls(), ...values.relays]),
        signed,
      );

      replaceableEventLoaderService.handleEvent(signed);

      navigate(`/c/${getCommunityName(signed)}/${signed.pubkey}`);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  return (
    <>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Button as={RouterLink} to="/communities/explore">
            Explore Communities
          </Button>

          <Button ml="auto" onClick={createModal.onOpen}>
            Create Community
          </Button>
        </Flex>
        {communities.length > 0 ? (
          <SimpleGrid spacing="2" columns={{ base: 1, lg: 2 }}>
            {communities.map((pointer) => (
              <ErrorBoundary key={pointer.kind + pointer.pubkey + pointer.identifier}>
                <PointerCommunityCard pointer={pointer} />
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
      {createModal.isOpen && (
        <CommunityCreateModal isOpen={createModal.isOpen} onClose={createModal.onClose} onSubmit={createCommunity} />
      )}
    </>
  );
}

export default function CommunitiesHomeView() {
  const account = useCurrentAccount();
  return account ? <CommunitiesHomePage /> : <Navigate to="/communities/explore" />;
}
