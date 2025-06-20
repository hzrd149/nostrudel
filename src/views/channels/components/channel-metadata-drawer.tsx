import {
  Button,
  ButtonGroup,
  Card,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Heading,
  Image,
  Link,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import { NostrEvent } from "nostr-tools";
import useChannelMetadata from "../../../hooks/use-channel-metadata";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import UserLink from "../../../components/user/user-link";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import ChannelJoinButton from "./channel-join-button";
import { ExternalLinkIcon } from "../../../components/icons";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";

function UserCard({ pubkey }: { pubkey: string }) {
  return (
    <Card as={LinkBox} direction="row" alignItems="center" gap="2" p="2">
      <UserAvatar pubkey={pubkey} size="sm" />
      <HoverLinkOverlay as={UserLink} pubkey={pubkey} fontWeight="bold" />
      <UserDnsIdentity pubkey={pubkey} onlyIcon />
    </Card>
  );
}
function ChannelMembers({ channel, relays }: { channel: NostrEvent; relays: string[] }) {
  const { loader, timeline: userLists } = useTimelineLoader(`${channel.id}-members`, relays, {
    kinds: [kinds.PublicChatsList],
    "#e": [channel.id],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex gap="2" direction="column">
        {userLists?.map((list) => <UserCard key={list.pubkey} pubkey={list.pubkey} />)}
      </Flex>
    </IntersectionObserverProvider>
  );
}

export default function ChannelMetadataDrawer({
  isOpen,
  onClose,
  channel,
  ...props
}: Omit<DrawerProps, "children"> & { channel: NostrEvent }) {
  const metadata = useChannelMetadata(channel);
  const relays = useReadRelays(useAdditionalRelayContext());

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader p="4">{metadata?.name}</DrawerHeader>

        <DrawerBody px="4" pt="0" pb="4">
          <ButtonGroup>
            <ChannelJoinButton channel={channel} />
            <Button
              as={Link}
              href={`https://www.nostrchat.io/channel/${channel.id}`}
              leftIcon={<Image src="https://www.nostrchat.io//favicon.ico" w="6" h="6" />}
              rightIcon={<ExternalLinkIcon />}
              isExternal
            >
              Open NostrChat
            </Button>
          </ButtonGroup>
          <Heading size="sm" mt="2">
            About
          </Heading>
          <Text whiteSpace="pre">{metadata?.about}</Text>
          <Heading size="sm" mt="2">
            Members
          </Heading>
          <ChannelMembers channel={channel} relays={relays} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
