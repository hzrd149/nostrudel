import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { matchSorter } from "match-sorter";
import { NostrEvent } from "nostr-tools";
import { FormEventHandler, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import SimpleView from "../../components/layout/presets/simple-view";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  getNappletArchetypes,
  getNappletDescription,
  getNappletNaddr,
  getNappletTitle,
  isValidNappletStoreEvent,
} from "../../helpers/nostr/napplets";
import { useReadRelays } from "../../hooks/use-client-relays";
import useAsyncAction from "../../hooks/use-async-action";
import useInstalledNapplets, { useIntentHandlerPreferences } from "../../hooks/use-installed-napplets";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import {
  intentKey,
  setDefaultIntentHandler,
  uninstallNapplet,
  type InstalledNapplet,
} from "../../services/installed-napplets";
import { nappletSyncStatus$, syncInstalledNapplets, type NappletSyncStatus } from "../../services/napplet-sync";
import InstalledNappletCard from "../napplets/components/installed-napplet-card";
import NappletStoreCard from "../napplets/components/napplet-store-card";

function getNappletSearchValues(event: NostrEvent) {
  const archetypes = getNappletArchetypes(event);

  return [
    getNappletTitle(event),
    getNappletDescription(event),
    getNappletNaddr(event),
    event.pubkey,
    ...archetypes.flatMap((archetype) => [archetype.name, ...archetype.actions]),
  ].filter((value): value is string => !!value);
}

const FeaturedNappletCard = memo(function FeaturedNappletCard({ event }: { event: NostrEvent }) {
  const address = getNappletNaddr(event);
  const title = getNappletTitle(event);
  const description = getNappletDescription(event);

  if (!address) return null;

  return (
    <Card
      as={RouterLink}
      to={`/app/store/${address}`}
      variant="outline"
      overflow="hidden"
      bgGradient="linear(to-br, primary.50, transparent)"
      _dark={{ bgGradient: "linear(to-br, whiteAlpha.200, transparent)" }}
      _hover={{ textDecoration: "none", borderColor: "primary.400", shadow: "lg" }}
    >
      <CardBody>
        <Box minW="0">
          <Badge colorScheme="primary" mb="2">
            Featured
          </Badge>
          <Heading size="md" noOfLines={1}>
            {title}
          </Heading>
          <Flex gap="2" color="GrayText" fontSize="sm" alignItems="center" minW="0" mb="2">
            <Text>by</Text>
            <UserAvatar pubkey={event.pubkey} size="xs" />
            <UserName pubkey={event.pubkey} fontSize="sm" isTruncated />
          </Flex>
          <Text color="GrayText" noOfLines={2}>
            {description || "A NIP-5D app published on nostr."}
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
});

const InstalledPointerForm = memo(function InstalledPointerForm() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const submit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) navigate(`/app/store/${trimmed}`);
    },
    [navigate, value],
  );

  return (
    <Box as="form" onSubmit={submit}>
      <Flex gap="2" alignItems="flex-end">
        <FormControl>
          <FormLabel>Install from manifest pointer</FormLabel>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="naddr1..., nevent1..., or note1..."
          />
          <Text color="GrayText" fontSize="sm" mt="1">
            Advanced: paste a napplet manifest pointer to review and install it.
          </Text>
        </FormControl>
        <Button type="submit" colorScheme="primary">
          View
        </Button>
      </Flex>
    </Box>
  );
});

const SYNC_STATUS_TEXT: Record<NappletSyncStatus, string> = {
  device: "Installed apps are saved on this device. Sign in with a signer to sync them between devices.",
  locked: "Your synced apps are encrypted. Unlock them to see installs from your other devices.",
  unsynced: "Some changes have not been synced to your account yet.",
  syncing: "Syncing installed apps…",
  synced: "Installed apps are synced to your account.",
};

