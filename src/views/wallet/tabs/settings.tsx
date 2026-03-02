import {
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  Input,
  Text
} from "@chakra-ui/react";
import { useActionRunner, useActiveAccount } from "applesauce-react/hooks";
import {
  AddNutzapInfoMint,
  ConsolidateTokens,
  RecoverFromCouch,
  RemoveNutzapInfoMint,
  SetWalletMints,
  SetWalletRelays,
} from "applesauce-wallet/actions";
import {
  getNutzapInfoMints,
  getWalletMints,
  getWalletRelays,
  isWalletUnlocked,
  NUTZAP_INFO_KIND,
  WALLET_KIND,
} from "applesauce-wallet/helpers";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";

import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import useAsyncAction from "../../../hooks/use-async-action";
import useEventUpdate from "../../../hooks/use-event-update";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import couch from "../../../services/cashu-couch";

function MintManagement({ wallet }: { wallet: NostrEvent }) {
  const actions = useActionRunner();
  const [newMint, setNewMint] = useState("");
  const mints = isWalletUnlocked(wallet) ? getWalletMints(wallet) : [];

  const { run: addMint, loading: adding } = useAsyncAction(async () => {
    if (!newMint.trim()) return;
    await actions.run(SetWalletMints, [...mints, newMint.trim()]);
    setNewMint("");
  }, [actions, mints, newMint]);

  const { run: removeMint } = useAsyncAction(
    async (mint: string) => {
      await actions.run(
        SetWalletMints,
        mints.filter((m) => m !== mint),
      );
    },
    [actions, mints],
  );

  if (!isWalletUnlocked(wallet)) {
    return <Text color="gray.500">Unlock wallet to manage mints</Text>;
  }

  return (
    <Flex direction="column" gap="2">
      <Heading size="sm">Wallet Mints</Heading>
      {mints.map((mint) => (
        <Flex key={mint} alignItems="center" gap="2" p="2" borderWidth="1px" borderRadius="md">
          <CashuMintFavicon mint={mint} size="xs" />
          <CashuMintName mint={mint} flex={1} fontSize="sm" />
          <Text fontSize="xs" fontFamily="mono" color="gray.500" noOfLines={1} maxW="40">
            {mint}
          </Text>
          <Button size="xs" colorScheme="red" variant="ghost" onClick={() => removeMint(mint)}>
            Remove
          </Button>
        </Flex>
      ))}
      <Flex gap="2">
        <Input
          value={newMint}
          onChange={(e) => setNewMint(e.target.value)}
          placeholder="https://mint.example.com"
          size="sm"
          onKeyDown={(e) => e.key === "Enter" && addMint()}
        />
        <Button size="sm" onClick={addMint} isLoading={adding} isDisabled={!newMint.trim()} flexShrink={0}>
          Add Mint
        </Button>
      </Flex>
    </Flex>
  );
}

function RelayManagement({ wallet }: { wallet: NostrEvent }) {
  const actions = useActionRunner();
  const [newRelay, setNewRelay] = useState("");
  const relays = (isWalletUnlocked(wallet) ? getWalletRelays(wallet) : undefined) ?? [];

  const { run: addRelay, loading: adding } = useAsyncAction(async () => {
    if (!newRelay.trim()) return;
    await actions.run(SetWalletRelays, [...relays, newRelay.trim()]);
    setNewRelay("");
  }, [actions, relays, newRelay]);

  const { run: removeRelay } = useAsyncAction(
    async (relay: string) => {
      await actions.run(
        SetWalletRelays,
        relays.filter((r) => r !== relay),
      );
    },
    [actions, relays],
  );

  if (!isWalletUnlocked(wallet)) {
    return <Text color="gray.500">Unlock wallet to manage relays</Text>;
  }

  return (
    <Flex direction="column" gap="2">
      <Heading size="sm">Wallet Relays</Heading>
      {relays.map((relay) => (
        <Flex key={relay} alignItems="center" gap="2" p="2" borderWidth="1px" borderRadius="md">
          <Text flex={1} fontSize="sm" fontFamily="mono">
            {relay}
          </Text>
          <Button size="xs" colorScheme="red" variant="ghost" onClick={() => removeRelay(relay)}>
            Remove
          </Button>
        </Flex>
      ))}
      <Flex gap="2">
        <Input
          value={newRelay}
          onChange={(e) => setNewRelay(e.target.value)}
          placeholder="wss://relay.example.com"
          size="sm"
          onKeyDown={(e) => e.key === "Enter" && addRelay()}
        />
        <Button size="sm" onClick={addRelay} isLoading={adding} isDisabled={!newRelay.trim()} flexShrink={0}>
          Add Relay
        </Button>
      </Flex>
    </Flex>
  );
}

