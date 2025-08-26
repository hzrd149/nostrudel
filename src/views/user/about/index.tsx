import { ChatIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  addRelayHintsToPointer,
  getDisplayName,
  parseLNURLOrAddress,
  parseNIP05Address,
} from "applesauce-core/helpers";
import { useActiveAccount, useObservableMemo, useObservableState } from "applesauce-react/hooks";
import { kinds, nip19 } from "nostr-tools";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { CopyIconButton } from "../../../components/copy-icon-button";
import { ChevronDownIcon, ExternalLinkIcon, KeyIcon, LightningIcon, VerifiedIcon } from "../../../components/icons";
import Share07 from "../../../components/icons/share-07";
import UserAboutContent from "../../../components/user/user-about-content";
import UserAvatar from "../../../components/user/user-avatar";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import { UserFollowButton } from "../../../components/user/user-follow-button";
import UserLink from "../../../components/user/user-link";
import UserName from "../../../components/user/user-name";
import { getTextColor } from "../../../helpers/color";
import { truncatedId } from "../../../helpers/nostr/event";
import { useAppTitle } from "../../../hooks/use-app-title";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useUserContacts from "../../../hooks/use-user-contacts";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import useUserProfile from "../../../hooks/use-user-profile";
import { profileLoader } from "../../../services/loaders";
import { socialGraph$ } from "../../../services/social-graph";
import DNSIdentityWarning from "../../settings/dns-identity/identity-warning";
import { AppTabsBar } from "../../../components/layout/presets/app-tabs-layout";
import { QrIconButton } from "../components/share-qr-button";
import { UserProfileMenu } from "../components/user-profile-menu";
import UserZapButton from "../components/user-zap-button";
import UserJoinedChannels from "./user-joined-channels";
import UserJoinedGroups from "./user-joined-groups";
import UserPinnedEvents from "./user-pinned-events";
import UserProfileBadges from "./user-profile-badges";
import UserRecentEvents from "./user-recent-events";
import UserStatsAccordion from "./user-stats-accordion";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";

