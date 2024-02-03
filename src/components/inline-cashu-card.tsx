import { useAsync } from "react-use";
import { useEffect, useState } from "react";
import { Box, Button, ButtonGroup, Card, CardProps, Heading, IconButton, Link } from "@chakra-ui/react";
import { getDecodedToken, Token, CashuMint } from "@cashu/cashu-ts";

import { CopyIconButton } from "./copy-icon-button";
import { useUserMetadata } from "../hooks/use-user-metadata";
import useCurrentAccount from "../hooks/use-current-account";
import { ECashIcon, WalletIcon } from "./icons";
import { getMint } from "../services/cashu-mints";

function RedeemButton({ token }: { token: string }) {
  const account = useCurrentAccount()!;
  const metadata = useUserMetadata(account.pubkey);

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

export default function InlineCachuCard({ token, ...props }: Omit<CardProps, "children"> & { token: string }) {
  const account = useCurrentAccount();

  const [cashu, setCashu] = useState<Token>();
  const { value: spendable } = useAsync(async () => {
    if (!cashu) return;
    for (const token of cashu.token) {
      const mint = await getMint(token.mint);
      const spent = await mint.check({ proofs: token.proofs.map((p) => ({ secret: p.secret })) });
      if (spent.spendable.some((v) => v === false)) return false;
    }
    return true;
  }, [cashu]);

  useEffect(() => {
    if (!token.startsWith("cashuA") || token.length < 10) return;
    try {
      const cashu = getDecodedToken(token);
      setCashu(cashu);
    } catch (e) {}
  }, [token]);

  if (!cashu) return null;

  const amount = cashu?.token[0].proofs.reduce((acc, v) => acc + v.amount, 0);
  return (
    <Card p="4" flexDirection="row" borderColor="green.500" alignItems="center" gap="4" flexWrap="wrap" {...props}>
      <ECashIcon boxSize={10} color="green.500" />
      <Box>
        <Heading size="md" textDecoration={spendable === false ? "line-through" : undefined}>
          {amount} Cashu sats{spendable === false ? " (Spent)" : ""}
        </Heading>
        {cashu && <small>Mint: {new URL(cashu.token[0].mint).hostname}</small>}
      </Box>
      {cashu.memo && <Box>Memo: {cashu.memo}</Box>}
      <ButtonGroup ml="auto">
        <CopyIconButton text={token} title="Copy Token" aria-label="Copy Token" />
        <IconButton
          as={Link}
          icon={<WalletIcon />}
          title="Open Wallet"
          aria-label="Open Wallet"
          href={`cashu://` + token}
        />
        {account && <RedeemButton token={token} />}
      </ButtonGroup>
    </Card>
  );
}
