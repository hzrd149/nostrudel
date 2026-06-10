import { Box, Button, ButtonProps, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import { CheckIcon, ChevronDownIcon } from "../../../components/icons";
import { useActiveWallet, useWallets } from "../../../hooks/use-wallets";
import { setActiveWallet, WALLET_TYPE_LABELS, type WalletBackend } from "../../../services/wallets";

function WalletOption({ wallet, active }: { wallet: WalletBackend; active: boolean }) {
  const balance = use$(wallet.balance$);

  return (
    <MenuItem onClick={() => setActiveWallet(wallet.id)}>
      <Box w="6" flexShrink={0}>
        {active && <CheckIcon boxSize={4} />}
      </Box>
      <Flex direction="column" overflow="hidden">
        <Text fontWeight="bold" isTruncated>
          {wallet.name}
        </Text>
        <Text fontSize="sm" color="GrayText">
          {WALLET_TYPE_LABELS[wallet.type]} · {balance === undefined ? "—" : balance.toLocaleString()} sats
        </Text>
      </Flex>
    </MenuItem>
  );
}

/** The primary control for switching between wallet backends */
export default function WalletSwitcher({ ...props }: Omit<ButtonProps, "children">) {
  const wallets = useWallets();
  const active = useActiveWallet();

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={wallets.length === 0} maxW="2xs" {...props}>
        <Text as="span" isTruncated display="block">
          {active?.name ?? "No wallets"}
        </Text>
      </MenuButton>
      <MenuList zIndex="popover">
        {wallets.map((wallet) => (
          <WalletOption key={wallet.id} wallet={wallet} active={wallet.id === active?.id} />
        ))}
      </MenuList>
    </Menu>
  );
}
