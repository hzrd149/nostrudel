import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import ZapModal from "../../../components/event-zap-modal";
import eventZapsService from "../../../services/event-zaps";
import { getEventUID } from "../../../helpers/nostr/events";
import { getGoalRelays } from "../../../helpers/nostr/goal";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";

export default function GoalZapButton({
  goal,
  ...props
}: Omit<ButtonProps, "children" | "onClick"> & { goal: NostrEvent }) {
  const modal = useDisclosure();

  const readRelays = useReadRelayUrls(getGoalRelays(goal));
  const onZapped = async () => {
    modal.onClose();
    setTimeout(() => {
      eventZapsService.requestZaps(getEventUID(goal), readRelays, true);
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
