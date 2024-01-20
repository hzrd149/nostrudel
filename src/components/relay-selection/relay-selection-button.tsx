import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";

import { RelayIcon } from "../icons";
import { useRelaySelectionContext } from "../../providers/local/relay-selection-provider";
import RelayManagementDrawer from "../relay-management-drawer";

export default function RelaySelectionButton({ ...props }: ButtonProps) {
  const relaysModal = useDisclosure();
  const { setSelected, relays } = useRelaySelectionContext();

  return (
    <>
      <Button leftIcon={<RelayIcon />} onClick={relaysModal.onOpen} {...props}>
        {relays.length} {relays.length === 1 ? "Relay" : "Relays"}
      </Button>
      <RelayManagementDrawer isOpen={relaysModal.isOpen} onClose={relaysModal.onClose} />
    </>
  );
}
