import { useOutletContext, Link as RouterLink } from "react-router";
import {
  Box,
  Button,
  Flex,
  Heading,
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
import { nip19 } from "nostr-tools";
import { ChatIcon } from "@chakra-ui/icons";
import { parseLNURLOrAddress } from "applesauce-core/helpers";

import { truncatedId } from "../../../helpers/nostr/event";
import { parseAddress } from "../../../services/dns-identity";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";
import useUserProfile from "../../../hooks/use-user-profile";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  KeyIcon,
  LightningIcon,
  VerifiedIcon,
} from "../../../components/icons";
import { CopyIconButton } from "../../../components/copy-icon-button";
import { QrIconButton } from "../components/share-qr-button";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserAvatar from "../../../components/user/user-avatar";
import { UserFollowButton } from "../../../components/user/user-follow-button";
import UserZapButton from "../components/user-zap-button";
import { UserProfileMenu } from "../components/user-profile-menu";
import { useSharableProfileId } from "../../../hooks/use-shareable-profile-id";
import UserProfileBadges from "./user-profile-badges";
import UserPinnedEvents from "./user-pinned-events";
import UserStatsAccordion from "./user-stats-accordion";
import UserJoinedChanneled from "./user-joined-channels";
import { getTextColor } from "../../../helpers/color";
import UserName from "../../../components/user/user-name";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import UserAboutContent from "../../../components/user/user-about-content";
import UserRecentEvents from "./user-recent-events";
import useAppSettings, { useUserAppSettings } from "../../../hooks/use-user-app-settings";

function DNSIdentityWarning({ pubkey }: { pubkey: string }) {
  const metadata = useUserProfile(pubkey);
  const dnsIdentity = useUserDNSIdentity(pubkey);
  const parsedNip05 = metadata?.nip05 ? parseAddress(metadata.nip05) : undefined;
  const nip05URL = parsedNip05
    ? `https://${parsedNip05.domain}/.well-known/nostr.json?name=${parsedNip05.name}`
    : undefined;

  if (dnsIdentity === undefined)
    return (
      <Text color="yellow.500">
        Unable to check DNS identity due to CORS error{" "}
        {nip05URL && (
          <Link
            color="blue.500"
            href={`https://cors-test.codehappy.dev/?url=${encodeURIComponent(nip05URL)}&method=get`}
            isExternal
          >
            Test
            <ExternalLinkIcon ml="1" />
          </Link>
        )}
      </Text>
    );
  else if (dnsIdentity.exists === false) return <Text color="red.500">Unable to find nostr.json file</Text>;
  else if (dnsIdentity.pubkey === undefined)
    return <Text color="red.500">Unable to find DNS Identity in nostr.json file</Text>;
  else if (dnsIdentity.pubkey === pubkey) return null;
  else
    return (
      <Text color="red.500" fontWeight="bold">
        Invalid DNS Identity!
      </Text>
    );
}

export default function UserAboutTab() {
  const expanded = useDisclosure();
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const colorModal = useDisclosure();

  const metadata = useUserProfile(pubkey, contextRelays);
  const npub = nip19.npubEncode(pubkey);
  const nprofile = useSharableProfileId(pubkey);
  const pubkeyColor = "#" + pubkey.slice(0, 6);
  const settings = useUserAppSettings(pubkey);

  const parsedNip05 = metadata?.nip05 ? parseAddress(metadata.nip05) : undefined;
  const nip05URL = parsedNip05
    ? `https://${parsedNip05.domain}/.well-known/nostr.json?name=${parsedNip05.name}`
    : undefined;

  return (
    <Flex
      overflowY="auto"
      overflowX="hidden"
      direction="column"
      gap="2"
      pt={metadata?.banner ? 0 : "2"}
      pb="8"
      minH="90vh"
    >
      <Box
        pt={!expanded.isOpen ? "20vh" : 0}
        px={!expanded.isOpen ? "2" : 0}
        pb={!expanded.isOpen ? "4" : 0}
        w="full"
        position="relative"
        backgroundImage={!expanded.isOpen ? metadata?.banner : ""}
        backgroundPosition="center"
        backgroundSize="cover"
        backgroundRepeat="no-repeat"
      >
        {expanded.isOpen && <Image src={metadata?.banner} w="full" />}
        <Flex
          bottom="0"
          right="0"
          left="0"
          p="2"
          position="absolute"
          direction={["column", "row"]}
          bg="linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, var(--chakra-colors-chakra-body-bg) 100%)"
          gap="2"
          alignItems={["flex-start", "flex-end"]}
        >
          <UserAvatar pubkey={pubkey} size={["lg", "lg", "xl"]} noProxy />
          <Box overflow="hidden">
            <Heading isTruncated>
              <UserName pubkey={pubkey} />
            </Heading>
            <UserDnsIdentity pubkey={pubkey} />
          </Box>

          <Flex gap="2" ml="auto">
            <UserZapButton pubkey={pubkey} size="sm" variant="link" />

            <IconButton
              as={RouterLink}
              size="sm"
              icon={<ChatIcon />}
              aria-label="Message"
              to={`/messages/${npub ?? pubkey}`}
            />
            <UserFollowButton pubkey={pubkey} size="sm" showLists />
            <UserProfileMenu pubkey={pubkey} aria-label="More Options" size="sm" />
          </Flex>
        </Flex>
        <IconButton
          icon={expanded.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          aria-label="expand"
          onClick={expanded.onToggle}
          top="2"
          right="2"
          variant="solid"
          position="absolute"
        />
      </Box>
      <UserAboutContent pubkey={pubkey} />

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
            <DNSIdentityWarning pubkey={pubkey} />
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
        {npub && (
          <Flex gap="2">
            <KeyIcon boxSize="1.2em" />
            <Text>{truncatedId(npub, 10)}</Text>
            <CopyIconButton value={npub} title="Copy npub" aria-label="Copy npub" size="xs" />
            <QrIconButton pubkey={pubkey} title="Show QrCode" aria-label="Show QrCode" size="xs" />
          </Flex>
        )}

        {settings?.primaryColor && (
          <Flex gap="2">
            <Box w="5" h="5" backgroundColor={settings.primaryColor} rounded="full" />
            <Text>noStrudel theme color</Text>
          </Flex>
        )}
      </Flex>

      <UserProfileBadges pubkey={pubkey} px="2" />
      <UserPinnedEvents pubkey={pubkey} />
      <Box px="2">
        <Heading size="md">Recent events:</Heading>
        <UserRecentEvents pubkey={pubkey} />
      </Box>
      <UserStatsAccordion pubkey={pubkey} />

      <Flex gap="2" wrap="wrap">
        <Button
          as={Link}
          href={`https://nosta.me/${nprofile}`}
          leftIcon={<Image src="https://nosta.me/images/favicon-32x32.png" w="1.2em" />}
          rightIcon={<ExternalLinkIcon />}
          isExternal
        >
          Nosta.me page
        </Button>
        <Button
          as={Link}
          href={`https://slidestr.net/${npub}`}
          leftIcon={<Image src="https://slidestr.net/slidestr.svg" w="1.2em" />}
          rightIcon={<ExternalLinkIcon />}
          isExternal
        >
          Slidestr Slideshow
        </Button>
        <Button
          as={Link}
          href={`https://nostree.me/${npub}`}
          leftIcon={<Image src="https://nostree.me/favicon.svg" w="1.2em" />}
          rightIcon={<ExternalLinkIcon />}
          isExternal
        >
          Nostree page
        </Button>
      </Flex>
      <UserJoinedChanneled pubkey={pubkey} />

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
    </Flex>
  );
}
