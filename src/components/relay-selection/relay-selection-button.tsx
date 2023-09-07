import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";
import { RelayIcon } from "../icons";
import { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import RelaySelectionModal from "./relay-selection-modal";

export default function RelaySelectionButton({ ...props }: ButtonProps) {
  const relaysModal = useDisclosure();
  const { setSelected, relays } = useRelaySelectionContext();

  return (
    <>
      <Button leftIcon={<RelayIcon />} onClick={relaysModal.onOpen} {...props}>
        {relays.length} {relays.length === 1 ? "Relay" : "Relays"}
      </Button>
      {relaysModal.isOpen && (
        <RelaySelectionModal selected={relays} onSubmit={setSelected} onClose={relaysModal.onClose} />
      )}
    </>
  );
}
