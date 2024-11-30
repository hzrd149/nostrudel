import { CloseButton, Code, Flex, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import useEventUpdate from "../../../hooks/use-event-update";
import { eventStore } from "../../../services/event-store";

export default function DebugEventCachePage({ event }: { event: NostrEvent }) {
  useEventUpdate(event.id);
  const fields = Object.getOwnPropertySymbols(event);
  const update = () => eventStore.update(event);

  const renderValue = (field: symbol) => {
    let value = Reflect.get(event, field);

    if (value instanceof Map) return JSON.stringify(Object.fromEntries(value.entries()));
    if (value instanceof Set) return JSON.stringify(Array.from(value));

    return JSON.stringify(value);
  };

  return (
    <Flex direction="column">
      {fields.map((field) => (
        <Flex gap="2" alignItems="center">
          <Text fontWeight="bold" whiteSpace="pre">
            {field.description}
          </Text>
          <Code fontFamily="monospace" isTruncated>
            {renderValue(field)}
          </Code>
          <CloseButton
            ml="auto"
            onClick={() => {
              Reflect.deleteProperty(event, field);
              update();
            }}
          />
        </Flex>
      ))}
    </Flex>
  );
}
