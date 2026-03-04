import { useState } from "react";
import { Card, CardBody, Flex, Image, Text, useToast } from "@chakra-ui/react";
import { AppInfo } from "nostr-signer-capacitor-plugin";
import { useAccountManager } from "applesauce-react/hooks";
import { useAsync } from "react-use";

import AndroidSignerAccount from "../../classes/accounts/android-signer-account";
import AndroidNativeSigner from "../../classes/signers/android-native-signer";

function AndroidNativeSignerButton({ app }: { app: AppInfo }) {
  const toast = useToast();
  const manager = useAccountManager();
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      const account = await AndroidSignerAccount.fromApp(app);
      manager.addAccount(account);
      manager.setActive(account);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setConnecting(false);
  };

  return (
    <Card
      as="button"
      variant="outline"
      onClick={connect}
      cursor="pointer"
      textAlign="left"
      w="full"
      opacity={connecting ? 0.7 : 1}
      _hover={{ shadow: "md" }}
      transition="all 0.15s"
    >
      <CardBody p="4">
        <Flex align="center" gap="2" mb="1">
          {app.iconUrl && <Image w={6} h={6} src={app.iconUrl} borderRadius="sm" flexShrink={0} />}
          <Text fontWeight="bold" fontSize="md">
            {connecting ? "Connecting..." : app.name}
          </Text>
        </Flex>
        <Text fontSize="sm" opacity={0.7}>
          Sign in using the {app.name} app on your device.
        </Text>
      </CardBody>
    </Card>
  );
}

export default function AndroidNativeSigners() {
  const { value: apps } = useAsync(() => AndroidNativeSigner.getSignerApps());

  if (!apps) return null;

  return (
    <>
      {apps.map((app) => (
        <AndroidNativeSignerButton key={app.packageName} app={app} />
      ))}
    </>
  );
}
