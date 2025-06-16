import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
} from "@chakra-ui/react";
import { useActionHub, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { CreateWallet } from "applesauce-wallet/actions";
import { WALLET_HISTORY_KIND, WALLET_TOKEN_KIND } from "applesauce-wallet/helpers";
import { WalletBalanceModel } from "applesauce-wallet/models";
import { kinds } from "nostr-tools";
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

export default function WalletHomeView() {
  const toast = useToast();
  const account = useActiveAccount()!;
  const wallet = useUserWallet(account.pubkey);
  const actions = useActionHub();

  const mailboxes = useUserMailboxes(account.pubkey);
  const readRelays = useReadRelays(mailboxes?.outboxes);
  const { timeline: events, loader } = useTimelineLoader(`${account.pubkey}-wallet-tokens`, readRelays, [
    {
      kinds: [WALLET_TOKEN_KIND, WALLET_HISTORY_KIND],
      authors: [account.pubkey],
    },
    { kinds: [kinds.EventDeletion], "#k": [String(WALLET_TOKEN_KIND)], authors: [account.pubkey] },
  ]);
  const balance = useEventModel(WalletBalanceModel, [account.pubkey]);

  const [creating, setCreating] = useState(false);
  const create = async () => {
    try {
      setCreating(true);
      await actions.run(CreateWallet, []);
      toast({ status: "success", description: "Created new wallet" });
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setCreating(false);
  };

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title="Wallet"
        actions={wallet?.locked && <WalletUnlockButton colorScheme="primary" ms="auto" size="sm" />}
      >
        <Alert status="error" mb="4">
          <AlertIcon />
          <AlertTitle>Work in progress!</AlertTitle>
          <AlertDescription>Do not put money into this wallet. it has bugs that will loose your money</AlertDescription>
        </Alert>

        {wallet ? (
          <WalletBalanceCard pubkey={account.pubkey} w="full" maxW="2xl" mx="auto" />
        ) : (
          <Button onClick={create} mx="auto" w="lg" size="lg" colorScheme="primary" my="10" isLoading={creating}>
            Create Wallet
          </Button>
        )}
        {wallet?.locked && <WalletUnlockButton colorScheme="primary" mx="auto" size="lg" w="sm" />}

        {wallet && (
          <Tabs isFitted maxW="2xl" mx="auto" w="full" isLazy>
            <TabList mb="1em">
              <Tab>History ({events.filter((e) => e.kind === WALLET_HISTORY_KIND).length})</Tab>
              <Tab>Tokens ({events.filter((e) => e.kind === WALLET_TOKEN_KIND).length})</Tab>
              <Tab>Mints ({balance ? Object.keys(balance).length : 0})</Tab>
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
            </TabPanels>
          </Tabs>
        )}
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
