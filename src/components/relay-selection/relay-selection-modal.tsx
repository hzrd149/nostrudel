import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";

import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { RelayFavicon } from "../relay-favicon";
import { RelayUrlInput } from "../relay-url-input";
import { unique } from "../../helpers/array";
import relayScoreboardService from "../../services/relay-scoreboard";
import { normalizeRelayURL } from "../../helpers/relay";

function AddRelayForm({ onSubmit }: { onSubmit: (relay: string) => void }) {
  const [url, setUrl] = useState("");
  const toast = useToast();

  return (
    <Flex
      as="form"
      onSubmit={(e) => {
        try {
          e.preventDefault();
          onSubmit(normalizeRelayURL(url));
          setUrl("");
        } catch (err) {
          if (err instanceof Error) {
            toast({ status: "error", description: err.message });
          }
        }
      }}
      gap="2"
      mb="4"
    >
      <RelayUrlInput value={url} onChange={(v) => setUrl(v)} />
      <Button type="submit">Add</Button>
    </Flex>
  );
}

const manuallyAddedRelays = new Set<string>();

export default function RelaySelectionModal({
  selected,
  onClose,
  onSubmit,
}: {
  selected: string[];
  onSubmit: (relays: string[]) => void;
  onClose: () => void;
}) {
  const [newSelected, setSelected] = useState<string[]>(selected);
  const relays = useReadRelayUrls([...selected, ...newSelected, ...Array.from(manuallyAddedRelays)]);

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Relays</ModalHeader>
        <ModalCloseButton />
        <ModalBody py="0">
          <AddRelayForm
            onSubmit={(newRelay) => {
              setSelected(unique([newRelay, ...newSelected]));
              manuallyAddedRelays.add(newRelay);
            }}
          />
          <CheckboxGroup value={newSelected} onChange={(urls) => setSelected(urls.map(String))}>
            <Flex direction="column" gap="2" mb="2">
              {relays.map((url) => (
                <Checkbox key={url} value={url}>
                  <RelayFavicon relay={url} size="xs" /> {url}
                </Checkbox>
              ))}
            </Flex>
          </CheckboxGroup>

          <ButtonGroup>
            <Button onClick={() => setSelected(relays)} size="sm">
              All
            </Button>
            <Button onClick={() => setSelected([])} size="sm">
              None
            </Button>
            <Button onClick={() => setSelected(relayScoreboardService.getRankedRelays(relays).slice(0, 4))} size="sm">
              4 Fastest
            </Button>
          </ButtonGroup>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr="2">
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={() => {
              onSubmit(newSelected);
              onClose();
            }}
          >
            Set relays
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
