import { lazy, Suspense } from "react";
import { Box, Card, CardBody, Flex, IconButton, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ExtensionAccount, SerialPortAccount } from "applesauce-accounts/accounts";
import { ExtensionSigner, SerialPortSigner } from "applesauce-signers";
import { useAccountManager, useAccounts } from "applesauce-react/hooks";
import { CloseIcon } from "@chakra-ui/icons";

import Key01 from "../../components/icons/key-01";
import Diamond01 from "../../components/icons/diamond-01";
import UsbFlashDrive from "../../components/icons/usb-flash-drive";
import Package from "../../components/icons/package";
import Eye from "../../components/icons/eye";
import PuzzlePiece01 from "../../components/icons/puzzle-piece-01";
import { CAP_IS_ANDROID, IS_WEB_ANDROID } from "../../env";
import useAsyncAction from "../../hooks/use-async-action";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import AccountTypeBadge from "../../components/accounts/account-info-badge";

const AndroidNativeSigners = lazy(() => import("./native"));

/** A clickable card option with an icon top-left, title, and description */
function OptionCard({
  icon,
  title,
  description,
  onClick,
  isLoading,
  colorScheme,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  isLoading?: boolean;
  colorScheme?: string;
}) {
  return (
    <Card
      as="button"
      variant="outline"
      onClick={onClick}
      cursor="pointer"
      textAlign="left"
      w="full"
      opacity={isLoading ? 0.7 : 1}
      _hover={{ borderColor: colorScheme ? `${colorScheme}.400` : "primary.400", shadow: "md" }}
      transition="all 0.15s"
    >
      <CardBody p="4">
        <Flex align="center" gap="2" mb="1">
          <Box color={colorScheme ? `${colorScheme}.400` : "primary.400"} flexShrink={0}>
            {icon}
          </Box>
          <Text fontWeight="bold" fontSize="md">
            {isLoading ? "Connecting..." : title}
          </Text>
        </Flex>
        <Text fontSize="sm" opacity={0.7}>
          {description}
        </Text>
      </CardBody>
    </Card>
  );
}

/** A clickable card option that renders as a router link */
function OptionCardLink({
  icon,
  title,
  description,
  to,
  state,
  colorScheme,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  state?: unknown;
  colorScheme?: string;
}) {
  return (
    <Card
      as={RouterLink}
      to={to}
      state={state}
      variant="outline"
      cursor="pointer"
      textAlign="left"
      w="full"
      _hover={{ borderColor: colorScheme ? `${colorScheme}.400` : "primary.400", shadow: "md" }}
      transition="all 0.15s"
      textDecoration="none !important"
    >
      <CardBody p="4">
        <Flex align="center" gap="2" mb="1">
          <Box color={colorScheme ? `${colorScheme}.400` : "primary.400"} flexShrink={0}>
            {icon}
          </Box>
          <Text fontWeight="bold" fontSize="md">
            {title}
          </Text>
        </Flex>
        <Text fontSize="sm" opacity={0.7}>
          {description}
        </Text>
      </CardBody>
    </Card>
  );
}

export default function SigninStartView() {
  const location = useLocation();
  const manager = useAccountManager();
  const accounts = useAccounts();

  const extension = useAsyncAction(async () => {
    if (!window.nostr) throw new Error("Missing NIP-07 signer extension");

    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();

    const account =
      manager.accounts.find((a) => a.type === ExtensionAccount.type && a.pubkey === pubkey) ??
      new ExtensionAccount(pubkey, signer);

    if (!manager.accounts.includes(account)) manager.addAccount(account);
    manager.setActive(account);
  });

  const serial = useAsyncAction(async () => {
    if (!SerialPortSigner.SUPPORTED) throw new Error("Serial is not supported");

    const signer = new SerialPortSigner();
    const pubkey = await signer.getPublicKey();
    const account = new SerialPortAccount(pubkey, signer);
    manager.addAccount(account);
    manager.setActive(account);
  });

  return (
    <>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" w="full">
        {window.nostr && (
          <OptionCard
            icon={<PuzzlePiece01 boxSize={6} />}
            title="Browser Extension"
            description="Sign in using a NIP-07 browser extension like Alby or nos2x."
            onClick={extension.run}
            isLoading={extension.loading}
            colorScheme="primary"
          />
        )}
        {IS_WEB_ANDROID && (
          <OptionCardLink
            icon={<Diamond01 boxSize={6} />}
            title="Amber"
            description="Use the Amber signing app on your Android device."
            to="./connect"
            colorScheme="orange"
          />
        )}
        {CAP_IS_ANDROID && (
          <Suspense>
            <AndroidNativeSigners />
          </Suspense>
        )}
        {SerialPortSigner.SUPPORTED && (
          <OptionCard
            icon={<UsbFlashDrive boxSize={6} />}
            title="Signing Device"
            description="Connect a hardware signing device over USB serial (NSD)."
            onClick={serial.run}
            isLoading={serial.loading}
            colorScheme="purple"
          />
        )}
        <OptionCardLink
          icon={<Package boxSize={6} />}
          title="Nostr Connect"
          description="Connect to a remote signer using a bunker URI or QR code."
          to="./connect"
          state={location.state}
        />
        <OptionCardLink
          icon={<Key01 boxSize={6} />}
          title="Private Key"
          description="Sign in directly with your nsec private key."
          to="./nsec"
          state={location.state}
        />
        <OptionCardLink
          icon={<Eye boxSize={6} />}
          title="Read-only"
          description="View any profile without signing by entering an npub public key."
          to="./npub"
          state={location.state}
        />
      </SimpleGrid>

      {accounts.length > 0 && (
        <>
          <Text fontWeight="bold" mt="4">
            Existing accounts
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" w="full">
            {accounts.map((account) => (
              <Card
                key={account.id}
                as="button"
                variant="outline"
                onClick={() => manager.setActive(account)}
                cursor="pointer"
                textAlign="left"
                w="full"
                _hover={{ borderColor: "primary.400", shadow: "md" }}
                transition="all 0.15s"
              >
                <CardBody p="4">
                  <Flex align="center" gap="2" mb="1">
                    <UserAvatar pubkey={account.pubkey} size="sm" flexShrink={0} />
                    <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                      <UserName pubkey={account.pubkey} />
                    </Text>
                    <IconButton
                      ms="auto"
                      aria-label="Remove account"
                      icon={<CloseIcon boxSize={3} />}
                      variant="ghost"
                      size="sm"
                      colorScheme="red"
                      flexShrink={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        manager.removeAccount(account);
                      }}
                    />
                  </Flex>
                  <AccountTypeBadge account={account} />
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}

      <Text fontWeight="bold" mt="4">
        Don't have an account?
      </Text>
      <OptionCardLink
        icon={<Key01 boxSize={6} />}
        title="Sign up"
        description="Create a new Nostr identity."
        to="/signup"
        state={location.state}
        colorScheme="primary"
      />
    </>
  );
}
