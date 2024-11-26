import { Button, ButtonGroup, Code } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { EditIcon } from "../../icons";
import { CopyButton } from "../../copy-icon-button";

export default function RawJsonPage({ event }: { event: NostrEvent }) {
  return (
    <>
      <ButtonGroup size="sm" ml="auto">
        <CopyButton value={JSON.stringify(event)}>Copy</CopyButton>
        <Button
          leftIcon={<EditIcon />}
          as={RouterLink}
          to="/tools/publisher"
          state={{ draft: event }}
          colorScheme="primary"
        >
          Edit
        </Button>
      </ButtonGroup>

      <Code whiteSpace="pre" overflowX="auto" width="100%" p="2">
        {JSON.stringify(event, null, 2)}
      </Code>
    </>
  );
}
