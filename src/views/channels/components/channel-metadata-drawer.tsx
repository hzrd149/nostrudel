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
import { NostrEvent } from "../../../types/nostr-event";
import useChannelMetadata from "../../../hooks/use-channel-metadata";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import UserLink from "../../../components/user-link";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import UserAvatar from "../../../components/user-avatar";
import { useRelaySelectionContext } from "../../../providers/local/relay-selection-provider";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import ChannelJoinButton from "./channel-join-button";
import { ExternalLinkIcon } from "../../../components/icons";
import { CHANNELS_LIST_KIND } from "../../../helpers/nostr/lists";

function UserCard({ pubkey }: { pubkey: string }) {
  return (
    <Card as={LinkBox} direction="row" alignItems="center" gap="2" p="2">
      <UserAvatar pubkey={pubkey} size="sm" />
      <HoverLinkOverlay as={UserLink} pubkey={pubkey} fontWeight="bold" />
      <UserDnsIdentityIcon pubkey={pubkey} onlyIcon />
    </Card>
  );
}
function ChannelMembers({ channel, relays }: { channel: NostrEvent; relays: string[] }) {
  const timeline = useTimelineLoader(`${channel.id}-members`, relays, {
    kinds: [CHANNELS_LIST_KIND],
    "#e": [channel.id],
  });
  const userLists = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex gap="2" direction="column">
        {userLists.map((list) => (
          <UserCard key={list.pubkey} pubkey={list.pubkey} />
        ))}
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
  const { metadata } = useChannelMetadata(channel.id);
  const { relays } = useRelaySelectionContext();

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
          <Text whiteSpace="pre">{metadata.about}</Text>
          <Heading size="sm" mt="2">
            Members
          </Heading>
          <ChannelMembers channel={channel} relays={relays} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
