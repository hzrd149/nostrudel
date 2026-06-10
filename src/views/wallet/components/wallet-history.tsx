import { Badge, Card, CardHeader, Flex, Spacer, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useEffect } from "react";

import ArrowBlockDown from "../../../components/icons/arrow-block-down";
import ArrowBlockUp from "../../../components/icons/arrow-block-up";
import Timestamp from "../../../components/timestamp";
import { type WalletBackend, type WalletTransaction } from "../../../services/wallets";

function TransactionEntry({ tx }: { tx: WalletTransaction }) {
  return (
    <Card variant="outline">
      <CardHeader p="2" display="flex" flexDirection="row" gap="2" alignItems="center">
        {tx.direction === "in" ? (
          <ArrowBlockDown boxSize={8} color="green.500" flexShrink={0} />
        ) : (
          <ArrowBlockUp boxSize={8} color="orange.500" flexShrink={0} />
        )}
        <Flex direction="column" overflow="hidden">
          <Flex gap="2" alignItems="center">
            <Text fontSize="xl" fontWeight="bold">
              {tx.amount.toLocaleString()}
              <Text as="span" fontSize="sm" fontWeight="normal" color="GrayText" ms="1">
                sats
              </Text>
            </Text>
            {tx.fee !== undefined && tx.fee > 0 && <Text color="GrayText">( fee {tx.fee} )</Text>}
            {tx.pending && <Badge colorScheme="yellow">Pending</Badge>}
          </Flex>
          {tx.description && (
            <Text fontSize="sm" color="GrayText" isTruncated>
              {tx.description}
            </Text>
          )}
        </Flex>
        <Spacer />
        <Timestamp timestamp={tx.timestamp} color="GrayText" fontSize="sm" flexShrink={0} />
      </CardHeader>
    </Card>
  );
}

/** A generic transaction history list for any wallet backend that supports it */
export default function WalletHistory({ wallet }: { wallet: WalletBackend }) {
  const history = use$(wallet.history$);

  // Refresh the wallet when first shown so the history is up to date
  useEffect(() => {
    wallet.refresh().catch(() => {});
  }, [wallet]);

  if (!wallet.history$) return <Text color="GrayText">This wallet does not provide a transaction history.</Text>;

  if (history === undefined) return <Text color="GrayText">Loading history…</Text>;
  if (history.length === 0) return <Text color="GrayText">No transactions yet.</Text>;

  return (
    <Flex direction="column" gap="2" w="full">
      {history.map((tx) => (
        <TransactionEntry key={tx.id} tx={tx} />
      ))}
    </Flex>
  );
}
