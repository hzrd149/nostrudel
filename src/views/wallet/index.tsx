import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
} from "@chakra-ui/react";
import { useActionRunner, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { CreateWallet } from "applesauce-wallet/actions";
import {
  WALLET_HISTORY_KIND,
  WALLET_TOKEN_KIND,
  isWalletUnlocked,
  NUTZAP_KIND,
  NUTZAP_INFO_KIND,
} from "applesauce-wallet/helpers";
import { WalletBalanceModel } from "applesauce-wallet/models";
import { kinds } from "nostr-tools";
import { generateSecretKey } from "nostr-tools";
import { useState } from "react";

import SimpleView from "../../components/layout/presets/simple-view";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import useUserWallet from "../../hooks/use-user-wallet";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import WalletBalanceCard from "./components/balance-card";
import WalletUnlockButton from "./components/wallet-unlock-button";
import WalletHistoryTab from "./tabs/history";
import WalletMintsTab from "./tabs/mints";
import WalletTokensTab from "./tabs/tokens";
import WalletNutzapsTab from "./tabs/nutzaps";
import WalletSettingsTab from "./tabs/settings";
import useAsyncAction from "../../hooks/use-async-action";

const DEFAULT_WALLET_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://relay.nostr.band",
  "wss://relay.primal.net",
];

function CreateWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const actions = useActionRunner();
  const [mintInput, setMintInput] = useState("https://mint.minibits.cash/Bitcoin");
  const [mints, setMints] = useState<string[]>([]);
  const [receiveNutzaps, setReceiveNutzaps] = useState(false);

  const addMint = () => {
    const url = mintInput.trim();
    if (!url || mints.includes(url)) return;
    setMints((prev) => [...prev, url]);
    setMintInput("");
  };

  const removeMint = (url: string) => setMints((prev) => prev.filter((m) => m !== url));

  const { run: create, loading: creating } = useAsyncAction(async () => {
    const allMints = mints.length > 0 ? mints : [mintInput.trim()].filter(Boolean);
    if (allMints.length === 0) return;

    await actions.run(CreateWallet, {
      mints: allMints,
      privateKey: receiveNutzaps ? generateSecretKey() : undefined,
      relays: DEFAULT_WALLET_RELAYS,
    });
    onClose();
  }, [actions, mints, mintInput, receiveNutzaps, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Cashu Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          <Alert status="warning" size="sm">
            <AlertIcon />
            <AlertDescription>Only add mints you trust. Do not put large amounts in any mint.</AlertDescription>
          </Alert>

          <FormControl>
            <FormLabel>Mint URL</FormLabel>
            <Flex gap="2">
              <Input
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
                placeholder="https://mint.example.com"
                onKeyDown={(e) => e.key === "Enter" && addMint()}
              />
              <Button onClick={addMint} flexShrink={0}>
                Add
              </Button>
            </Flex>
            <FormHelperText>Enter at least one Cashu mint URL</FormHelperText>
          </FormControl>

          {mints.length > 0 && (
            <Flex direction="column" gap="1">
              {mints.map((m) => (
                <Flex key={m} alignItems="center" gap="2" p="2" borderWidth="1px" borderRadius="md">
                  <Flex flex={1} fontSize="sm" fontFamily="mono" overflow="hidden" textOverflow="ellipsis">
                    {m}
                  </Flex>
                  <Button size="xs" colorScheme="red" variant="ghost" onClick={() => removeMint(m)}>
                    Remove
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}

          <FormControl display="flex" alignItems="center" gap="2">
            <Input
              type="checkbox"
              w="auto"
              checked={receiveNutzaps}
              onChange={(e) => setReceiveNutzaps(e.target.checked)}
            />
            <FormLabel mb="0">Enable receiving nutzaps (NIP-61)</FormLabel>
          </FormControl>
          {receiveNutzaps && (
            <FormHelperText mt="-2">A private key will be generated for P2PK-locked nutzap reception.</FormHelperText>
          )}
        </ModalBody>
        <ModalFooter gap="2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="primary"
            onClick={create}
            isLoading={creating}
            isDisabled={mints.length === 0 && !mintInput.trim()}
          >
            Create Wallet
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function WalletHomeView() {
  const account = useActiveAccount()!;
  const wallet = useUserWallet(account.pubkey);
  const createModal = useDisclosure();

  const mailboxes = useUserMailboxes(account.pubkey);
  const outboxRelays = useReadRelays(mailboxes?.outboxes);
  const inboxRelays = useReadRelays(mailboxes?.inboxes);

  // Load wallet token/history events from outbox relays
  const { timeline: walletEvents, loader: walletLoader } = useTimelineLoader(
    `${account.pubkey}-wallet-tokens`,
    outboxRelays,
    [
      {
        kinds: [WALLET_TOKEN_KIND, WALLET_HISTORY_KIND],
        authors: [account.pubkey],
      },
      { kinds: [kinds.EventDeletion], "#k": [String(WALLET_TOKEN_KIND)], authors: [account.pubkey] },
    ],
  );

  // Load incoming nutzaps from inbox relays
  const { loader: nutzapLoader } = useTimelineLoader(`${account.pubkey}-incoming-nutzaps`, inboxRelays, {
    kinds: [NUTZAP_KIND],
    "#p": [account.pubkey],
  });

  const balance = useEventModel(WalletBalanceModel, [account.pubkey]);

  const walletCallback = useTimelineCurserIntersectionCallback(walletLoader);

  return (
    <IntersectionObserverProvider callback={walletCallback}>
      <SimpleView
        title="Wallet"
        actions={
          wallet &&
          !isWalletUnlocked(wallet) && <WalletUnlockButton wallet={wallet} colorScheme="primary" ms="auto" size="sm" />
        }
      >
        <Alert status="error" mb="4">
          <AlertIcon />
          <AlertTitle>Work in progress!</AlertTitle>
          <AlertDescription>Do not put large amounts into this wallet while it is being developed.</AlertDescription>
        </Alert>

        {wallet ? (
          <WalletBalanceCard pubkey={account.pubkey} w="full" maxW="2xl" mx="auto" />
        ) : (
          <Button onClick={createModal.onOpen} mx="auto" w="lg" size="lg" colorScheme="primary" my="10">
            Create Wallet
          </Button>
        )}
        {wallet && !isWalletUnlocked(wallet) && (
          <WalletUnlockButton wallet={wallet} colorScheme="primary" mx="auto" size="lg" w="sm" />
        )}

        {wallet && (
          <Tabs isFitted maxW="2xl" mx="auto" w="full" isLazy>
            <TabList mb="1em">
              <Tab>History ({walletEvents.filter((e) => e.kind === WALLET_HISTORY_KIND).length})</Tab>
              <Tab>Tokens ({walletEvents.filter((e) => e.kind === WALLET_TOKEN_KIND).length})</Tab>
              <Tab>Mints ({balance ? Object.keys(balance).length : 0})</Tab>
              <Tab>Nutzaps</Tab>
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
                <WalletMintsTab />
              </TabPanel>
              <TabPanel p="0">
                <WalletNutzapsTab />
              </TabPanel>
              <TabPanel p="0">
                <WalletSettingsTab />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}

        <CreateWalletModal isOpen={createModal.isOpen} onClose={createModal.onClose} />
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
