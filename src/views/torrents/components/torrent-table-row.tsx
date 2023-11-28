import { useMemo, useRef } from "react";
import { ButtonGroup, IconButton, Link, Td, Tr } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { getTorrentMagnetLink, getTorrentSize, getTorrentTitle } from "../../../helpers/nostr/torrents";
import { NostrEvent } from "../../../types/nostr-event";
import Timestamp from "../../../components/timestamp";
import { UserLink } from "../../../components/user-link";
import Magnet from "../../../components/icons/magnet";
import { getNeventCodeWithRelays } from "../../../helpers/nip19";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import { formatBytes } from "../../../helpers/number";
import NoteZapButton from "../../../components/note/note-zap-button";

export default function TorrentTableRow({ torrent }: { torrent: NostrEvent }) {
  const ref = useRef<HTMLTableRowElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(torrent));

  const magnetLink = useMemo(() => getTorrentMagnetLink(torrent), [torrent]);

  return (
    <Tr ref={ref}>
      <Td>
        {torrent.tags
          .filter((t) => t[0] === "t")
          .map((t) => t[1])
          .join(" > ")}
      </Td>
      <Td>
        <Link as={RouterLink} to={`/torrents/${getNeventCodeWithRelays(torrent.id)}`}>
          {getTorrentTitle(torrent)}
        </Link>
      </Td>
      <Td>
        <Timestamp timestamp={torrent.created_at} />
      </Td>
      <Td>{formatBytes(getTorrentSize(torrent))}</Td>
      <Td>
        <UserLink pubkey={torrent.pubkey} tab="torrents" />
      </Td>
      <Td>
        <ButtonGroup variant="ghost" size="xs">
          <IconButton as={Link} icon={<Magnet />} aria-label="Magnet URI" isExternal href={magnetLink} />
          <NoteZapButton event={torrent} />
        </ButtonGroup>
      </Td>
    </Tr>
  );
}
