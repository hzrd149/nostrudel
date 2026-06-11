import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  ModalProps,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";

import useAsyncAction from "../../../hooks/use-async-action";
import RelayDiscoveryList, { RelayDiscoveryModalHeader } from "./relay-list";

export type RelayDiscoveryMultiSelectModalProps = Omit<ModalProps, "children"> & {
  /** OR list of NIP-66 W attributes to filter relays by */
  attributes: string[];
  /** Called with all selected relay URLs when the user confirms */
  onSelect: (relays: string[]) => void | Promise<void>;
  /** Relay URLs to hide (already added) */
  hidden?: string[];
};

/** A modal for discovering NIP-66 relays by attributes and selecting multiple relays */
export default function RelayDiscoveryMultiSelectModal({
  attributes,
  onSelect,
  hidden,
  onClose,
  ...props
}: RelayDiscoveryMultiSelectModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((relay: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(relay)) next.delete(relay);
      else next.add(relay);
      return next;
    });
  }, []);

  // Reset the selection when the modal closes
  const handleClose = useCallback(() => {
    setSelected(new Set());
    onClose();
  }, [onClose]);

  const { run: confirm, loading } = useAsyncAction(async () => {
    await onSelect(Array.from(selected));
    handleClose();
  }, [onSelect, selected, handleClose]);

  return (
    <Modal onClose={handleClose} size="2xl" scrollBehavior="inside" {...props}>
      <ModalOverlay />
      <ModalContent>
        <RelayDiscoveryModalHeader attributes={attributes} />
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" overflow="hidden" pt="0" pb="0">
          <RelayDiscoveryList attributes={attributes} hidden={hidden} selected={selected} onSelect={toggle} />
        </ModalBody>
        <ModalFooter gap="2">
          {selected.size > 0 && <Text color="GrayText">{selected.size} selected</Text>}
          <Spacer />
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button colorScheme="primary" isDisabled={selected.size === 0} isLoading={loading} onClick={confirm}>
            Add {selected.size > 0 ? selected.size : ""} relay{selected.size === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
