import { Button, ButtonProps } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import { UnlockIcon } from "../../../../components/icons";
import useAsyncAction from "../../../../hooks/use-async-action";
import useMessaging from "../../../../hooks/use-messaging";

export default function DecryptLegacyMessagesButton({ other, ...props }: { other: string } & ButtonProps) {
  const session = useMessaging();
  const conversation = useMemo(() => session?.legacy.conversation(other), [session, other]);
  const state = use$(() => conversation?.decryptionState$, [conversation]);
  const decrypt = useAsyncAction(async () => {
    await conversation?.unlock();
  }, [conversation]);
  if (!state?.locked) return null;
  return (
    <Button leftIcon={<UnlockIcon boxSize={5} />} onClick={decrypt.run} isLoading={decrypt.loading} {...props}>
      Decrypt all ({state.locked})
    </Button>
  );
}
