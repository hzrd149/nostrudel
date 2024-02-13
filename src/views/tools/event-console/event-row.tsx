import { Code, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import ExpandButton from "./expand-button";
import UserName from "../../../components/user-name";

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
          <Code whiteSpace="pre-wrap" noOfLines={4} w="full">
            {event.content}
          </Code>
        </Flex>
      )}
    </>
  );
}
