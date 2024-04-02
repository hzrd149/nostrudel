import { Box, Code, Flex, Heading, Link, Switch, Text, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import ExpandButton from "./expand-button";
import { nip19 } from "nostr-tools";
import { getSharableEventAddress } from "../../../helpers/nip19";
import UserName from "../../../components/user/user-name";
import { CopyIconButton } from "../../../components/copy-icon-button";
import Timestamp from "../../../components/timestamp";
import stringify from "json-stringify-deterministic";
import { ViewProfileButton } from "../../../components/view-userprofile";
import { ViewNjumpUrl } from "../../../components/view-njumpurl";

export default function EventRow({ event }: { event: NostrEvent }) {
  const expanded = useDisclosure();
  const raw = useDisclosure();
  const address = "https://njump.me/" + getSharableEventAddress(event);
  const npub = "#/u/" + nip19.npubEncode(event.pubkey);

  return (
    <>
      <Flex
        gap="2"
        alignItems="center"
        borderTopWidth={1}
        p="2"
        onClick={expanded.onToggle}
        overflow="hidden"
        cursor="pointer"
      >
        <Text fontFamily="monospace" whiteSpace="pre">
          {event.id.slice(0, 8)} ({event.kind}) [{event.tags.length}]
        </Text>
        <UserName pubkey={event.pubkey} fontSize="sm" />
        <ViewProfileButton  as={Link}  href={npub} aria-label="View Profile" title="View Profile" size="xs" />
        {!expanded.isOpen && (
          <Text isTruncated fontSize="sm">
            {event.content}
          </Text>
        )}
        <ExpandButton isOpen={expanded.isOpen} onToggle={expanded.onToggle} size="xs" variant="ghost" ml="auto" />
      </Flex>

      {expanded.isOpen && (
        <Flex gap="2" direction="column" px="2" pb="2" alignItems="flex-start" position="relative">
          <Flex
            top="2"
            right="4"
            position="absolute"
            gap="2"
            alignItems="center"
            p="2"
            bg="var(--chakra-colors-chakra-body-bg)"
            borderRadius="md"
          >
            {raw.isOpen && (
              <CopyIconButton value={stringify(event, { space: "  " })} aria-label="Copy json" size="sm" />
            )}
            <Switch size="sm" checked={!raw.isOpen} onChange={raw.onToggle}>
              Raw
            </Switch>
          </Flex>
          {raw.isOpen ? (
            <Code whiteSpace="pre" w="full" overflow="auto">
              {stringify(event, { space: "  " })}
            </Code>
          ) : (
            <>
              <Flex gap="2">
                <Text>ID: </Text>
                <Code>{event.id}</Code>
                <CopyIconButton value={event.id} aria-label="Copy ID" title="Copy ID" size="xs" />
                <ViewNjumpUrl as={Link}  href={address} aria-label="View opinon on Njump" title="View opinion on Njump" size="xs" />
              </Flex>
              <Flex gap="2">
                <Text>Pubkey: </Text>
                <Code>{event.pubkey}</Code>
                <CopyIconButton value={event.pubkey} aria-label="Copy Pubkey" title="Copy Pubkey" size="xs" />
              </Flex>
              <Flex gap="2">
                <Text>Created: </Text>
                <Code>{event.created_at}</Code>
                <Timestamp timestamp={event.created_at} />
              </Flex>
              <Code whiteSpace="pre-wrap" w="full">
                {event.content}
              </Code>
              <Box>
                <Text>Tags:</Text>
                <Flex gap="2" direction="column">
                  {event.tags.map((t, i) => (
                    <Flex key={t.join(",") + i} gap="1" wrap="wrap">
                      {t.map((v, ii) => (
                        <Code key={v} minW="1rem" fontFamily="monospace" fontWeight={ii === 0 ? "bold" : "normal"}>
                          {v}
                        </Code>
                      ))}
                    </Flex>
                  ))}
                </Flex>
              </Box>
            </>
          )}
        </Flex>
      )}
    </>
  );
}
