import { Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import { useActiveWallet } from "../../../hooks/use-wallets";
import Wallet02 from "../../icons/wallet-02";
import NavItem from "./nav-item";

/** Nav link to the wallet view showing the active wallet's balance */
export default function WalletNavItem() {
  const wallet = useActiveWallet();
  const balance = use$(wallet?.balance$);

  const formatted = balance === undefined ? undefined : `${balance.toLocaleString()} sats`;

  return (
    <NavItem
      to="/wallet"
      icon={Wallet02}
      label="Wallet"
      title={formatted ? `Wallet (${formatted})` : "Wallet"}
      badge={
        formatted && (
          <Text as="span" ms="auto" ps="2" fontWeight="normal" color="GrayText">
            {formatted}
          </Text>
        )
      }
    />
  );
}
