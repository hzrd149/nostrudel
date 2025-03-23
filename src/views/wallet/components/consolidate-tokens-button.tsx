import { Button, ButtonProps } from "@chakra-ui/react";
import { ConsolidateTokens } from "applesauce-wallet/actions";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";

import useUserWallet from "../../../hooks/use-user-wallet";
import useAsyncAction from "../../../hooks/use-async-action";

export default function ConsolidateTokensButton({ children, ...props }: Omit<ButtonProps, "onClick" | "isLoading">) {
  const account = useActiveAccount()!;
  const wallet = useUserWallet(account.pubkey);
  const actions = useActionHub();

  const consolidate = useAsyncAction(async () => {
    if (!wallet) throw new Error("Missing wallet");
    await actions.run(ConsolidateTokens);
  }, [wallet, actions]);

  return (
    <Button onClick={consolidate.run} isLoading={consolidate.loading} {...props}>
      {children || "Consolidate"}
    </Button>
  );
}
