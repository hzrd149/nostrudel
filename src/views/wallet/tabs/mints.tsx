import { Card, Flex, Link, Text } from "@chakra-ui/react";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { WalletBalanceModel } from "applesauce-wallet/models";
import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";

export default function WalletMintsTab() {
  const account = useActiveAccount()!;
  const balance = useEventModel(WalletBalanceModel, [account.pubkey]);

  return (
    <Flex direction="column" gap="2">
      {balance &&
        Object.entries(balance).map(([mint, total]) => (
          <Card key={mint} gap="2" p="2" display="flex" direction="row">
            <CashuMintFavicon mint={mint} size="sm" />
            <Flex direction="column" w="full">
              <Flex w="full" justifyContent="space-between">
                <CashuMintName mint={mint} fontWeight="bold" />
                <Link href={mint} isExternal fontStyle="italic">
                  {mint}
                </Link>
              </Flex>
              <Text>Amount: {total}</Text>
            </Flex>
          </Card>
        ))}
    </Flex>
  );
}
