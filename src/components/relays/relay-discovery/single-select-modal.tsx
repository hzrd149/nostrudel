import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, ModalProps } from "@chakra-ui/react";

import useAsyncAction from "../../../hooks/use-async-action";
import RelayDiscoveryList, { RelayDiscoveryModalHeader } from "./relay-list";

export type RelayDiscoverySingleSelectModalProps = Omit<ModalProps, "children"> & {
  /** OR list of NIP-66 W attributes to filter relays by */
  attributes: string[];
  /** Called immediately when the user clicks a relay */
  onSelect: (relay: string) => void | Promise<void>;
  /** Relay URLs to hide (already added) */
  hidden?: string[];
};

/** A modal for discovering NIP-66 relays by attributes and selecting a single relay */
export default function RelayDiscoverySingleSelectModal({
  attributes,
  onSelect,
  hidden,
  onClose,
  ...props
}: RelayDiscoverySingleSelectModalProps) {
  const { run: select } = useAsyncAction(
    async (relay: string) => {
      await onSelect(relay);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <Modal onClose={onClose} size="2xl" scrollBehavior="inside" {...props}>
      <ModalOverlay />
      <ModalContent>
        <RelayDiscoveryModalHeader attributes={attributes} />
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" overflow="hidden" pt="0" pb="4">
          <RelayDiscoveryList attributes={attributes} hidden={hidden} onSelect={select} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
