import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import { Alert, Button, Flex, Spacer, Table, TableContainer, Tbody, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { SimpleAccount } from "applesauce-accounts/accounts";
import { generateSecretKey, NostrEvent } from "nostr-tools";

import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { TORRENT_KIND, validateTorrent } from "../../helpers/nostr/torrents";
import TorrentTableRow from "./components/torrent-table-row";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useAccountManager, useActiveAccount } from "applesauce-react/hooks";
import useUserProfile from "../../hooks/use-user-profile";
import CategorySelect from "./components/category-select";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { useReadRelays } from "../../hooks/use-client-relays";

function Warning() {
  const navigate = useNavigate();
  const toast = useToast();
  const account = useActiveAccount()!;
  const metadata = useUserProfile(account.pubkey);
  const [loading, setLoading] = useState(false);

  const manager = useAccountManager();
  const createAnonAccount = async () => {
    setLoading(true);
    try {
      const account = SimpleAccount.fromKey(generateSecretKey());
      manager.addAccount(account);
      manager.setActive(account);
      navigate("/relays");
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  return (
    !!metadata && (
      <Alert status="warning" flexWrap="wrap">
        There are many jurisdictions where Torrenting is illegal, You should probably not use your personal nostr
        account.
        <Button onClick={createAnonAccount} variant="link" ml="auto" isLoading={loading}>
          Create anon account
        </Button>
      </Alert>
    )
  );
}

function TorrentsPage() {
  const { filter, listId } = usePeopleListContext();
  const relays = useReadRelays();
  const tagsParam = useRouteSearchValue("tags");
  const tags = tagsParam.value?.split(",") ?? [];

  const handleTagsChange = useCallback<ChangeEventHandler<HTMLSelectElement>>(
    (e) => {
      if (e.target.value) tagsParam.setValue(e.target.value);
      else tagsParam.clearValue();
    },
    [tagsParam.setValue, tagsParam.clearValue],
  );

  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (muteFilter(e)) return false;
      if (!validateTorrent(e)) return false;
      if (tags.length > 0 && tags.some((t) => !e.tags.some((e) => e[1] === t))) return false;
      return true;
    },
    [muteFilter, tags.join(",")],
  );
  const query = useMemo(() => {
    if (!filter) return undefined;
    if (tags.length > 0) return { ...filter, kinds: [TORRENT_KIND], "#t": tags };
    else return { ...filter, kinds: [TORRENT_KIND] };
  }, [tags.join(","), filter]);
  const { loader, timeline: torrents } = useTimelineLoader(`${listId || "global"}-torrents`, relays, query, {
    eventFilter,
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  const account = useActiveAccount();

  return (
    <VerticalPageLayout>
      {!!account && <Warning />}
      <Flex gap="2">
        <PeopleListSelection />
        <CategorySelect maxW="xs" value={tags.join(",")} onChange={handleTagsChange} />
        <Spacer />
        <Button as={RouterLink} to="/torrents/new">
          New Torrent
        </Button>
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Tags</Th>
                <Th>Name</Th>
                <Th>Uploaded</Th>
                <Th>Size</Th>
                <Th>From</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>{torrents?.map((torrent) => <TorrentTableRow key={torrent.id} torrent={torrent} />)}</Tbody>
          </Table>
        </TableContainer>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function TorrentsView() {
  return (
    <PeopleListProvider>
      <TorrentsPage />
    </PeopleListProvider>
  );
}
