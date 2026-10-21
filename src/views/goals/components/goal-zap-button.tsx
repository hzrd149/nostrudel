import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";
import { ZapGoal } from "applesauce-common/casts";

import ZapModal from "../../../components/event-zap-modal";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { zapsLoader } from "../../../services/loaders";

export default function GoalZapButton({
  goal,
  ...props
}: Omit<ButtonProps, "children" | "onClick"> & { goal: ZapGoal }) {
  const modal = useDisclosure();

  const readRelays = useReadRelays(goal.relays);
  const onZapped = () => {
    modal.onClose();
    setTimeout(() => {
      zapsLoader(goal.event, readRelays).subscribe();
    }, 1000);
  };

  return (
    <>
      <Button colorScheme="yellow" onClick={modal.onOpen} {...props}>
        Zap Goal
      </Button>
      {modal.isOpen && (
        <ZapModal
          isOpen
          onClose={modal.onClose}
          event={goal.event}
          onZapped={onZapped}
          pubkey={goal.author.pubkey}
          relays={goal.relays}
          allowComment
          showEmbed={false}
        />
      )}
    </>
  );
}
