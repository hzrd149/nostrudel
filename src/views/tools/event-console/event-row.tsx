import { Box, Code, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import ExpandButton from "./expand-button";
import UserName from "../../../components/user/user-name";
import { CopyIconButton } from "../../../components/copy-icon-button";
import Timestamp from "../../../components/timestamp";

export default function EventRow({ event }: { event: NostrEvent }) {
  const expanded = useDisclosure();

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
        {!expanded.isOpen && (
          <Text isTruncated fontSize="sm">
            {event.content}
          </Text>
        )}
        <ExpandButton isOpen={expanded.isOpen} onToggle={expanded.onToggle} size="xs" variant="ghost" ml="auto" />
      </Flex>

      {expanded.isOpen && (
        <Flex gap="2" direction="column" px="2" pb="2" alignItems="flex-start">
          <Flex gap="2">
            <Text>ID: </Text>
            <Code>{event.id}</Code>
            <CopyIconButton text={event.id} aria-label="Copy ID" title="Copy ID" size="xs" />
          </Flex>
          <Flex gap="2">
            <Text>Pubkey: </Text>
            <Code>{event.pubkey}</Code>
            <CopyIconButton text={event.pubkey} aria-label="Copy Pubkey" title="Copy Pubkey" size="xs" />
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
        </Flex>
      )}
    </>
  );
}
