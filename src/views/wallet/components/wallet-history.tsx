import { Badge, Button, Flex, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { memo, useEffect } from "react";

import ArrowBlockDown from "../../../components/icons/arrow-block-down";
import ArrowBlockUp from "../../../components/icons/arrow-block-up";
import Timestamp from "../../../components/timestamp";
import useRenderLimit from "../../../hooks/use-render-limit";
import { type WalletBackend, type WalletTransaction } from "../../../services/wallets";

const TransactionEntry = memo(function TransactionEntry({ tx }: { tx: WalletTransaction }) {
  return (
    <Flex gap="3" alignItems="center" py="2">
      {tx.direction === "in" ? (
        <ArrowBlockDown boxSize={6} color="green.500" flexShrink={0} />
      ) : (
        <ArrowBlockUp boxSize={6} color="orange.500" flexShrink={0} />
      )}
      <Flex direction="column" minW="0">
        <Flex gap="2" alignItems="baseline">
          <Text fontWeight="bold" lineHeight="short">
            {tx.amount.toLocaleString()}
          </Text>
          {tx.fee !== undefined && tx.fee > 0 && <Text color="GrayText">fee {tx.fee}</Text>}
          {tx.pending && <Badge colorScheme="yellow">Pending</Badge>}
        </Flex>
        {tx.description && (
          <Text color="GrayText" isTruncated>
            {tx.description}
          </Text>
        )}
      </Flex>
      <Timestamp timestamp={tx.timestamp} color="GrayText" ms="auto" flexShrink={0} />
    </Flex>
  );
});

/** A generic transaction history list for any wallet backend that supports it */
export default function WalletHistory({ wallet }: { wallet: WalletBackend }) {
  const history = use$(wallet.history$);
  const { visible, hasMore, more } = useRenderLimit(history);

  // Refresh the wallet when first shown so the history is up to date
  useEffect(() => {
    wallet.refresh().catch(() => {});
  }, [wallet]);

  if (!wallet.history$) return <Text color="GrayText">This wallet does not provide a transaction history.</Text>;

  if (history === undefined) return <Text color="GrayText">Loading history…</Text>;
  if (history.length === 0) return <Text color="GrayText">No transactions yet.</Text>;

  return (
    <Flex direction="column" w="full" maxW="2xl" mx="auto">
      {visible?.map((tx) => (
        <TransactionEntry key={tx.id} tx={tx} />
      ))}
      {hasMore && (
        <Button variant="ghost" onClick={more}>
          Show more
        </Button>
      )}
    </Flex>
  );
}
