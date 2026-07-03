import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import { DecodeResult } from "applesauce-core/helpers";
import { nip19, NostrEvent } from "nostr-tools";
import { FormEventHandler, useMemo, useState } from "react";

import NappletFrame from "../../components/napplets/napplet-frame";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { isNappletManifestKind } from "../../helpers/nostr/napplets";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import useSingleEvent from "../../hooks/use-single-event";

function parsePointer(value: string): DecodeResult | undefined {
  try {
    return nip19.decode(value.trim()) as DecodeResult;
  } catch {
    return undefined;
  }
}

function NappletLoader({ pointer }: { pointer: DecodeResult }) {
  let event: NostrEvent | undefined;

  switch (pointer.type) {
    case "note":
    case "nevent":
      event = useSingleEvent(pointer.data);
      break;
    case "naddr":
      event = useReplaceableEvent(pointer.data);
      break;
  }

  if (!event) return <Text color="GrayText">Loading manifest event...</Text>;
  if (!isNappletManifestKind(event.kind)) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertDescription>Loaded event kind {event.kind}, but it is not a NIP-5D napplet manifest.</AlertDescription>
      </Alert>
    );
  }

  return <NappletFrame event={event} />;
}

export default function NappletToolView() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState("");
  const pointer = useMemo(() => (submitted ? parsePointer(submitted) : undefined), [submitted]);

  const submit = useMemo<FormEventHandler<HTMLFormElement>>(
    () => (e) => {
      e.preventDefault();
      setSubmitted(value);
    },
    [value],
  );

  return (
    <VerticalPageLayout>
      <Text fontSize="2xl" fontWeight="bold">
        Napplet Frame
      </Text>
      <Text color="GrayText">Paste a NIP-5D manifest pointer to resolve and mount it in a sandboxed frame.</Text>
      <Box as="form" onSubmit={submit}>
        <Flex gap="2" alignItems="flex-end">
          <FormControl>
            <FormLabel>Manifest pointer</FormLabel>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="naddr1..., nevent1..., or note1..."
            />
          </FormControl>
          <Button type="submit" colorScheme="primary">
            Load
          </Button>
        </Flex>
      </Box>
      {submitted && !pointer && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Invalid NIP-19 pointer</AlertDescription>
        </Alert>
      )}
      {pointer && <NappletLoader pointer={pointer} />}
    </VerticalPageLayout>
  );
}
