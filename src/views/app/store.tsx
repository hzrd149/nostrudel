import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { getEventUID, getReplaceableAddress } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { matchSorter } from "match-sorter";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import FilterFunnel02 from "../../components/icons/filter-funnel-02";
import SimpleView from "../../components/layout/presets/simple-view";
import { getListTitle } from "../../helpers/nostr/lists";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  getNappletArchetypes,
  getNappletDescription,
  getNappletHashtags,
  getNappletNaddr,
  getNappletTitle,
  isValidNappletStoreEvent,
} from "../../helpers/nostr/napplets";
import { useReadRelays } from "../../hooks/use-client-relays";
import useInstalledNapplets from "../../hooks/use-installed-napplets";
import useNappletEngagement, { type NappletEngagement } from "../../hooks/use-napplet-engagement";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { useVirtualListScrollRestore } from "../../hooks/use-scroll-restore";
import useSocialGraph from "../../hooks/use-social-graph";
import useTimelineEvents from "../../hooks/use-timeline-events";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useUserSets from "../../hooks/use-user-sets";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { usePeopleListSelect } from "../../providers/local/people-list-provider";
import NappletStoreCard, { NAPPLET_STORE_CARD_HEIGHT } from "../napplets/components/napplet-store-card";

type SortMode = "recent" | "likes" | "comments" | "zaps";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Newest" },
  { value: "likes", label: "Most liked" },
  { value: "comments", label: "Most comments" },
  { value: "zaps", label: "Most zapped" },
];

// Friends of friends
const COMMUNITY_DISTANCE = 2;
const MAX_HASHTAGS = 20;
const COLUMN_MIN_WIDTH = 360;
const MAX_COLUMNS = 3;
const GRID_SPACING = 4;

function getNappletSearchValues(event: NostrEvent) {
  const archetypes = getNappletArchetypes(event);

  return [
    getNappletTitle(event),
    getNappletDescription(event),
    getNappletNaddr(event),
    event.pubkey,
    ...getNappletHashtags(event),
    ...archetypes.flatMap((archetype) => [archetype.name, ...archetype.actions]),
  ].filter((value): value is string => !!value);
}

function getNappletTypes(event: NostrEvent) {
  return getNappletArchetypes(event)
    .map((archetype) => archetype.name)
    .filter((name) => name !== "app");
}

/** Values found across events, most common first */
function countValues(events: NostrEvent[], getValues: (event: NostrEvent) => string[]) {
  const counts = new Map<string, number>();
  for (const event of events) for (const value of getValues(event)) counts.set(value, (counts.get(value) ?? 0) + 1);

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value);
}

function sortNapplets(events: NostrEvent[], sort: SortMode, engagement: Map<string, NappletEngagement>) {
  if (sort === "recent") return events;

  const score = (event: NostrEvent) => engagement.get(getEventUID(event))?.[sort] ?? 0;
  return [...events].sort((a, b) => score(b) - score(a) || b.created_at - a.created_at);
}

function DiscoverSourceSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const account = useActiveAccount();
  const lists = useUserSets(account?.pubkey)?.filter((list) => list.kind === kinds.Followsets) ?? [];

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {account && <option value="following">Following</option>}
      <option value="community">Community</option>
      <option value="global">Global</option>
      {lists.length > 0 && (
        <optgroup label="Lists">
          {lists.map((list) => (
            <option key={getEventUID(list)} value={getReplaceableAddress(list) ?? ""}>
              {getListTitle(list)}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

function HashtagFilter({
  hashtags,
  selected,
  onSelect,
}: {
  hashtags: string[];
  selected: string | null;
  onSelect: (hashtag: string | null) => void;
}) {
  return (
    <Flex gap="2" wrap="wrap">
      {hashtags.map((hashtag) => {
        const isSelected = hashtag === selected;
        return (
          <Tag
            key={hashtag}
            as="button"
            fontSize="md"
            cursor="pointer"
            colorScheme={isSelected ? "primary" : undefined}
            variant={isSelected ? "solid" : "subtle"}
            onClick={() => onSelect(isSelected ? null : hashtag)}
          >
            #{hashtag}
          </Tag>
        );
      })}
    </Flex>
  );
}

type GridData = {
  rows: NostrEvent[][];
  columns: number;
  installedAddresses: Set<string>;
  engagement: Map<string, NappletEngagement>;
};

function NappletGridRow({ index, style, data }: ListChildComponentProps<GridData>) {
  return (
    <SimpleGrid style={style} columns={data.columns} spacingX={`${GRID_SPACING}px`}>
      {data.rows[index].map((event) => {
        const address = getNappletNaddr(event);
        return (
          <NappletStoreCard
            key={event.id}
            event={event}
            installed={!!address && data.installedAddresses.has(address)}
            engagement={data.engagement.get(getEventUID(event))}
          />
        );
      })}
    </SimpleGrid>
  );
}

function NappletGridList({
  napplets,
  installedAddresses,
  engagement,
  width,
  height,
}: {
  napplets: NostrEvent[];
  installedAddresses: Set<string>;
  engagement: Map<string, NappletEngagement>;
  width: number;
  height: number;
}) {
  const scroll = useVirtualListScrollRestore("napplet-store");
  const columns = Math.min(MAX_COLUMNS, Math.max(1, Math.floor(width / COLUMN_MIN_WIDTH)));
  const data = useMemo<GridData>(() => {
    const rows: NostrEvent[][] = [];
    for (let i = 0; i < napplets.length; i += columns) rows.push(napplets.slice(i, i + columns));
    return { rows, columns, installedAddresses, engagement };
  }, [napplets, columns, installedAddresses, engagement]);

  return (
    <List
      itemCount={data.rows.length}
      itemSize={NAPPLET_STORE_CARD_HEIGHT + GRID_SPACING}
      itemData={data}
      width={width}
      height={height}
      {...scroll}
    >
      {NappletGridRow}
    </List>
  );
}

export default function AppStoreView() {
  const installed = useInstalledNapplets();
  const installedAddresses = useMemo(() => new Set(installed.map((napplet) => napplet.address)), [installed]);
  const relays = useReadRelays();
  const { graph, version } = useSocialGraph();
  const search = useRouteSearchValue("q", "");
  const source = useRouteSearchValue("source", "global");
  const type = useRouteSearchValue("type");
  const hashtag = useRouteSearchValue("t");
  const sortParam = useRouteSearchValue("sort", "recent");
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam.value)
    ? (sortParam.value as SortMode)
    : "recent";

  // Community is the global feed narrowed to the social graph below
  const isCommunity = source.value === "community";
  const noop = useCallback(() => {}, []);
  const { filter } = usePeopleListSelect(isCommunity ? "global" : source.value, noop);

  const eventFilter = useCallback(
    (event: NostrEvent) =>
      isValidNappletStoreEvent(event) && (!isCommunity || graph.getFollowDistance(event.pubkey) <= COMMUNITY_DISTANCE),
    // aislop-ignore-next-line react-hooks/exhaustive-deps -- the graph is mutated in place, so version is the only signal that follow distances changed
    [isCommunity, graph, version],
  );

  const baseQuery = useMemo(() => filter && { ...filter, kinds: [NAPPLET_KIND_ROOT, NAPPLET_KIND_NAMED] }, [filter]);
  const query = useMemo(
    () => baseQuery && (hashtag.value ? { ...baseQuery, "#t": [hashtag.value] } : baseQuery),
    [baseQuery, hashtag.value],
  );
  const { loader, timeline } = useTimelineLoader(`${source.value}-napplet-store`, relays, query, { eventFilter });
  const callback = useTimelineCurserIntersectionCallback(loader);

  // Hashtag and type options come from every loaded napplet, so picking one does not hide the rest
  const available = useTimelineEvents(baseQuery, eventFilter);
  const hashtags = useMemo(() => {
    const top = countValues(available, getNappletHashtags).slice(0, MAX_HASHTAGS);
    return hashtag.value && !top.includes(hashtag.value) ? [hashtag.value, ...top] : top;
  }, [available, hashtag.value]);
  const types = useMemo(() => countValues(available, getNappletTypes), [available]);

  const engagement = useNappletEngagement(timeline, relays);
  const filtersDrawer = useDisclosure();
  const hasFilters = source.value !== "global" || !!type.value || !!hashtag.value || sort !== "recent";

  const napplets = useMemo(() => {
    let events = type.value ? timeline.filter((event) => getNappletTypes(event).includes(type.value!)) : timeline;

    const term = search.value.trim();
    if (term) {
      const matches = new Set(matchSorter(events, term, { keys: [(event) => getNappletSearchValues(event)] }));
      events = events.filter((event) => matches.has(event));
    }

    return sortNapplets(events, sort, engagement);
  }, [timeline, type.value, search.value, sort, engagement]);

  const sourceSelect = (
    <DiscoverSourceSelect value={source.value} onChange={(value) => source.setValue(value, false)} />
  );
  const typeSelect = types.length > 0 && (
    <Select value={type.value ?? ""} onChange={(e) => type.setValue(e.target.value || null, false)}>
      <option value="">All types</option>
      {types.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </Select>
  );
  const sortSelect = (
    <Select
      value={sort}
      onChange={(e) => sortParam.setValue(e.target.value === "recent" ? null : e.target.value, false)}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
  return (
    <SimpleView
      title="App Store"
      scroll={false}
      flush
      gap="0"
      actions={
        <IconButton
          icon={<FilterFunnel02 boxSize={5} />}
          aria-label="Filters"
          ms="auto"
          colorScheme={hasFilters ? "primary" : undefined}
          onClick={filtersDrawer.onOpen}
        />
      }
    >
      <Drawer isOpen={filtersDrawer.isOpen} onClose={filtersDrawer.onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" gap="4">
            <FormControl>
              <FormLabel>Source</FormLabel>
              {sourceSelect}
            </FormControl>
            {typeSelect && (
              <FormControl>
                <FormLabel>Type</FormLabel>
                {typeSelect}
              </FormControl>
            )}
            <FormControl>
              <FormLabel>Sort</FormLabel>
              {sortSelect}
            </FormControl>
            {hashtags.length > 0 && (
              <FormControl>
                <FormLabel>Hashtags</FormLabel>
                <HashtagFilter
                  hashtags={hashtags}
                  selected={hashtag.value}
                  onSelect={(t) => hashtag.setValue(t, false)}
                />
              </FormControl>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box p="2">
        <Input
          type="search"
          value={search.value}
          onChange={(e) => search.setValue(e.target.value || null)}
          placeholder="Search apps"
        />
      </Box>

      {napplets.length === 0 ? (
        <Text color="GrayText" px="2">
          No apps found.
        </Text>
      ) : (
        <IntersectionObserverProvider callback={callback}>
          <Box flex={1} minH="0" mx="2">
            <AutoSizer>
              {({ width, height }) => (
                <NappletGridList
                  napplets={napplets}
                  installedAddresses={installedAddresses}
                  engagement={engagement}
                  width={width}
                  height={height}
                />
              )}
            </AutoSizer>
          </Box>
        </IntersectionObserverProvider>
      )}
    </SimpleView>
  );
}