function NappletSyncStatusLine() {
  const status = use$(nappletSyncStatus$);
  const { loading, run } = useAsyncAction(syncInstalledNapplets, []);
  const canSync = status === "locked" || status === "unsynced";

  return (
    <Flex gap="2" alignItems="center" wrap="wrap">
      <Text color="GrayText" fontSize="sm">
        {SYNC_STATUS_TEXT[status]}
      </Text>
      {canSync && (
        <Button size="xs" variant="link" colorScheme="primary" onClick={run} isLoading={loading}>
          {status === "locked" ? "Unlock" : "Sync now"}
        </Button>
      )}
    </Flex>
  );
}

function InstalledPanel({ installed }: { installed: InstalledNapplet[] }) {
  return (
    <Flex direction="column" gap="4">
      <NappletSyncStatusLine />
      <InstalledPointerForm />

      {installed.length === 0 ? (
        <Text color="GrayText">Installed NIP-5D apps will appear here.</Text>
      ) : (
        <Flex direction="column" gap="2">
          {installed.map((napplet) => (
            <InstalledNappletCard
              key={napplet.address}
              napplet={napplet}
              onUninstall={() => uninstallNapplet(napplet.address)}
            />
          ))}
        </Flex>
      )}
    </Flex>
  );
}

function HandlerPanel({ installed }: { installed: InstalledNapplet[] }) {
  const preferences = useIntentHandlerPreferences();
  const groups = useMemo(() => {
    const map = new Map<string, { archetype: string; action: string; napplets: InstalledNapplet[] }>();

    for (const napplet of installed) {
      for (const archetype of napplet.archetypes) {
        for (const action of archetype.actions) {
          const key = `${archetype.name}/${action}`;
          const group = map.get(key) ?? { archetype: archetype.name, action, napplets: [] };
          group.napplets.push(napplet);
          map.set(key, group);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      `${a.archetype}/${a.action}`.localeCompare(`${b.archetype}/${b.action}`),
    );
  }, [installed]);
  const collisions = groups.filter((group) => group.napplets.length > 1);

  if (groups.length === 0) return <Text color="GrayText">Install apps with archetypes to manage intent handlers.</Text>;

  return (
    <Flex direction="column" gap="4">
      {collisions.length === 0 && (
        <Text color="GrayText">No installed apps currently collide on supported intents.</Text>
      )}
      {groups.map((group) => {
        const preferred = preferences[intentKey(group.archetype, group.action)];
        const selected = group.napplets.some((napplet) => napplet.address === preferred)
          ? preferred
          : group.napplets[0]?.address || "";

        return (
          <Card key={`${group.archetype}/${group.action}`} variant="outline" size="sm">
            <CardBody>
              <Flex gap="3" alignItems="center" wrap="wrap">
                <Box flex="1" minW="xs">
                  <Heading size="sm">
                    {group.archetype}/{group.action}
                  </Heading>
                  <Text color="GrayText" fontSize="sm">
                    {group.napplets.length === 1
                      ? "Handled by one installed app"
                      : "Choose the default app for this intent"}
                  </Text>
                </Box>
                <Select
                  maxW="sm"
                  value={selected}
                  isDisabled={group.napplets.length < 2}
                  onChange={(e) => setDefaultIntentHandler(group.archetype, group.action, e.target.value)}
                >
                  {group.napplets.map((napplet) => (
                    <option key={napplet.address} value={napplet.address}>
                      {napplet.title}
                    </option>
                  ))}
                </Select>
              </Flex>
            </CardBody>
          </Card>
        );
      })}
    </Flex>
  );
}

const DiscoverSearchForm = memo(function DiscoverSearchForm({
  searchQuery,
  onSearch,
}: {
  searchQuery: string;
  onSearch: (query: string) => void;
}) {
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const submitSearch = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      onSearch(searchValue.trim());
    },
    [onSearch, searchValue],
  );

  return (
    <Box as="form" onSubmit={submitSearch}>
      <Flex gap="2" wrap="wrap" alignItems="center">
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search apps"
          maxW="xs"
          size="sm"
        />
        <Button type="submit" size="sm" colorScheme="primary">
          Search
        </Button>
      </Flex>
    </Box>
  );
});

function NappletGrid({ events, installedAddresses }: { events: NostrEvent[]; installedAddresses: Set<string> }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
      {events.map((event) => {
        const address = getNappletNaddr(event);
        return (
          <NappletStoreCard key={event.id} event={event} installed={!!address && installedAddresses.has(address)} />
        );
      })}
    </SimpleGrid>
  );
}

