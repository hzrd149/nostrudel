import { Center, CenterProps, Image } from "@chakra-ui/react";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import { getNappletIcon, getNappletServers, getNappletTitle, NappletIcon } from "../../helpers/nostr/napplets";
import PuzzlePiece01 from "../icons/puzzle-piece-01";

async function fetchVerifiedIcon(icon: NappletIcon, servers: string[]) {
  for (const server of servers) {
    try {
      const res = await fetch(new URL(icon.sha256, server.endsWith("/") ? server : server + "/"));
      if (!res.ok) continue;

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytesToHex(sha256(bytes)) !== icon.sha256) continue;

      // NIP-5D: the bytes must decode as the declared format, not just match the hash
      const blob = new Blob([bytes], { type: icon.type });
      (await createImageBitmap(blob)).close();

      return blob;
    } catch {
      // A failing server falls through to the next hint, then to the generic icon
      continue;
    }
  }
}

/** A napplet's NIP-5D icon, rendered only from hash-verified bytes, with generic artwork as the fallback. */
export default function NappletIconImage({ event, ...props }: { event: NostrEvent } & CenterProps) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    const icon = getNappletIcon(event);
    if (!icon) return;

    let url: string | undefined;
    let cancelled = false;
    fetchVerifiedIcon(icon, getNappletServers(event)).then((blob) => {
      if (!blob || cancelled) return;
      url = URL.createObjectURL(blob);
      setSrc(url);
    });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setSrc(undefined);
    };
  }, [event]);

  return (
    <Center borderRadius="xl" overflow="hidden" bg="var(--chakra-colors-chakra-subtle-bg)" flexShrink={0} {...props}>
      {src ? (
        <Image src={src} alt={getNappletTitle(event)} w="full" h="full" objectFit="cover" />
      ) : (
        <PuzzlePiece01 boxSize="50%" color="GrayText" />
      )}
    </Center>
  );
}
