import {
  Alert,
  AlertIcon,
  Badge,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spinner,
  Stack,
  StackDivider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import {
  getHiddenTags,
  hasHiddenTags,
  isHiddenTagsUnlocked,
  unlockHiddenTags,
} from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback, useMemo, useReducer, useState } from "react";

import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import {
  diffListTags,
  diffTags,
  getTagsAddedByMerge,
  mergeVersionIntoList,
  mergeWouldChangeList,
  restoreListVersion,
  restoreWouldChangeList,
} from "../../../helpers/nostr/list-history";
import { getListTitle } from "../../../helpers/nostr/lists";
import useListHistory from "../../../hooks/use-list-history";
import { usePublishEvent } from "../../../providers/global/publish-provider";

type ListHistoryModalProps = Omit<ModalProps, "children"> & {
  list: NostrEvent;
};

/** Renders a single list tag in a human readable way */
function TagPreview({ tag }: { tag: string[] }) {
  if (tag[0] === "p" && tag[1]) {
    return (
      <Flex gap="2" alignItems="center" minW="0">
        <UserAvatar pubkey={tag[1]} size="xs" />
        <UserLink pubkey={tag[1]} fontWeight="bold" isTruncated />
      </Flex>
    );
  }

  return (
    <Flex gap="2" alignItems="center" minW="0">
      <Badge flexShrink={0} textTransform="none">
        {tag[0]}
      </Badge>
      <Text fontSize="sm" isTruncated>
        {tag.slice(1).join(" · ")}
      </Text>
    </Flex>
  );
}

/** Compact +green/-red counts (e.g. "+3/-1") */
function DiffCounts({ added, removed }: { added: number; removed: number }) {
  if (added === 0 && removed === 0) return null;

  return (
    <Text as="span" fontSize="sm" whiteSpace="nowrap" flexShrink={0}>
      {added > 0 && (
        <Text as="span" color="green.500" fontWeight="bold">
          +{added}
        </Text>
      )}
      {added > 0 && removed > 0 && (
        <Text as="span" color="GrayText">
          /
        </Text>
      )}
      {removed > 0 && (
        <Text as="span" color="red.500" fontWeight="bold">
          -{removed}
        </Text>
      )}
    </Text>
  );
}

/** Labeled +green/-red text summarizing a tag diff (e.g. "vs current: +3 -1") */
function TagChange({ label, added, removed }: { label: string; added: number; removed: number }) {
  return (
    <Text as="span" fontSize="sm" whiteSpace="nowrap" flexShrink={0}>
      <Text as="span" color="GrayText">
        {label}:{" "}
      </Text>
      {added === 0 && removed === 0 ? (
        <Text as="span" color="GrayText">
          no changes
        </Text>
      ) : (
        <>
          {added > 0 && (
            <Text as="span" color="green.500" fontWeight="bold">
              +{added}
            </Text>
          )}
          {added > 0 && removed > 0 && " "}
          {removed > 0 && (
            <Text as="span" color="red.500" fontWeight="bold">
              -{removed}
            </Text>
          )}
        </>
      )}
    </Text>
  );
}

/** Merge + Restore buttons shared by the public and hidden version rows */
function RestoreMergeButtons({
  version,
  canMerge,
  canRestore,
  onRestore,
  onMerge,
}: {
  version: NostrEvent;
  canMerge: boolean;
  canRestore: boolean;
  onRestore: (version: NostrEvent) => void;
  onMerge: (version: NostrEvent) => void;
}) {
  return (
    <>
      {canMerge && (
        <Button variant="ghost" onClick={() => onMerge(version)}>
          Merge
        </Button>
      )}
      {canRestore && (
        <Button colorScheme="primary" onClick={() => onRestore(version)}>
          Restore
        </Button>
      )}
    </>
  );
}

