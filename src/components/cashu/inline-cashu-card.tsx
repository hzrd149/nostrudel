import { useAsync } from "react-use";
import { Box, Button, ButtonGroup, Card, CardProps, Heading, IconButton, Link, Spinner, Text } from "@chakra-ui/react";
import { Token, getEncodedToken } from "@cashu/cashu-ts";

import { CopyIconButton } from "../copy-icon-button";
import useUserProfile from "../../hooks/use-user-profile";
import useCurrentAccount from "../../hooks/use-current-account";
import { ECashIcon, WalletIcon } from "../icons";
import { getMint } from "../../services/cashu-mints";
import CurrencyDollar from "../icons/currency-dollar";
import CurrencyEthereum from "../icons/currency-ethereum";
import CurrencyEuro from "../icons/currency-euro";
import CurrencyYen from "../icons/currency-yen";
import CurrencyPound from "../icons/currency-pound";
import CurrencyBitcoin from "../icons/currency-bitcoin";

function RedeemButton({ token }: { token: string }) {
  const account = useCurrentAccount()!;
  const metadata = useUserProfile(account.pubkey);

  const lnurl = metadata?.lud16 ?? "";
  const url = `https://redeem.cashu.me?token=${encodeURIComponent(token)}&lightning=${encodeURIComponent(
    lnurl,
  )}&autopay=yes`;
  return (
    <Button as={Link} href={url} isExternal colorScheme="primary">
      Redeem
    </Button>
  );
}

export default function InlineCachuCard({
  token,
  encoded,
  ...props
}: Omit<CardProps, "children"> & { token: Token; encoded?: string }) {
  const account = useCurrentAccount();

  encoded = encoded || getEncodedToken(token);
  const { value: spendable, loading } = useAsync(async () => {
    if (!token) return;
    for (const entry of token.token) {
      const mint = await getMint(entry.mint);
      const spent = await mint.check({ Ys: entry.proofs.map((p) => p.secret) });
      if (spent.states.some((v) => v.state === "UNSPENT")) return true;
    }
    return false;
  }, [token]);

  const amount = token?.token[0].proofs.reduce((acc, v) => acc + v.amount, 0);

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
    <Card p="2" flexDirection="column" borderColor="green.500" gap="2" {...props}>
      <Box>
        <UnitIcon boxSize={10} color={unitColor} float="left" mr="2" mb="1" />
        <ButtonGroup float="right">
          <CopyIconButton value={encoded} title="Copy Token" aria-label="Copy Token" variant="ghost" />
          <IconButton
            as={Link}
            icon={<WalletIcon boxSize={5} />}
            title="Open Wallet"
            aria-label="Open Wallet"
            href={`cashu://` + encoded}
          />
          {account && <RedeemButton token={encoded} />}
        </ButtonGroup>
        <Heading size="md" textDecoration={spendable === false ? "line-through" : undefined}>
          {denomination} {spendable === false ? " (Spent)" : loading ? <Spinner size="xs" /> : undefined}
        </Heading>
        {token && <Text fontSize="xs">Mint: {new URL(token.token[0].mint).hostname}</Text>}
        {token.unit && <Text fontSize="xs">Unit: {token.unit}</Text>}
      </Box>
      {token.memo && <Box>{token.memo}</Box>}
      {loading && <Spinner />}
    </Card>
  );
}
