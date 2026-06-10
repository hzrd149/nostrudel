import {
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Select,
  SimpleGrid,
  Switch,
  Text,
} from "@chakra-ui/react";
import { DeleteFactory } from "applesauce-core/factories";
import { unixNow } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { ReactNode, useMemo, useState } from "react";

import AddMintForm from "../../../components/cashu/add-mint-form";
import MintControl from "../../../components/cashu/mint-control";
import useAsyncAction from "../../../hooks/use-async-action";
import { useNutWallet, useNutWalletUnlocked } from "../../../hooks/use-wallets";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import localSettings from "../../../services/preferences";
import { setNutWalletAutoUnlock } from "../../../services/wallets";
import AddRelayForm from "../../settings/relays/components/add-relay-form";
import RelayControl from "../../settings/relays/components/relay-control";

/** Wrapper so each settings section reads as a panel in the grid */
function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Flex direction="column" gap="2">
      <Heading size="sm">{title}</Heading>
      {children}
    </Flex>
  );
}

/** Edits the mints configured on the NIP-60 wallet via NutWallet.setMints */
function MintManagement() {
  const wallet = useNutWallet();
  const mints = use$(wallet?.mintUrls$);

  const addMint = useAsyncAction(
    async (url: string) => {
      if (!wallet || !url) return;
      if (mints?.some((m) => new URL(m).toString() === url)) throw new Error("This mint is already in your wallet");
      await wallet.setMints([...(mints ?? []), url]);
    },
    [wallet, mints],
  );

  const removeMint = useAsyncAction(
    async (mint: string) => {
      if (!wallet || !mints) return;
      await wallet.setMints(mints.filter((m) => m !== mint));
    },
    [wallet, mints],
  );

  if (mints === undefined)
    return (
      <SettingsSection title="Mints">
        <Text color="GrayText">Unlock the wallet to manage mints</Text>
      </SettingsSection>
    );

  return (
    <SettingsSection title="Mints">
      {mints.map((mint) => (
        <MintControl key={mint} url={mint} onRemove={() => removeMint.run(mint)} />
      ))}
      <AddMintForm onSubmit={addMint.run} />
    </SettingsSection>
  );
}

/** Edits the relays configured on the NIP-60 wallet via NutWallet.setRelays */
function RelayManagement() {
  const wallet = useNutWallet();
  const relays = use$(wallet?.walletRelays$);

  const addRelay = useAsyncAction(
    async (url: string) => {
      if (!wallet || !url) return;
      if (relays?.includes(url)) throw new Error("This relay is already in your wallet");
      await wallet.setRelays([...(relays ?? []), url]);
    },
    [wallet, relays],
  );

  const removeRelay = useAsyncAction(
    async (relay: string) => {
      if (!wallet || !relays) return;
      await wallet.setRelays(relays.filter((r) => r !== relay));
    },
    [wallet, relays],
  );

  if (relays === undefined)
    return (
      <SettingsSection title="Relays">
        <Text color="GrayText">Unlock the wallet to manage relays</Text>
      </SettingsSection>
    );

  return (
    <SettingsSection title="Relays">
      <Text fontSize="sm" color="GrayText">
        The relays your wallet, token and history events are stored on.
      </Text>
      {relays.map((relay) => (
        <RelayControl key={relay} url={relay} onRemove={() => removeRelay.run(relay)} />
      ))}
      <AddRelayForm onSubmit={addRelay.run} />
    </SettingsSection>
  );
}

