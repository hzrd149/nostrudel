import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import useAsyncAction from "../../hooks/use-async-action";
import { PendingUnlockState, pendingUnlockState$, unlockPendingCategories } from "../../services/pending-unlock";
import localSettings from "../../services/preferences";

type PendingUnlockModalProps = Omit<ModalProps, "children">;

/** A single pending category row: label/description/count plus its own unlock action or self-contained unlock UI */
function PendingUnlockRow({ row, onUnlocked }: { row: PendingUnlockState; onUnlocked: () => void }) {
  const { category, canUnlock } = row;

  const unlock = useAsyncAction(async () => {
    await category.unlock();
  }, [category]);

  return (
    <Flex gap="2" alignItems="center" py="2" minW="0">
      <Flex direction="column" minW="0" flex={1}>
        <Text fontWeight="bold" isTruncated>
          {category.label} ({row.count})
        </Text>
        {category.description && (
          <Text fontSize="sm" color="GrayText" isTruncated>
            {category.description}
          </Text>
        )}
      </Flex>

      {category.unlockComponent ? (
        <Flex flexShrink={0} minW="14rem">
          <category.unlockComponent onUnlocked={onUnlocked} />
        </Flex>
      ) : (
        <Button
          size="sm"
          colorScheme="primary"
          flexShrink={0}
          onClick={unlock.run}
          isLoading={unlock.loading}
          loadingText="Unlocking..."
          isDisabled={!canUnlock}
          title={canUnlock ? undefined : "The active account has no signer to unlock this with"}
        >
          Unlock
        </Button>
      )}
    </Flex>
  );
}

/**
 * Lists every pending-unlock category (D-02) and offers the two D-02 actions: unlock everything
 * eligible once, or enable auto-unlock going forward (which also unlocks what's pending right
 * now). Categories that supply their own `unlockComponent` (the decryption cache's password
 * field, D-09) render that component instead of a generic Unlock button.
 */
export default function PendingUnlockModal({ onClose, ...props }: PendingUnlockModalProps) {
  const state = use$(pendingUnlockState$) ?? [];
  const rows = state.filter((row) => row.count > 0);

  // A row is batch-eligible when it has no self-contained unlock UI and the account can act on it
  const batchEligible = rows.some((row) => row.category.unlockComponent === undefined && row.canUnlock);

  const unlockNow = useAsyncAction(async () => {
    await unlockPendingCategories();
  }, []);

  const enableAutoUnlock = useAsyncAction(async () => {
    await localSettings.autoUnlockAll.next(true);
    await unlockPendingCategories();
  }, []);

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Pending unlock</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0">
          {rows.length === 0 ? (
            <Text py="4" textAlign="center" color="GrayText">
              Nothing pending unlock.
            </Text>
          ) : (
            <Stack divider={<StackDivider />} spacing="0">
              {rows.map((row) => (
                <PendingUnlockRow key={row.category.id} row={row} onUnlocked={onClose} />
              ))}
            </Stack>
          )}
        </ModalBody>
        <ModalFooter p="4" gap="2">
          <Button
            variant="ghost"
            colorScheme="orange"
            flexShrink={0}
            onClick={enableAutoUnlock.run}
            isLoading={enableAutoUnlock.loading}
            loadingText="Enabling..."
          >
            Enable auto-unlock
          </Button>
          <Button
            colorScheme="primary"
            flexShrink={0}
            onClick={unlockNow.run}
            isLoading={unlockNow.loading}
            loadingText="Unlocking..."
            isDisabled={!batchEligible}
          >
            Unlock now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
