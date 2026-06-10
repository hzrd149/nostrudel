import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Flex,
  IconButton,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import SimpleView from "../../components/layout/presets/simple-view";
import { SettingsIcon } from "../../components/icons";
import RouterLink from "../../components/router-link";
import { useActiveWallet, useNutWalletState, useNutWalletUnlocked } from "../../hooks/use-wallets";
import { type WalletBackend } from "../../services/wallets";
import UnlockNutWalletModal from "../settings/wallet/unlock-nut-wallet-modal";
import CreateWalletModal from "./components/create-wallet-modal";
import WalletBalanceCard from "./components/wallet-balance-card";
import WalletHistory from "./components/wallet-history";
import WalletSwitcher from "./components/wallet-switcher";
import WalletHistoryTab from "./tabs/history";
import WalletSettingsTab from "./tabs/settings";
import WalletTokensTab from "./tabs/tokens";

/** Shown when the active account has no NIP-60 wallet yet */
function CreateWalletPrompt() {
  const createModal = useDisclosure();

  return (
    <>
      <Alert status="info" maxW="2xl" mx="auto" borderRadius="md">
        <AlertIcon />
        <Flex alignItems="center" gap="3" w="full" flexWrap="wrap">
          <AlertDescription flex={1}>
            You don't have a Cashu (NIP-60) wallet yet. Create one to hold ecash on your nostr relays.
          </AlertDescription>
          <Button size="sm" colorScheme="primary" onClick={createModal.onOpen}>
            Create Wallet
          </Button>
        </Flex>
      </Alert>
      {createModal.isOpen && <CreateWalletModal isOpen onClose={createModal.onClose} />}
    </>
  );
}

/** Default history tab shown for wallets without their own management tabs (WebLN, NWC) */
function BackendHistorySection({ wallet }: { wallet: WalletBackend }) {
  return (
    <Tabs w="full" colorScheme="primary">
      <TabList mb="1em">
        <Tab>History</Tab>
      </TabList>
      <TabPanels>
        <TabPanel p="0">
          <WalletHistory wallet={wallet} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

/** Unlock prompt + management tabs for the NIP-60 wallet */
function NutWalletSection() {
  const unlocked = useNutWalletUnlocked();
  const unlockModal = useDisclosure();

  return (
    <>
      {!unlocked && (
        <Alert status="warning" maxW="2xl" mx="auto" borderRadius="md">
          <AlertIcon />
          <Flex alignItems="center" gap="3" w="full" flexWrap="wrap">
            <AlertDescription flex={1}>
              Your Cashu wallet is locked. Unlock it to see your balance and tokens.
            </AlertDescription>
            <Button size="sm" colorScheme="primary" onClick={unlockModal.onOpen}>
              Unlock
            </Button>
          </Flex>
        </Alert>
      )}

      <Tabs w="full" isLazy colorScheme="primary">
        <TabList mb="1em">
          <Tab>History</Tab>
          <Tab>Tokens</Tab>
          <Tab>Settings</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p="0">
            <WalletHistoryTab />
          </TabPanel>
          <TabPanel p="0">
            <WalletTokensTab />
          </TabPanel>
          <TabPanel p="0">
            <WalletSettingsTab />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {unlockModal.isOpen && <UnlockNutWalletModal isOpen onClose={unlockModal.onClose} />}
    </>
  );
}

export default function WalletHomeView() {
  const active = useActiveWallet();
  const nutState = useNutWalletState();

  return (
    <SimpleView
      title="Wallet"
      actions={
        <Flex gap="2" alignItems="center" ms="auto">
          <WalletSwitcher size="sm" />
          <IconButton
            as={RouterLink}
            to="/settings/wallet"
            icon={<SettingsIcon boxSize={5} />}
            aria-label="Wallet settings"
            title="Wallet settings"
            size="sm"
            variant="ghost"
          />
        </Flex>
      }
    >
      {active?.type === "nutwallet" && (
        <Alert status="error" mb="4">
          <AlertIcon />
          <AlertDescription>
            The Cashu (NIP-60) wallet is experimental and unstable! It will probably lose your money. Do not put any
            funds into it that you are not willing to lose.
          </AlertDescription>
        </Alert>
      )}

      {active ? (
        <WalletBalanceCard wallet={active} w="full" maxW="2xl" mx="auto" />
      ) : nutState.status === "loading" ? (
        <Flex gap="2" alignItems="center" justifyContent="center" color="GrayText" py="10">
          <Spinner size="sm" /> Looking for your wallets…
        </Flex>
      ) : (
        <Flex direction="column" gap="2" alignItems="center" py="10">
          <Text color="GrayText">No wallets connected yet.</Text>
          <Button as={RouterLink} to="/settings/wallet" colorScheme="primary">
            Connect a wallet
          </Button>
        </Flex>
      )}

      {nutState.status === "missing" && <CreateWalletPrompt />}
      {active && (active.type === "nutwallet" ? <NutWalletSection /> : <BackendHistorySection wallet={active} />)}
    </SimpleView>
  );
}
