import { Badge, Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { hasHiddenTags } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";

import useAsyncAction from "../../../../hooks/use-async-action";
import usePendingUnlockCategory from "../../../../hooks/use-pending-unlock-category";
import useUserMuteList from "../../../../hooks/use-user-mute-list";
import { HiddenMutesQuery } from "../../../../models/mutes";
import MutedUserCard from "./muted-user-card";

/**
 * The Private section of the Muted view (D-10/D-11/D-12): a locked placeholder with its own
 * Unlock button while the hidden half is locked, and a list of privately-muted pubkeys once
 * unlocked. Renders nothing when the mute list carries no hidden content at all.
 *
 * Locked state and the unlock action both come from the pending-unlock registry (via
 * usePendingUnlockCategory("mutes")), never recomputed here — that's what keeps this section and
 * the side-nav badge from ever disagreeing.
 */
export default function PrivateMutesSection({ pubkey }: { pubkey: string }) {
  const muteListEvent = useUserMuteList(pubkey);
  const hidden = useEventModel(HiddenMutesQuery, [pubkey]);
  const row = usePendingUnlockCategory("mutes");

  const unlock = useAsyncAction(async () => {
    if (row) await row.category.unlock();
  }, [row]);

  // No hidden content at all — a Private section would be a dead section.
  if (!muteListEvent || !hasHiddenTags(muteListEvent)) return null;

  // hasHiddenTags only reveals that hidden content exists, never how much (D-11) — the registry
  // row's count is the single source of truth for locked state, never recomputed locally.
  const locked = (row?.count ?? 0) > 0;

  return (
    <Flex direction="column" gap="2" flexShrink={0} px="2" pb="2">
      <Heading size="sm">Private</Heading>

      {locked ? (
        <Flex direction="column" gap="2" alignItems="flex-start">
          <Flex gap="2" alignItems="center">
            <Badge colorScheme="orange" flexShrink={0} fontSize="xs">
              Locked
            </Badge>
            <Text fontSize="sm" color="GrayText">
              The number of privately muted users can't be known until your mute list is unlocked.
            </Text>
          </Flex>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="primary"
            onClick={unlock.run}
            isLoading={unlock.loading}
            loadingText="Unlocking..."
            isDisabled={!row?.canUnlock}
            title={row?.canUnlock === false ? "The active account has no signer to unlock this with" : undefined}
          >
            Unlock
          </Button>
        </Flex>
      ) : hidden && hidden.pubkeys.size > 0 ? (
        // Intentionally unvirtualized: private mute lists are expected to be small relative to
        // public ones (RESEARCH.md Assumption A3 — no data on real-world sizes exists in this
        // codebase). A second flex:1 AutoSizer can't share this column with the public list's
        // AutoSizer (it measures a contested/zero height), so this is a bounded, scrolling box
        // instead. If a large private list ever surfaces, swap this for a bounded FixedSizeList.
        <Box maxH="320px" overflowY="auto" flexShrink={0}>
          <Flex direction="column" gap="2">
            {Array.from(hidden.pubkeys).map((pk) => (
              <MutedUserCard key={pk} pubkey={pk} hidden={true} />
            ))}
          </Flex>
        </Box>
      ) : (
        <Text fontSize="sm" color="GrayText">
          No privately muted users.
        </Text>
      )}
    </Flex>
  );
}
