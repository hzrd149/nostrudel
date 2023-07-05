import { Button, ButtonProps } from "@chakra-ui/react";
import { RelayIcon } from "../icons";
import { useRelaySelectionContext } from "../../providers/relay-selection-provider";

export default function RelaySelectionButton({ ...props }: ButtonProps) {
  const { openModal, relays } = useRelaySelectionContext();

  return (
    <>
      <Button leftIcon={<RelayIcon />} onClick={openModal} {...props}>
        {relays.length} {relays.length === 1 ? "Relay" : "Relays"}
      </Button>
    </>
  );
}
