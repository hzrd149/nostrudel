import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import { Alert, Button, Flex, Spacer, Table, TableContainer, Tbody, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { generatePrivateKey, getPublicKey } from "nostr-tools";

import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { NostrEvent } from "../../types/nostr-event";
import { TORRENT_KIND, validateTorrent } from "../../helpers/nostr/torrents";
import useSubject from "../../hooks/use-subject";
import TorrentTableRow from "./components/torrent-table-row";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import useCurrentAccount from "../../hooks/use-current-account";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import accountService from "../../services/account";
import signingService from "../../services/signing";
import CategorySelect from "./components/category-select";

function Warning() {
  const navigate = useNavigate();
  const toast = useToast();
  const account = useCurrentAccount()!;
  const metadata = useUserMetadata(account.pubkey);
  const [loading, setLoading] = useState(false);
  const createAnonAccount = async () => {
    setLoading(true);
    try {
      const secKey = generatePrivateKey();
      const encrypted = await signingService.encryptSecKey(secKey);
      const pubkey = getPublicKey(secKey);
      accountService.addAccount({ ...encrypted, pubkey, readonly: false });
      accountService.switchAccount(pubkey);
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
  const { relays } = useRelaySelectionContext();
  const [params, setParams] = useSearchParams();
  const tags = params.get("tags")?.split(",") ?? [];

  const handleTagsChange = useCallback<ChangeEventHandler<HTMLSelectElement>>(
    (e) => {
      const newParams = new URLSearchParams(params);
      if (e.target.value) newParams.set("tags", e.target.value);
      else newParams.delete("tags");
      setParams(newParams, { replace: true });
    },
    [params],
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
  const query = useMemo(
    () => (tags.length > 0 ? { ...filter, kinds: [TORRENT_KIND], "#t": tags } : { ...filter, kinds: [TORRENT_KIND] }),
    [tags.join(",")],
  );
  const timeline = useTimelineLoader(`${listId}-torrents`, relays, query, { eventFilter, enabled: !!filter });

  const torrents = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const account = useCurrentAccount();

  return (
    <VerticalPageLayout>
      {!!account && <Warning />}
      <Flex gap="2">
        <RelaySelectionButton />
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
            <Tbody>
              {torrents.map((torrent) => (
                <TorrentTableRow key={torrent.id} torrent={torrent} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function TorrentsView() {
  return (
    <RelaySelectionProvider>
      <PeopleListProvider>
        <TorrentsPage />
      </PeopleListProvider>
    </RelaySelectionProvider>
  );
}
