import { Button, ButtonProps } from "@chakra-ui/react";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { UnlockWallet } from "applesauce-wallet/actions";

import useUserWallet from "../../../hooks/use-user-wallet";
import useAsyncAction from "../../../hooks/use-async-action";

export default function WalletUnlockButton({ children, ...props }: Omit<ButtonProps, "onClick" | "isLoading">) {
  const account = useActiveAccount()!;
  const wallet = useUserWallet(account.pubkey);

  const actions = useActionHub();
  const unlock = useAsyncAction(async () => {
    if (!wallet) throw new Error("Missing wallet");
    if (wallet.locked === false) return;

    await actions.run(UnlockWallet, { history: true, tokens: true });
  }, [wallet, actions]);

  return (
    <Button onClick={unlock.run} isLoading={unlock.loading} {...props}>
      {children || "Unlock"}
    </Button>
  );
}
