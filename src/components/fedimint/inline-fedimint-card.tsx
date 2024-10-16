import { Button, ButtonGroup, Card, CardProps, Heading, Link } from "@chakra-ui/react";

import { CopyIconButton } from "../copy-icon-button";
import useCurrentAccount from "../../hooks/use-current-account";
import { ECashIcon, WalletIcon } from "../icons";

export default function InlineFedimintCard({ token, ...props }: Omit<CardProps, "children"> & { token: string }) {
  const account = useCurrentAccount();

  // const { value: amount } = useAsync(async () => {
  //   const { FedimintWallet } = await import("@fedimint/core-web");
  //   const wallet = new FedimintWallet();
  //   const opened = await wallet.open("noStrudel");
  //   if (opened) {
  //     return await wallet.mint.parseNotes(token);
  //   }
  // }, []);

  let UnitIcon = ECashIcon;
  let unitColor = "green.500";

  return (
    <Card p="2" flexDirection="row" borderColor="green.500" gap="2" {...props}>
      <UnitIcon boxSize={10} color={unitColor} mr="2" mb="1" />
      <Heading size="md" alignItems="center">
        ecash
      </Heading>
      <ButtonGroup ml="auto">
        <CopyIconButton value={token} title="Copy Token" aria-label="Copy Token" variant="ghost" />
        <Button
          as={Link}
          leftIcon={<WalletIcon boxSize={5} />}
          colorScheme="primary"
          title="Open Wallet"
          aria-label="Open Wallet"
          href={`fedi://` + token}
        >
          Redeem
        </Button>
      </ButtonGroup>
    </Card>
  );
}
