import { Card, CardBody, Flex, Image, Text } from "@chakra-ui/react";
import { AndroidNativeAccount } from "applesauce-accounts/accounts/android-native-account";
import { AndroidNativeSigner } from "applesauce-signers/signers/android-native-signer";
import { AppInfo } from "capacitor-plugin-nostr-signer";
import { useAccountManager } from "applesauce-react/hooks";
import { useAsync } from "react-use";

import useAsyncAction from "../../hooks/use-async-action";

function AndroidNativeSignerButton({ app }: { app: AppInfo }) {
  const manager = useAccountManager();

  const { loading: connecting, run: connect } = useAsyncAction(async () => {
    const account = await AndroidNativeAccount.fromApp(app);
    manager.addAccount(account);
    manager.setActive(account);
  }, [app, manager]);

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
