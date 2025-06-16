import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import ZapModal from "../../../components/event-zap-modal";
import { getGoalRelays } from "../../../helpers/nostr/goal";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { zapsLoader } from "../../../services/loaders";

export default function GoalZapButton({
  goal,
  ...props
}: Omit<ButtonProps, "children" | "onClick"> & { goal: NostrEvent }) {
  const modal = useDisclosure();

  const readRelays = useReadRelays(getGoalRelays(goal));
  const onZapped = () => {
    modal.onClose();
    setTimeout(() => {
      zapsLoader(goal, readRelays).subscribe();
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
          event={goal}
          onZapped={onZapped}
          pubkey={goal.pubkey}
          relays={getGoalRelays(goal)}
          allowComment
          showEmbed={false}
        />
      )}
    </>
  );
}
