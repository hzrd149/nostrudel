import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Code, Flex, Spinner, useForceUpdate } from "@chakra-ui/react";
import WebTorrent from "../../lib/webtorrent";
import type { Torrent } from "webtorrent";

import { safeDecode } from "../../helpers/nip19";
import useSingleEvent from "../../hooks/use-single-event";

import { ErrorBoundary } from "../../components/error-boundary";
import { getTorrentMagnetLink } from "../../helpers/nostr/torrents";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { ChevronLeftIcon } from "../../components/icons";
import { NostrEvent } from "../../types/nostr-event";

const client = new WebTorrent();

// @ts-ignore
window.torrentClient = client;

function TorrentPreview({ torrent }: { torrent: Torrent; event: NostrEvent }) {
  const update = useForceUpdate();
  const preview = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    torrent.on("metadata", update);
    torrent.on("ready", update);
    torrent.on("done", update);
    return () => {
      // torrent.off("metadata", update);
    };
  }, [torrent]);

  return (
    <Flex gap="4">
      <Flex direction="column">
        {torrent.files.map((file) => (
          <Button key={file.path}>{file.name}</Button>
        ))}
      </Flex>
      <Code as="pre">{JSON.stringify({ ready: torrent.ready, name: torrent.name }, null, 2)}</Code>
      <div ref={preview} />
    </Flex>
  );
}

function TorrentPreviewPage({ event }: { event: NostrEvent }) {
  const navigate = useNavigate();
  const magnet = getTorrentMagnetLink(event);

  const [torrent, setTorrent] = useState<Torrent>();
  useEffect(() => {
    setTorrent(
      client.add(magnet, (t) => {
        console.log(t);
      }),
    );
    return () => {
      client.remove(magnet);
      setTorrent(undefined);
    };
  }, [magnet]);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Flex>
      {torrent && <TorrentPreview torrent={torrent} event={event} />}
    </VerticalPageLayout>
  );
}

export default function TorrentDetailsView() {
  const { id } = useParams() as { id: string };
  const parsed = useMemo(() => {
    const result = safeDecode(id);
    if (!result) return;
    if (result.type === "note") return { id: result.data };
    if (result.type === "nevent") return result.data;
  }, [id]);
  const torrent = useSingleEvent(parsed?.id, parsed?.relays ?? []);

  if (!torrent) return <Spinner />;

  return (
    <ErrorBoundary>
      <TorrentPreviewPage event={torrent} />
    </ErrorBoundary>
  );
}