function VersionRow({
  list,
  version,
  previous,
  onRestore,
  onMerge,
}: {
  /** The current active list event — vs-current diff and actions are computed against it */
  list: NostrEvent;
  version: NostrEvent;
  /** The next older version, used for the "vs previous" diff */
  previous?: NostrEvent;
  onRestore: (version: NostrEvent) => void;
  onMerge: (version: NostrEvent) => void;
}) {
  const current = version.id === list.id;
  const vsPrevious = useMemo(() => (previous ? diffListTags(previous, version) : undefined), [previous, version]);
  const vsCurrent = useMemo(() => diffListTags(list, version), [list, version]);

  const canMerge = useMemo(() => !current && mergeWouldChangeList(list, version), [current, list, version]);
  const canRestore = useMemo(() => !current && restoreWouldChangeList(list, version), [current, list, version]);

  return (
    <Flex gap="2" alignItems="center" py="2" minW="0">
      <Timestamp timestamp={version.created_at} fontWeight="bold" fontSize="sm" flexShrink={0} />
      {vsPrevious && <DiffCounts added={vsPrevious.added.length} removed={vsPrevious.removed.length} />}
      <Text color="GrayText" fontSize="sm" whiteSpace="nowrap" flexShrink={0}>
        ({version.tags.length} tag{version.tags.length === 1 ? "" : "s"})
      </Text>
      {!current && (
        <TagChange label="vs current" added={vsCurrent.added.length} removed={vsCurrent.removed.length} />
      )}
      {current && (
        <Badge colorScheme="green" flexShrink={0} fontSize="xs">
          Current
        </Badge>
      )}
      {!current && (canMerge || canRestore) && (
        <ButtonGroup size="sm" ml="auto" flexShrink={0}>
          <RestoreMergeButtons
            version={version}
            canMerge={canMerge}
            canRestore={canRestore}
            onRestore={onRestore}
            onMerge={onMerge}
          />
        </ButtonGroup>
      )}
    </Flex>
  );
}

function HiddenVersionRow({
  list,
  version,
  previous,
  currentEvent,
  unlocking,
  onUnlock,
  onRestore,
  onMerge,
}: {
  /** The current active list event, used to decide which actions would change it */
  list: NostrEvent;
  version: NostrEvent;
  /** The next older version that also has hidden tags, for the "vs previous" diff */
  previous?: NostrEvent;
  /** The version that matches the current list (used to diff hidden tags against), if found */
  currentEvent?: NostrEvent;
  unlocking: boolean;
  onUnlock: (version: NostrEvent) => void;
  onRestore: (version: NostrEvent) => void;
  onMerge: (version: NostrEvent) => void;
}) {
  const current = version.id === list.id;
  const unlocked = isHiddenTagsUnlocked(version);
  const hidden = unlocked ? getHiddenTags(version) ?? [] : [];

  const canMerge = !current && mergeWouldChangeList(list, version);
  const canRestore = !current && restoreWouldChangeList(list, version);

  // Diff hidden tags against the previous version, only when both are unlocked
  const previousUnlocked = previous ? isHiddenTagsUnlocked(previous) : false;
  const vsPrevious = useMemo(() => {
    if (!unlocked || !previous || !previousUnlocked) return undefined;
    return diffTags(getHiddenTags(previous) ?? [], hidden);
  }, [unlocked, previous, previousUnlocked, hidden]);

  // Diff hidden tags against the current version, only when both are unlocked
  const currentUnlocked = currentEvent ? isHiddenTagsUnlocked(currentEvent) : false;
  const vsCurrent = useMemo(() => {
    if (current || !unlocked || !currentEvent || !currentUnlocked) return undefined;
    return diffTags(getHiddenTags(currentEvent) ?? [], hidden);
  }, [current, unlocked, currentEvent, currentUnlocked, hidden]);

  return (
    <Flex gap="2" alignItems="center" py="2" minW="0">
      <Timestamp timestamp={version.created_at} fontWeight="bold" fontSize="sm" flexShrink={0} />
      {vsPrevious && <DiffCounts added={vsPrevious.added.length} removed={vsPrevious.removed.length} />}
      {unlocked ? (
        <Text color="GrayText" fontSize="sm" whiteSpace="nowrap" flexShrink={0}>
          ({hidden.length} hidden tag{hidden.length === 1 ? "" : "s"})
        </Text>
      ) : (
        <Badge colorScheme="orange" flexShrink={0} fontSize="xs">
          Locked
        </Badge>
      )}
      {vsCurrent && (
        <TagChange label="vs current" added={vsCurrent.added.length} removed={vsCurrent.removed.length} />
      )}
      {current && (
        <Badge colorScheme="green" flexShrink={0} fontSize="xs">
          Current
        </Badge>
      )}
      {(!unlocked || canMerge || canRestore) && (
        <ButtonGroup size="sm" ml="auto" flexShrink={0}>
          {!unlocked && (
            <Button variant="ghost" colorScheme="primary" isLoading={unlocking} onClick={() => onUnlock(version)}>
              Unlock
            </Button>
          )}
          <RestoreMergeButtons
            version={version}
            canMerge={canMerge}
            canRestore={canRestore}
            onRestore={onRestore}
            onMerge={onMerge}
          />
        </ButtonGroup>
      )}
    </Flex>
  );
}

