import { Flex, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { WalletHistory } from "applesauce-wallet/casts";

import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { ErrorBoundary } from "../../../components/error-boundary";
import ArrowBlockDown from "../../../components/icons/arrow-block-down";
import ArrowBlockUp from "../../../components/icons/arrow-block-up";
import Timestamp from "../../../components/timestamp";
import { useNutWallet } from "../../../hooks/use-wallets";

/** A single NIP-60 history entry (direction, amount, mint) */
function HistoryEntry({ entry }: { entry: WalletHistory }) {
  // meta$ emits once the entry content is decrypted, re-rendering the row
  const meta = use$(entry.meta$);
  if (!meta) return null;

  return (
    <Flex gap="3" alignItems="center" py="2">
      {meta.direction === "in" ? (
        <ArrowBlockDown boxSize={6} color="green.500" />
      ) : (
        <ArrowBlockUp boxSize={6} color="orange.500" />
      )}
      <Flex direction="column" minW="0" gap="1">
        <Flex gap="2" alignItems="baseline">
          <Text fontWeight="bold" lineHeight="short">
            {meta.amount}
          </Text>
          {meta.fee !== undefined && <Text color="GrayText">fee {meta.fee}</Text>}
        </Flex>
        {meta.mint && (
          <Flex gap="2" alignItems="center">
            <CashuMintFavicon mint={meta.mint} size="xs" />
            <CashuMintName mint={meta.mint} color="GrayText" isTruncated />
          </Flex>
        )}
      </Flex>
      <Flex gap="2" alignItems="center" ms="auto">
        <Timestamp timestamp={entry.event.created_at} color="GrayText" />
        <DebugEventButton event={entry.event} size="sm" variant="ghost" />
      </Flex>
    </Flex>
  );
}

export default function WalletHistoryTab() {
  const wallet = useNutWallet();
  const history = use$(wallet?.history$);

  // Locked entries are hidden, only show ones that can be decrypted
  const unlocked = history?.filter((entry) => entry.unlocked);

  return (
    <Flex direction="column" w="full" maxW="2xl" mx="auto">
      {history === undefined ? (
        <Text color="GrayText">Loading history…</Text>
      ) : !unlocked || unlocked.length === 0 ? (
        <Text color="GrayText">No history yet.</Text>
      ) : (
        unlocked.map((entry) => (
          <ErrorBoundary key={entry.id} event={entry.event}>
            <HistoryEntry entry={entry} />
          </ErrorBoundary>
        ))
      )}
    </Flex>
  );
}