/** Token maintenance operations exposed by the NutWallet class */
function TokenTools() {
  const wallet = useNutWallet();
  const ops = use$(wallet?.operationsState$) ?? {};

  const consolidate = useAsyncAction(async () => {
    await wallet?.consolidateTokens();
  }, [wallet]);

  const sync = useAsyncAction(async () => {
    await wallet?.syncTokens();
  }, [wallet]);

  const recover = useAsyncAction(async () => {
    await wallet?.recoverFromCouch();
  }, [wallet]);

  return (
    <SettingsSection title="Token Tools">
      <ButtonGroup size="sm" flexWrap="wrap" spacing="0" gap="2">
        <Button onClick={consolidate.run} isLoading={ops.consolidate || consolidate.loading}>
          Consolidate Tokens
        </Button>
        <Button onClick={sync.run} isLoading={ops.sync || sync.loading}>
          Sync Tokens
        </Button>
        <Button onClick={recover.run} isLoading={ops.recover || recover.loading} colorScheme="orange">
          Recover from Couch
        </Button>
      </ButtonGroup>
      <Text fontSize="xs" color="GrayText">
        "Consolidate" combines all token events into a single event per mint. "Sync" re-publishes every token event to
        the wallet's relays. "Recover from Couch" restores tokens that were staged during a failed send/receive
        operation.
      </Text>
    </SettingsSection>
  );
}

/** Toggles whether the wallet decrypts automatically when it loads */
function AutoUnlockSetting() {
  const autoUnlock = use$(localSettings.autoUnlockNutWallet) ?? false;
  const unlocked = useNutWalletUnlocked();

  return (
    <SettingsSection title="General">
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoUnlockNutWallet" mb="0">
            Automatically unlock wallet
          </FormLabel>
          <Switch
            id="autoUnlockNutWallet"
            isChecked={autoUnlock}
            onChange={(e) => setNutWalletAutoUnlock(e.target.checked)}
          />
        </Flex>
        <FormHelperText>
          Decrypt the wallet automatically each time it loads.{" "}
          {!unlocked && "Enabling this will unlock the wallet now (your signer may prompt you)."}
        </FormHelperText>
      </FormControl>
    </SettingsSection>
  );
}

const DAY_IN_SECONDS = 60 * 60 * 24;

/** Deletes wallet history events older than a selected age */
function ClearHistorySetting() {
  const wallet = useNutWallet();
  const publish = usePublishEvent();
  const history = use$(wallet?.history$);

  // Age cutoff in days, "0" means delete everything
  const [age, setAge] = useState("30");

  const matching = useMemo(() => {
    if (!history) return [];
    const days = parseInt(age, 10);
    const cutoff = unixNow() - days * DAY_IN_SECONDS;
    return history.filter((entry) => entry.event.created_at < cutoff);
  }, [history, age]);

  const clear = useAsyncAction(async () => {
    if (!matching.length) return;
    const label = age === "0" ? "all" : "older";
    if (confirm(`Delete ${matching.length} ${label} history event${matching.length === 1 ? "" : "s"}?`) !== true)
      return;
    const draft = await DeleteFactory.fromEvents(matching.map((entry) => entry.event));
    await publish("Clear history", draft);
  }, [publish, matching, age]);

  return (
    <SettingsSection title="Advanced">
      <FormControl>
        <FormLabel mb="1">Clear history</FormLabel>
        <Flex gap="2">
          <Select size="sm" value={age} onChange={(e) => setAge(e.target.value)} flex={1}>
            <option value="7">Older than a week</option>
            <option value="30">Older than a month</option>
            <option value="90">Older than 3 months</option>
            <option value="365">Older than a year</option>
            <option value="0">Everything</option>
          </Select>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={clear.run}
            isLoading={clear.loading}
            isDisabled={matching.length === 0}
            flexShrink={0}
          >
            Clear {history !== undefined && `(${matching.length})`}
          </Button>
        </Flex>
        <FormHelperText>
          Publishes a delete request for old wallet history events. Keeping the last month is recommended.
        </FormHelperText>
      </FormControl>
    </SettingsSection>
  );
}

export default function WalletSettingsTab() {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6" w="full">
      <MintManagement />
      <RelayManagement />
      <TokenTools />
      <AutoUnlockSetting />
      <ClearHistorySetting />
    </SimpleGrid>
  );
}
