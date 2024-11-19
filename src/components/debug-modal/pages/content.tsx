import { Code, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { TextNoteContentSymbol } from "applesauce-content/text";
import { Root } from "applesauce-content/nast";

import { CopyButton } from "../../copy-icon-button";
import RawJson from "../raw-json";

export default function DebugContentPage({ event }: { event: NostrEvent }) {
  const nast = Reflect.get(event, TextNoteContentSymbol) as Root;

  return (
    <Flex gap="2" direction="column">
      <CopyButton value={event.content} variant="link" size="sm" ml="auto">
        Copy content
      </CopyButton>
      <Code whiteSpace="pre" overflowX="auto" width="100%" p="2">
        {event.content}
      </Code>

      {nast && <RawJson heading="Parsed content" json={nast.children} />}
    </Flex>
  );
}