/** Tab panel that lists only the versions that contain hidden (encrypted) tags */
function HiddenVersions({
  list,
  events,
  onRestore,
  onMerge,
}: {
  list: NostrEvent;
  events: NostrEvent[];
  onRestore: (version: NostrEvent) => void;
  onMerge: (version: NostrEvent) => void;
}) {
  const account = useActiveAccount();
  // unlockHiddenTags caches the result on the event object (symbol), so force a re-render to reflect it
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const [unlockingIds, setUnlockingIds] = useState<Set<string>>(new Set());
  const [unlockingAll, setUnlockingAll] = useState(false);

  const hiddenEvents = useMemo(() => events.filter((event) => hasHiddenTags(event)), [events]);

  const unlock = useCallback(
    async (event: NostrEvent) => {
      if (!account || isHiddenTagsUnlocked(event)) return;
      setUnlockingIds((prev) => new Set(prev).add(event.id));
      try {
        await unlockHiddenTags(event, account);
        refresh();
      } catch (error) {
        // ignore — the signer was denied or the content could not be decrypted
      } finally {
        setUnlockingIds((prev) => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });
      }
    },
    [account],
  );

  const unlockAll = useCallback(async () => {
    setUnlockingAll(true);
    try {
      for (const event of hiddenEvents) await unlock(event);
    } finally {
      setUnlockingAll(false);
    }
  }, [hiddenEvents, unlock]);

  const lockedCount = hiddenEvents.filter((event) => !isHiddenTagsUnlocked(event)).length;
  // The version that matches the current list, used to diff hidden tags against
  const currentEvent = useMemo(() => hiddenEvents.find((event) => event.id === list.id), [hiddenEvents, list.id]);

  if (hiddenEvents.length === 0)
    return (
      <Text py="8" textAlign="center" color="GrayText">
        No versions with hidden tags.
      </Text>
    );

  return (
    <Flex direction="column">
      {!account ? (
        <Alert status="warning" fontSize="sm" borderRadius="md" mb="2">
          <AlertIcon />
          Sign in to unlock and compare hidden tags.
        </Alert>
      ) : (
        lockedCount > 0 && (
          <Flex mb="2">
            <Button size="sm" colorScheme="primary" onClick={unlockAll} isLoading={unlockingAll} ml="auto">
              Unlock all ({lockedCount})
            </Button>
          </Flex>
        )
      )}

      <Stack divider={<StackDivider />} spacing="0">
        {hiddenEvents.map((event, i) => (
          <HiddenVersionRow
            key={event.id}
            list={list}
            version={event}
            previous={hiddenEvents[i + 1]}
            currentEvent={currentEvent}
            unlocking={unlockingIds.has(event.id) || unlockingAll}
            onUnlock={unlock}
            onRestore={onRestore}
            onMerge={onMerge}
          />
        ))}
      </Stack>
    </Flex>
  );
}

