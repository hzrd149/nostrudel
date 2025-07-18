import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Switch,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { useCallback, useRef, useState } from "react";
import { firstValueFrom } from "rxjs";

import EncryptedStorage from "../../classes/encrypted-storage";
import useAsyncAction from "../../hooks/use-async-action";
import { decryptionCache$, decryptionCacheStats$ } from "../../services/decryption-cache";
import localSettings from "../../services/preferences";
import useForceUpdate from "../../hooks/use-force-update";

export default function RequireDecryptionCache({ children }: { children: JSX.Element }) {
  const stats = useObservableState(decryptionCacheStats$);
  const cache = useObservableEagerState(decryptionCache$);
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const [password, setPassword] = useState("");
  const toast = useToast();
  const disableEncryptionModal = useDisclosure();
  const disableCacheModal = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const unlockCache = useAsyncAction(async () => {
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your message cache password",
        status: "warning",
      });
      return;
    }

    if (cache instanceof EncryptedStorage) {
      const success = await cache.unlock(password);
      if (success) {
        setPassword("");
      } else {
        toast({
          title: "Incorrect password",
          description: "The password you entered is incorrect",
          status: "error",
        });
      }
    }
  }, [password, cache, toast]);

  const disableCache = useAsyncAction(async () => {
    // Clear the cache first
    const cache = await firstValueFrom(decryptionCache$);
    if (cache) await cache.clear();

    // Disable the cache
    localSettings.enableDecryptionCache.next(false);

    toast({
      title: "Message cache disabled",
      description: "The message cache has been cleared and disabled",
      status: "info",
    });

    disableCacheModal.onClose();
  }, [toast]);

  const disableEncryption = useCallback(() => {
    // Disable encryption setting
    localSettings.encryptDecryptionCache.next(false);

    toast({
      title: "Encryption disabled",
      description: "The message cache encryption has been disabled and the cache has been cleared",
      status: "info",
    });

    disableEncryptionModal.onClose();
  }, [toast]);

  // If cache is not encrypted or is already unlocked, render children
  if (cache === null || (cache instanceof EncryptedStorage ? cache.unlocked : true)) {
    return children;
  }

  return (
    <Flex direction="column" w="full" h="full" alignItems="center" justifyContent="center" gap="4">
      <Card maxW="md" w="full">
        <CardHeader pb="0">
          <Heading size="md" textAlign="center">
            Unlock Message Cache
          </Heading>
        </CardHeader>

        <CardBody>
          <VStack spacing="4">
            <Alert status="info" borderRadius="md">
              <Text fontSize="sm">
                The message cache is used to cache decrypted direct messages locally in your browser to improve loading
                speed. It is encrypted to securely store messages. Enter your password to unlock it and access your
                encrypted messages.
              </Text>
            </Alert>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !unlockCache.loading && unlockCache.run()}
                placeholder="Enter current password or new password"
                autoFocus
                autoComplete="off"
              />
            </FormControl>

            <FormControl>
              <Flex alignItems="center">
                <FormLabel htmlFor="autoDecryptMessages" mb="0">
                  Automatically decrypt messages
                </FormLabel>
                <Switch
                  id="autoDecryptMessages"
                  isChecked={autoDecryptMessages}
                  onChange={(e) => localSettings.autoDecryptMessages.next(e.target.checked)}
                />
              </Flex>
              <FormHelperText>Automatically decrypt direct messages when they are loaded or received.</FormHelperText>
            </FormControl>

            {stats && (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Cache contains {stats.totalEntries} encrypted entries
                {stats.estimatedSize > 0 && ` (~${Math.round(stats.estimatedSize / 1024)}KB)`}
              </Text>
            )}
          </VStack>
        </CardBody>

        <CardFooter pt="0">
          <VStack w="full" spacing="3">
            <Button
              colorScheme="primary"
              w="full"
              onClick={unlockCache.run}
              isLoading={unlockCache.loading}
              loadingText="Unlocking..."
            >
              Unlock Cache
            </Button>

            <ButtonGroup w="full">
              <Button variant="ghost" size="sm" onClick={disableCacheModal.onOpen} colorScheme="orange" w="full">
                Disable cache
              </Button>
              <Button variant="ghost" size="sm" onClick={disableEncryptionModal.onOpen} colorScheme="red" w="full">
                Disable encryption
              </Button>
            </ButtonGroup>
          </VStack>
        </CardFooter>
      </Card>

      {/* Disable Encryption Dialog */}
      <AlertDialog
        isOpen={disableEncryptionModal.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={disableEncryptionModal.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Disable Encryption
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to disable message cache encryption? This will:
              <br />• Clear all cached encrypted messages
              <br />• Store future messages unencrypted
              <br />• Remove the password requirement
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={disableEncryptionModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={disableEncryption} ml={3}>
                Disable Encryption
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Disable Message Cache Dialog */}
      <AlertDialog
        isOpen={disableCacheModal.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={disableCacheModal.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Disable Message Cache
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to disable the message cache? This will:
              <br />• Clear all cached messages
              <br />• Stop caching decrypted direct messages
              <br />• Messages will need to be decrypted every time they are loaded
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={disableCacheModal.onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={disableCache.run}
                ml={3}
                isLoading={disableCache.loading}
                loadingText="Disabling..."
              >
                Disable Message Cache
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}