function NutzapInfoMintManagement() {
  const account = useActiveAccount()!;
  const actions = useActionRunner();
  const [newMint, setNewMint] = useState("");

  const nutzapInfo = useReplaceableEvent({ kind: NUTZAP_INFO_KIND as number, pubkey: account.pubkey });
  useEventUpdate(nutzapInfo?.id);
  const mints = nutzapInfo ? getNutzapInfoMints(nutzapInfo) : [];

  const { run: addMint, loading: adding } = useAsyncAction(async () => {
    if (!newMint.trim()) return;
    await actions.run(AddNutzapInfoMint, { url: newMint.trim(), units: ["sat"] });
    setNewMint("");
  }, [actions, newMint]);

  const { run: removeMint } = useAsyncAction(
    async (mintUrl: string) => {
      await actions.run(RemoveNutzapInfoMint, mintUrl);
    },
    [actions],
  );

  return (
    <Flex direction="column" gap="2">
      <Heading size="sm">Nutzap Receive Mints</Heading>
      <Text fontSize="sm" color="gray.500">
        These mints will be published so others know where to send nutzaps.
      </Text>
      {mints.map(({ mint }) => (
        <Flex key={mint} alignItems="center" gap="2" p="2" borderWidth="1px" borderRadius="md">
          <CashuMintFavicon mint={mint} size="xs" />
          <CashuMintName mint={mint} flex={1} fontSize="sm" />
          <Button size="xs" colorScheme="red" variant="ghost" onClick={() => removeMint(mint)}>
            Remove
          </Button>
        </Flex>
      ))}
      <Flex gap="2">
        <Input
          value={newMint}
          onChange={(e) => setNewMint(e.target.value)}
          placeholder="https://mint.example.com"
          size="sm"
          onKeyDown={(e) => e.key === "Enter" && addMint()}
        />
        <Button size="sm" onClick={addMint} isLoading={adding} isDisabled={!newMint.trim()} flexShrink={0}>
          Add
        </Button>
      </Flex>
    </Flex>
  );
}

function TokenTools() {
  const actions = useActionRunner();

  const { run: consolidate, loading: consolidating } = useAsyncAction(async () => {
    await actions.run(ConsolidateTokens, { unlockTokens: true });
  }, [actions]);

  const { run: recover, loading: recovering } = useAsyncAction(async () => {
    await actions.run(RecoverFromCouch, couch);
  }, [actions]);

  return (
    <Flex direction="column" gap="2">
      <Heading size="sm">Token Tools</Heading>
      <ButtonGroup>
        <Button onClick={consolidate} isLoading={consolidating} size="sm">
          Consolidate Tokens
        </Button>
        <Button onClick={recover} isLoading={recovering} size="sm" colorScheme="orange">
          Recover from Couch
        </Button>
      </ButtonGroup>
      <Text fontSize="xs" color="gray.500">
        "Recover from Couch" restores tokens that were staged during a failed send/receive operation.
      </Text>
    </Flex>
  );
}

export default function WalletSettingsTab() {
  const account = useActiveAccount()!;
  const wallet = useReplaceableEvent({ kind: WALLET_KIND, pubkey: account.pubkey });
  useEventUpdate(wallet?.id);

  return (
    <Flex direction="column" gap="6" w="full">
      <NutzapInfoMintManagement />
      <Divider />
      {wallet && <MintManagement wallet={wallet} />}
      <Divider />
      {wallet && <RelayManagement wallet={wallet} />}
      <Divider />
      <TokenTools />
    </Flex>
  );
}
