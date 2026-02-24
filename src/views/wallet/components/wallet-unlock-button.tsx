import { Button, ButtonProps } from "@chakra-ui/react";
import { UnlockWallet } from "applesauce-wallet/actions";
import { useActionRunner } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { isWalletUnlocked } from "applesauce-wallet/helpers";

import useAsyncAction from "../../../hooks/use-async-action";

export default function WalletUnlockButton({ wallet, ...props }: { wallet?: NostrEvent } & ButtonProps) {
  const actions = useActionRunner();
  const unlock = useAsyncAction(async () => {
    if (!wallet) throw new Error("Missing wallet");
    if (isWalletUnlocked(wallet)) return; // v5: use isWalletUnlocked helper

    await actions.run(UnlockWallet, { history: true, tokens: true });
  }, [wallet, actions]);

  return (
    <Button onClick={unlock.run} isLoading={unlock.loading} {...props}>
      Unlock Wallet
    </Button>
  );
}
