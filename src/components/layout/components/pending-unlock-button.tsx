import { Badge, Box, Button, ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useContext } from "react";

import { LockIcon } from "../../icons";
import PendingUnlockModal from "../../pending-unlock/pending-unlock-modal";
import { pendingUnlockTotal$ } from "../../../services/pending-unlock";
import { CollapsedContext } from "../context";

/**
 * Application-wide pending-unlock indicator (D-02). Unlike `RelayConnectionButton`/
 * `PublishLogButton`, this owns its own `CollapsedContext` branch instead of being hidden by the
 * caller when the rail collapses — a locked-content indicator that vanishes with the rail would
 * defeat its purpose. Renders nothing when nothing is pending.
 */
export default function PendingUnlockButton({ ...props }: Omit<ButtonProps, "children" | "onClick">) {
  const total = use$(pendingUnlockTotal$) ?? 0;
  const collapsed = useContext(CollapsedContext);
  const modal = useDisclosure();

  if (total === 0) return null;

  const label = `${total} item${total === 1 ? "" : "s"} pending unlock`;

  return (
    <>
      {collapsed ? (
        <Box position="relative" flexShrink={0}>
          <IconButton
            aria-label={label}
            title={label}
            icon={<LockIcon boxSize={5} />}
            colorScheme="orange"
            variant="ghost"
            onClick={modal.onOpen}
            {...props}
          />
          <Badge
            colorScheme="orange"
            variant="solid"
            position="absolute"
            top="-1"
            right="-1"
            borderRadius="full"
            minW="4"
            textAlign="center"
            fontSize="2xs"
            px="1"
            pointerEvents="none"
          >
            {total}
          </Badge>
        </Box>
      ) : (
        <Button
          leftIcon={<LockIcon boxSize={5} />}
          colorScheme="orange"
          onClick={modal.onOpen}
          flexShrink={0}
          {...props}
        >
          {label}
        </Button>
      )}

      {modal.isOpen && <PendingUnlockModal isOpen onClose={modal.onClose} />}
    </>
  );
}