/** Confirmation screen shown when merging a historical version into the current list */
function MergeConfirm({
  list,
  version,
  working,
  onBack,
  onConfirm,
}: {
  list: NostrEvent;
  version: NostrEvent;
  working: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const added = useMemo(() => getTagsAddedByMerge(list, version), [list, version]);

  return (
    <>
      <ModalBody px="4" py="0" display="flex" flexDirection="column" gap="3">
        <Text>
          Merging the version from{" "}
          <Text as="span" fontWeight="bold">
            <Timestamp timestamp={version.created_at} />
          </Text>{" "}
          will add the following {added.length} tag{added.length === 1 ? "" : "s"} to your current list:
        </Text>

        {added.length === 0 ? (
          <Alert status="info" fontSize="sm" borderRadius="md">
            <AlertIcon />
            This version contains no new tags that aren't already on your current list.
          </Alert>
        ) : (
          <Stack divider={<StackDivider />} spacing="0">
            {added.map((tag, i) => (
              <Flex key={`${tag.join(":")}-${i}`} py="2" minW="0">
                <TagPreview tag={tag} />
              </Flex>
            ))}
          </Stack>
        )}
      </ModalBody>
      <ModalFooter p="4" gap="2">
        <Button variant="ghost" onClick={onBack} flexShrink={0}>
          Back
        </Button>
        <Button
          colorScheme="primary"
          onClick={onConfirm}
          isLoading={working}
          isDisabled={added.length === 0}
          flexShrink={0}
        >
          Confirm merge
        </Button>
      </ModalFooter>
    </>
  );
}

export default function ListHistoryModal({ list, onClose, ...props }: ListHistoryModalProps) {
  const publish = usePublishEvent();
  const { versions } = useListHistory(list);
  const [working, setWorking] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<NostrEvent>();

  const loading = versions === undefined;
  const events = versions ?? [];

  const handleRestore = async (version: NostrEvent) => {
    setWorking(true);
    try {
      await publish("Restore list version", restoreListVersion(version));
      onClose();
    } finally {
      setWorking(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (!mergeTarget) return;
    setWorking(true);
    try {
      await publish("Merge list version", mergeVersionIntoList(list, mergeTarget));
      onClose();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal onClose={onClose} size="2xl" scrollBehavior="outside" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">
          <Heading size="md">{mergeTarget ? "Confirm merge" : "Version history"}</Heading>
          <Text fontSize="sm" color="GrayText" fontWeight="normal">
            {getListTitle(list)}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        {mergeTarget ? (
          <MergeConfirm
            list={list}
            version={mergeTarget}
            working={working}
            onBack={() => setMergeTarget(undefined)}
            onConfirm={handleConfirmMerge}
          />
        ) : (
          <>
            <ModalBody px="4" py="0">
              <Tabs variant="line" isLazy>
                <TabList>
                  <Tab>Public</Tab>
                  <Tab>Hidden</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px="0">
                    {loading && (
                      <Flex justifyContent="center" py="8" gap="2" alignItems="center">
                        <Spinner /> Searching relays for older versions…
                      </Flex>
                    )}

                    {!loading && events.length === 0 && (
                      <Text py="8" textAlign="center" color="GrayText">
                        No versions found.
                      </Text>
                    )}

                    <Stack divider={<StackDivider />} spacing="0">
                      {events.map((event, i) => (
                        <VersionRow
                          key={event.id}
                          list={list}
                          version={event}
                          previous={events[i + 1]}
                          onRestore={handleRestore}
                          onMerge={setMergeTarget}
                        />
                      ))}
                    </Stack>
                  </TabPanel>

                  <TabPanel px="0">
                    <HiddenVersions list={list} events={events} onRestore={handleRestore} onMerge={setMergeTarget} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            <ModalFooter p="4" gap="2">
              {loading && events.length > 0 && <Spinner size="sm" />}
              <Text fontSize="sm" color="GrayText" mr="auto">
                {events.length} version{events.length === 1 ? "" : "s"} found
              </Text>
              <Button onClick={onClose} variant="ghost" flexShrink={0}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