function DiscoverTimeline({
  timeline,
  callback,
  installedAddresses,
}: {
  timeline: NostrEvent[];
  callback: IntersectionObserverCallback;
  installedAddresses: Set<string>;
}) {
  return (
    <>
      {timeline[0] && (
        <Box mb="4">
          <FeaturedNappletCard event={timeline[0]} />
        </Box>
      )}
      <IntersectionObserverProvider callback={callback}>
        <NappletGrid events={timeline} installedAddresses={installedAddresses} />
      </IntersectionObserverProvider>
    </>
  );
}

function DiscoverPanel({ installedAddresses }: { installedAddresses: Set<string> }) {
  const relays = useReadRelays();
  const { filter, listId } = usePeopleListContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => ({ ...filter, kinds: [NAPPLET_KIND_ROOT, NAPPLET_KIND_NAMED] }), [filter]);
  const { loader, timeline } = useTimelineLoader(`${listId || "global"}-napplet-store`, relays, query, {
    eventFilter: isValidNappletStoreEvent,
  });
  const callback = useTimelineCurserIntersectionCallback(loader);
  const searchQuery = (searchParams.get("q") ?? "").trim();
  const hasSearch = searchQuery.length > 0;
  const searchResults = useMemo(
    () =>
      hasSearch
        ? matchSorter(timeline, searchQuery, {
            keys: [(event) => getNappletSearchValues(event)],
          })
        : [],
    [hasSearch, searchQuery, timeline],
  );

  const submitSearch = useCallback(
    (query: string) => {
      const next = new URLSearchParams(searchParams);
      if (query) next.set("q", query);
      else next.delete("q");
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  return (
    <>
      <Flex justifyContent="space-between" alignItems="flex-start" mb="3" gap="3" wrap="wrap">
        <Box>
          <Heading size="md">Discover apps</Heading>
          <Text color="GrayText">Browse NIP-5D apps published by friends or globally.</Text>
        </Box>
        <Flex gap="2" wrap="wrap" alignItems="center">
          <DiscoverSearchForm searchQuery={searchQuery} onSearch={submitSearch} />
          <PeopleListSelection size="sm" />
        </Flex>
      </Flex>
      {hasSearch ? (
        <Flex direction="column" gap="3">
          <Text color="GrayText">
            {searchResults.length === 0
              ? "No apps found in loaded apps."
              : `Found ${searchResults.length} app${searchResults.length === 1 ? "" : "s"}`}
          </Text>
          {searchResults.length > 0 && <NappletGrid events={searchResults} installedAddresses={installedAddresses} />}
        </Flex>
      ) : (
        <DiscoverTimeline timeline={timeline} callback={callback} installedAddresses={installedAddresses} />
      )}
    </>
  );
}

const STORE_TABS = ["discover", "installed", "handlers"];

function AppStoreContent() {
  const installed = useInstalledNapplets();
  const installedAddresses = useMemo(() => new Set(installed.map((napplet) => napplet.address)), [installed]);
  const tab = useRouteSearchValue("tab", STORE_TABS[0]);
  const tabIndex = Math.max(0, STORE_TABS.indexOf(tab.value));

  return (
    <SimpleView title="App Store">
      <Tabs
        colorScheme="primary"
        variant="soft-rounded"
        index={tabIndex}
        onChange={(i) => (i === 0 ? tab.clearValue() : tab.setValue(STORE_TABS[i]))}
      >
        <TabList gap="2" flexWrap="wrap">
          <Tab>Discover</Tab>
          <Tab>Installed</Tab>
          <Tab>Handlers</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px="0">
            <DiscoverPanel installedAddresses={installedAddresses} />
          </TabPanel>
          <TabPanel px="0">
            <InstalledPanel installed={installed} />
          </TabPanel>
          <TabPanel px="0">
            <HandlerPanel installed={installed} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SimpleView>
  );
}

export default function AppStoreView() {
  return (
    <PeopleListProvider initList="global">
      <AppStoreContent />
    </PeopleListProvider>
  );
}
