import { useOutletContext } from "react-router-dom";
import dayjs from "dayjs";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Image,
  Link,
  Stat,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { ArrowDownSIcon, ArrowUpSIcon, AtIcon, ExternalLinkIcon, KeyIcon, LightningIcon } from "../../components/icons";
import { normalizeToBech32 } from "../../helpers/nip19";
import { Bech32Prefix } from "../../helpers/nip19";
import { truncatedId } from "../../helpers/nostr/event";
import { CopyIconButton } from "../../components/copy-icon-button";
import { QrIconButton } from "./components/share-qr-button";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import { useUserContacts } from "../../hooks/use-user-contacts";
import userTrustedStatsService from "../../services/user-trusted-stats";
import { readablizeSats } from "../../helpers/bolt11";
import { UserAvatar } from "../../components/user-avatar";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useSharableProfileId } from "../../hooks/use-shareable-profile-id";
import { parseAddress } from "../../services/dns-identity";
import { getLudEndpoint } from "../../helpers/lnurl";

function buildDescriptionContent(description: string) {
  let content: EmbedableContent = [description.trim()];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderGenericUrl]);

  return content;
}

export default function UserAboutTab() {
  const expanded = useDisclosure();
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const metadata = useUserMetadata(pubkey, contextRelays);
  const contacts = useUserContacts(pubkey, contextRelays);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);
  const nprofile = useSharableProfileId(pubkey);

  const { value: stats } = useAsync(() => userTrustedStatsService.getUserStats(pubkey), [pubkey]);

  const aboutContent = metadata?.about && buildDescriptionContent(metadata?.about);
  const parsedNip05 = metadata?.nip05 ? parseAddress(metadata.nip05) : undefined;

  return (
    <Flex
      overflowY="auto"
      overflowX="hidden"
      direction="column"
      gap="2"
      pt={metadata?.banner ? 0 : "2"}
      pb="8"
      h="full"
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
            <Heading isTruncated>{getUserDisplayName(metadata, pubkey)}</Heading>
            <UserDnsIdentityIcon pubkey={pubkey} />
          </Box>
        </Flex>
        <IconButton
          icon={expanded.isOpen ? <ArrowUpSIcon /> : <ArrowDownSIcon />}
          aria-label="expand"
          onClick={expanded.onToggle}
          top="2"
          right="2"
          variant="solid"
          position="absolute"
        />
      </Box>
      {aboutContent && (
        <Box whiteSpace="pre-wrap" px="2">
          {aboutContent}
        </Box>
      )}

      <Flex gap="2" px="2" direction="column">
        {metadata?.lud16 && (
          <Flex gap="2">
            <LightningIcon />
            <Link href={getLudEndpoint(metadata.lud16)} isExternal>
              {metadata.lud16}
            </Link>
          </Flex>
        )}
        {parsedNip05 && (
          <Flex gap="2">
            <AtIcon />
            <Link href={`//${parsedNip05.domain}/.well-known/nostr.json?name=${parsedNip05.name}`} isExternal>
              <UserDnsIdentityIcon pubkey={pubkey} />
            </Link>
          </Flex>
        )}
        {metadata?.website && (
          <Flex gap="2">
            <ExternalLinkIcon />
            <Link href={metadata.website} target="_blank" color="blue.500" isExternal>
              {metadata.website}
            </Link>
          </Flex>
        )}
        {npub && (
          <Flex gap="2">
            <KeyIcon />
            <Text>{truncatedId(npub, 10)}</Text>
            <CopyIconButton text={npub} title="Copy npub" aria-label="Copy npub" size="xs" />
            <QrIconButton pubkey={pubkey} title="Show QrCode" aria-label="Show QrCode" size="xs" />
          </Flex>
        )}
      </Flex>

      <Accordion allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Network Stats
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb="2">
            <StatGroup gap="4" whiteSpace="pre">
              <Stat>
                <StatLabel>Following</StatLabel>
                <StatNumber>{contacts ? readablizeSats(contacts.contacts.length) : "Unknown"}</StatNumber>
                {contacts && <StatHelpText>Updated {dayjs.unix(contacts.created_at).fromNow()}</StatHelpText>}
              </Stat>

              {stats && (
                <>
                  <Stat>
                    <StatLabel>Followers</StatLabel>
                    <StatNumber>{readablizeSats(stats.followers_pubkey_count) || 0}</StatNumber>
                  </Stat>

                  <Stat>
                    <StatLabel>Published Notes</StatLabel>
                    <StatNumber>{readablizeSats(stats.pub_post_count) || 0}</StatNumber>
                  </Stat>

                  <Stat>
                    <StatLabel>Reactions</StatLabel>
                    <StatNumber>{readablizeSats(stats.pub_reaction_count) || 0}</StatNumber>
                  </Stat>
                </>
              )}
            </StatGroup>
          </AccordionPanel>
        </AccordionItem>

        {(stats?.zaps_sent || stats?.zaps_received) && (
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  Zap Stats
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb="2">
              <StatGroup gap="4" whiteSpace="pre">
                {stats.zaps_sent && (
                  <>
                    <Stat>
                      <StatLabel>Zap Sent</StatLabel>
                      <StatNumber>{stats.zaps_sent.count}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Sats Sent</StatLabel>
                      <StatNumber>{readablizeSats(stats.zaps_sent.msats / 1000)}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Avg Zap Sent</StatLabel>
                      <StatNumber>{readablizeSats(stats.zaps_sent.avg_msats / 1000)}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Biggest Zap Sent</StatLabel>
                      <StatNumber>{readablizeSats(stats.zaps_sent.max_msats / 1000)}</StatNumber>
                    </Stat>
                  </>
                )}

                {stats.zaps_received && (
                  <>
                    <Stat>
                      <StatLabel>Zap Received</StatLabel>
                      <StatNumber>{stats.zaps_received.count}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Sats Received</StatLabel>
                      <StatNumber>{readablizeSats(stats.zaps_received.msats / 1000)}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Avg Zap Received</StatLabel>
                      <StatNumber>{readablizeSats(stats.zaps_received.avg_msats / 1000)}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Biggest Zap Received</StatLabel>
                      <StatNumber>{readablizeSats(stats.zaps_received.max_msats / 1000)}</StatNumber>
                    </Stat>
                  </>
                )}
              </StatGroup>
              <Text color="slategrey">
                Stats from{" "}
                <Link href="https://nostr.band" isExternal color="blue.500">
                  nostr.band
                </Link>
              </Text>
            </AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
      <Flex gap="2">
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
      </Flex>
    </Flex>
  );
}
