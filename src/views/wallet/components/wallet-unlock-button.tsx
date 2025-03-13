import { Button, ButtonProps } from "@chakra-ui/react";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { UnlockWallet } from "applesauce-wallet/actions";

import useUserWallet from "../../../hooks/use-user-wallet";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";

export default function WalletUnlockButton({ children, ...props }: Omit<ButtonProps, "onClick" | "isLoading">) {
  const account = useActiveAccount()!;
  const wallet = useUserWallet(account.pubkey);

  const actions = useActionHub();
  const unlock = useAsyncErrorHandler(async () => {
    if (!wallet) throw new Error("Missing wallet");
    if (wallet.locked === false) return;

    await actions.run(UnlockWallet, { history: true, tokens: true });
  }, [wallet, actions]);

  return (
    <Button onClick={unlock} {...props}>
      {children || "Unlock"}
    </Button>
  );
}