function FollowedBy({ pubkey }: { pubkey: string }) {
  const socialGraph = useObservableState(socialGraph$);
  const followedBy = useMemo(
    () => socialGraph && Array.from(socialGraph.followedByFriends(pubkey)).sort(() => Math.random() - 0.5),
    [pubkey, socialGraph],
  );

  const modal = useDisclosure();

  if (!followedBy) return null;

  if (followedBy.length === 0)
    return (
      <Flex gap="2">
        <Share07 boxSize="1.2em" />
        <Text color="orange.500">No one you follow follows this user</Text>
      </Flex>
    );

  return (
    <>
      <Flex gap="2" direction="column">
        <Flex gap="2">
          <Share07 boxSize="1.2em" />
          <Text>Followed by {followedBy.length} people you follow</Text>
        </Flex>
        <Flex gap={1} ms="6">
          {followedBy.slice(0, 8).map((follower) => (
            <UserAvatarLink key={follower} pubkey={follower} size="xs" />
          ))}
          <Button variant="link" size="sm" colorScheme="blue" ms="2" onClick={modal.onOpen}>
            View all
          </Button>
        </Flex>
      </Flex>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>People you follow who follow this user</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4} display="flex" flexDirection="column" gap={2}>
            {followedBy.map((follower) => (
              <HStack key={follower} spacing={2} borderRadius="md">
                <UserAvatarLink pubkey={follower} size="sm" />
                <Flex direction="column">
                  <UserLink pubkey={follower} />
                  <UserDnsIdentity pubkey={follower} fontSize="xs" />
                </Flex>
              </HStack>
            ))}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function UserAboutView() {
  const account = useActiveAccount();
  const user = useParamsProfilePointer("pubkey");
  const colorModal = useDisclosure();
  const pubkey = user.pubkey;

  const mailboxes = useUserMailboxes(user);
  const metadata = useUserProfile(user);
  const contacts = useUserContacts(user);
  const followsYou = useMemo(() => contacts?.some((c) => c.pubkey === account?.pubkey), [contacts, account]);

  useAppTitle(getDisplayName(metadata, user.pubkey));

  // Force metadata load
  useObservableMemo(
    () => profileLoader({ kind: kinds.Metadata, pubkey: user.pubkey, relays: mailboxes?.outboxes, cache: false }),
    [user.pubkey],
  );

  const pointerWithRelays = useMemo(
    () =>
      user.relays && user.relays.length > 0 ? user : addRelayHintsToPointer(user, mailboxes?.outboxes.slice(0, 2)),
    [user, mailboxes?.outboxes],
  );

  const npub = useMemo(() => nip19.npubEncode(user.pubkey), [user.pubkey]);
  const pubkeyColor = "#" + user.pubkey.slice(0, 6);

  const parsedNip05 = metadata?.nip05 ? parseNIP05Address(metadata.nip05) : undefined;
  const nip05URL = parsedNip05
    ? `https://${parsedNip05.domain}/.well-known/nostr.json?name=${parsedNip05.name}`
    : undefined;

  const identity = useUserDNSIdentity(user.pubkey);

  return (
    <ScrollLayout flush>
      {metadata?.banner ? (
        <Image
          src={metadata.banner}
          w="full"
          h="20vh"
          objectFit="cover"
          borderBottomWidth={3}
          borderBottomColor={pubkeyColor}
          borderBottomStyle="solid"
        />
      ) : (
        <Box h="14" flexShrink={0} />
      )}

      <Flex gap="2" px="2" wrap="wrap">
        <UserAvatar pubkey={pubkey} size="xl" noProxy mt={-14} />
        <Heading isTruncated>
          <UserName pubkey={pubkey} />
          {followsYou && (
            <Badge colorScheme="green" ms="2">
              Follows you
            </Badge>
          )}
        </Heading>

        <ButtonGroup ms="auto">
          <UserZapButton pubkey={pubkey} variant="ghost" />

          <IconButton
            as={RouterLink}
            icon={<ChatIcon />}
            aria-label="Message"
            to={`/messages/${npub ?? pubkey}`}
            variant="ghost"
          />
          <QrIconButton user={pointerWithRelays} title="Show QrCode" aria-label="Show QrCode" variant="ghost" />
          <UserFollowButton pubkey={pubkey} showLists />
          <UserProfileMenu pubkey={pubkey} aria-label="More Options" />
        </ButtonGroup>
      </Flex>

      <AppTabsBar borderTop="1px solid var(--chakra-colors-chakra-border-color)" />

      <UserAboutContent pubkey={user.pubkey} px="2" />

      <Flex gap="2" px="2" direction="column">
        <Flex gap="2">
          <Box w="5" h="5" backgroundColor={pubkeyColor} rounded="full" />
          <Text>Public key color</Text>
          <Link color="blue.500" onClick={colorModal.onOpen}>
            {pubkeyColor}
          </Link>
        </Flex>

        {metadata?.lud16 && (
          <Flex gap="2">
            <LightningIcon boxSize="1.2em" />
            <Link href={parseLNURLOrAddress(metadata.lud16)?.toString()} isExternal>
              {metadata.lud16}
            </Link>
          </Flex>
        )}
        {nip05URL && (
          <Box>
            <Flex gap="2">
              <VerifiedIcon boxSize="1.2em" />
              <Link href={nip05URL} isExternal>
                <UserDnsIdentity pubkey={pubkey} />
              </Link>
            </Flex>
            {identity && <DNSIdentityWarning identity={identity} pubkey={pubkey} />}
          </Box>
        )}
        {metadata?.website && (
          <Flex gap="2">
            <ExternalLinkIcon boxSize="1.2em" />
            <Link href={metadata.website} target="_blank" color="blue.500" isExternal>
              {metadata.website}
            </Link>
          </Flex>
        )}
        <Flex gap="2">
          <KeyIcon boxSize="1.2em" />
          <Text>{truncatedId(npub, 10)}</Text>
          <CopyIconButton value={npub} title="Copy npub" aria-label="Copy npub" size="xs" variant="ghost" />
        </Flex>

        <FollowedBy pubkey={user.pubkey} />
      </Flex>

      <UserProfileBadges pubkey={user.pubkey} px="2" />
      <UserPinnedEvents pubkey={user.pubkey} />
      <Box px="2">
        <Heading size="md">Recent events:</Heading>
        <UserRecentEvents pubkey={user.pubkey} />
      </Box>
      <UserStatsAccordion pubkey={user.pubkey} />

      <UserJoinedGroups pubkey={user.pubkey} />
      <UserJoinedChannels pubkey={user.pubkey} />

      <Modal isOpen={colorModal.isOpen} onClose={colorModal.onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Public Key Color</ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDirection="column" px="4" pt="0" pb="4" alignItems="center">
            <Input value={pubkey} readOnly />
            <ChevronDownIcon boxSize={10} />
            <Flex w="full" h="10">
              <Flex
                px="2"
                py="1"
                borderWidth="1px"
                borderStart="solid"
                rounded="md"
                borderColor="primary.500"
                alignItems="center"
              >
                {pubkey.slice(0, 6)}
              </Flex>
              <Flex borderWidth="1px" borderStyle="solid" px="2" py="1" rounded="md" flex="1" alignItems="center">
                {pubkey.slice(6)}
              </Flex>
            </Flex>
            <ChevronDownIcon boxSize={10} />
            <Box
              px="10"
              py="2"
              backgroundColor={pubkeyColor}
              rounded="md"
              textColor={getTextColor(pubkeyColor.replace("#", "")) === "light" ? "white" : "black"}
            >
              {pubkeyColor}
            </Box>

            <Text mt="4">
              The public key color is a hex color code created by taking the first 6 digits of a users pubkey.
              <br />
              It can be used to help users identify fake accounts or impersonators
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </ScrollLayout>
  );
}
