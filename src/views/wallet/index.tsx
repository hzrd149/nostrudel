import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { WalletBalanceQuery } from "applesauce-wallet/queries";
import { UnlockWallet } from "applesauce-wallet/actions";
import { WALLET_HISTORY_KIND, WALLET_TOKEN_KIND } from "applesauce-wallet/helpers";

import { useActiveAccount, useStoreQuery, useActionHub } from "applesauce-react/hooks";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import SimpleView from "../../components/layout/presets/simple-view";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import WalletBalanceCard from "./balance-card";
import WalletTokensTab from "./tabs/tokens";
import WalletHistoryTab from "./tabs/history";
import WalletMintsTab from "./tabs/mints";
import useUserWallet from "../../hooks/use-user-wallet";

export default function WalletHomeView() {
  const account = useActiveAccount()!;
  const wallet = useUserWallet(account.pubkey);

  const mailboxes = useUserMailboxes(account.pubkey);
  const readRelays = useReadRelays(mailboxes?.outboxes);
  const { timeline: events, loader } = useTimelineLoader(`${account.pubkey}-wallet-tokens`, readRelays, [
    {
      kinds: [WALLET_TOKEN_KIND, WALLET_HISTORY_KIND],
      authors: [account.pubkey],
    },
    { kinds: [kinds.EventDeletion], "#k": [String(WALLET_TOKEN_KIND)], authors: [account.pubkey] },
  ]);
  const balance = useStoreQuery(WalletBalanceQuery, [account.pubkey]);

  const actions = useActionHub();
  const unlock = useAsyncErrorHandler(async () => {
    if (!wallet) throw new Error("Missing wallet");
    if (wallet.locked === false) return;

    await actions.run(UnlockWallet, { history: true, tokens: true });
  }, [wallet, actions]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title="Wallet"
        actions={
          wallet?.locked && (
            <Button onClick={unlock} colorScheme="primary" ms="auto" size="sm">
              Unlock
            </Button>
          )
        }
      >
        <WalletBalanceCard pubkey={account.pubkey} w="full" maxW="2xl" mx="auto" />
        {wallet?.locked && (
          <Button onClick={unlock} colorScheme="primary" mx="auto" size="lg" w="sm">
            Unlock
          </Button>
        )}

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
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
