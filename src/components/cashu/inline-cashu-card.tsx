import { useAsync } from "react-use";
import { Box, ButtonGroup, Card, CardProps, Heading, IconButton, Link, Spinner, Text } from "@chakra-ui/react";
import { Token, getEncodedToken, CheckStateEnum } from "@cashu/cashu-ts";

import { CopyIconButton } from "../copy-icon-button";
import { ECashIcon, WalletIcon } from "../icons";
import CurrencyDollar from "../icons/currency-dollar";
import CurrencyEthereum from "../icons/currency-ethereum";
import CurrencyEuro from "../icons/currency-euro";
import CurrencyYen from "../icons/currency-yen";
import CurrencyPound from "../icons/currency-pound";
import CurrencyBitcoin from "../icons/currency-bitcoin";
import { getCashuWallet } from "../../services/cashu-mints";

export default function InlineCachuCard({
  token,
  encoded,
  ...props
}: Omit<CardProps, "children"> & { token: Token; encoded?: string }) {
  encoded = encoded || getEncodedToken(token);
  const { value: spendable, loading } = useAsync(async () => {
    if (!token) return;
    const wallet = await getCashuWallet(token.mint);
    const status = await wallet.checkProofsStates(token.proofs);
    return status.some((s) => s.state === CheckStateEnum.UNSPENT);
  }, [token]);

  const amount = token?.proofs.reduce((acc, v) => acc + v.amount, 0);

  let UnitIcon = ECashIcon;
  let unitColor = "green.500";
  let denomination = `${amount} tokens`;

  switch (token.unit) {
    case "usd":
      UnitIcon = CurrencyDollar;
      denomination = `$${(amount / 100).toFixed(2)}`;
      break;

    case "eur":
      UnitIcon = CurrencyEuro;
      unitColor = "blue.500";
      denomination = `€${(amount / 100).toFixed(2)}`;
      break;

    case "gpb":
      UnitIcon = CurrencyPound;
      denomination = `£${(amount / 100).toFixed(2)}`;
      break;

    case "yen":
      UnitIcon = CurrencyYen;
      denomination = `¥${(amount / 100).toFixed(2)}`;
      break;

    case "eth":
      UnitIcon = CurrencyEthereum;
      break;

    case "sat":
      unitColor = "orange.300";
      UnitIcon = CurrencyBitcoin;
      denomination = `${amount} sats`;
      break;
  }

  return (
    <Card p="2" flexDirection="column" borderColor="green.500" gap="2" maxW="md" variant="outline" {...props}>
      <Box>
        <UnitIcon boxSize={10} color={unitColor} float="left" mr="2" mb="1" />
        <ButtonGroup float="right" size="sm">
          <CopyIconButton value={encoded} title="Copy Token" aria-label="Copy Token" variant="ghost" />
          <IconButton
            as={Link}
            icon={<WalletIcon boxSize={5} />}
            title="Open Wallet"
            aria-label="Open Wallet"
            href={`cashu://` + encoded}
          />
        </ButtonGroup>
        <Heading size="md" textDecoration={spendable === false ? "line-through" : undefined}>
          {denomination} {spendable === false ? " (Spent)" : loading ? <Spinner size="xs" /> : undefined}
        </Heading>
        {token && <Text fontSize="xs">Mint: {new URL(token.mint).hostname}</Text>}
        {token.unit && <Text fontSize="xs">Unit: {token.unit}</Text>}
      </Box>
      {token.memo && <Box>{token.memo}</Box>}
    </Card>
  );
}
