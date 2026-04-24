import { Box, Divider, Heading, Text, VStack } from "@chakra-ui/react";
import {
  DecodeResult,
  encodeDecodeResult,
  getAddressPointerFromATag,
  getContentPointers,
  getEventPointerFromETag,
  getEventPointerFromQTag,
  getProfilePointerFromPTag,
  isATag,
  isETag,
  isPTag,
  isQTag,
} from "applesauce-core/helpers";
import type { ReactNode } from "react";
import { NostrEvent } from "nostr-tools";

import { safeDecode } from "../../../helpers/nip19";
import { getMatchNostrLink } from "../../../helpers/regexp";
import { EmbedEventPointerCard } from "../../embed-event/card";
import UserAvatarLink from "../../user/user-avatar-link";
import UserDnsIdentity from "../../user/user-dns-identity";
import UserLink from "../../user/user-link";

const CONTENT_POINTER_TYPES = new Set<DecodeResult["type"]>(["note", "nevent", "naddr", "npub", "nprofile"]);

function uniqueDecodeResults(pointers: DecodeResult[]) {
  const seen = new Set<string>();
  const out: DecodeResult[] = [];
  for (const p of pointers) {
    if (!CONTENT_POINTER_TYPES.has(p.type)) continue;
    let k: string = encodeDecodeResult(p);
    if (!k) {
      if (p.type === "npub" && typeof p.data === "string") k = `npub:${p.data}`;
      else k = `fallback:${p.type}:${JSON.stringify(p.data)}`;
    }
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

function formatTagLine(tag: string[]) {
  return `[${tag[0]}] ${tag.slice(1).join(", ")}`;
}

function collectContentPointers(content: string) {
  const acc: DecodeResult[] = [];
  for (const p of getContentPointers(content)) {
    acc.push(p);
  }
  for (const m of content.matchAll(getMatchNostrLink())) {
    const bech = m[2];
    if (!bech) continue;
    const d = safeDecode(bech);
    if (d) acc.push(d);
  }
  return uniqueDecodeResults(acc);
}

function TagPointerBlock({ event }: { event: NostrEvent }) {
  const items: { key: string; line: string; content: ReactNode }[] = [];
  let i = 0;

  for (const tag of event.tags) {
    if (isETag(tag)) {
      const pointer = getEventPointerFromETag(tag);
      if (!pointer) continue;
      items.push({
        key: `e-${i++}`,
        line: formatTagLine(tag),
        content: <EmbedEventPointerCard pointer={{ type: "nevent", data: pointer }} variant="outline" />,
      });
    } else if (isATag(tag)) {
      const pointer = getAddressPointerFromATag(tag);
      if (!pointer) continue;
      items.push({
        key: `a-${i++}`,
        line: formatTagLine(tag),
        content: <EmbedEventPointerCard pointer={{ type: "naddr", data: pointer }} variant="outline" />,
      });
    } else if (isPTag(tag)) {
      const pointer = getProfilePointerFromPTag(tag);
      if (!pointer) continue;
      items.push({
        key: `p-${i++}`,
        line: formatTagLine(tag),
        content: <ProfilePointerPreview profile={pointer} />,
      });
    } else if (isQTag(tag)) {
      const pointer = getEventPointerFromQTag(tag);
      if (!pointer) continue;
      items.push({
        key: `q-${i++}`,
        line: formatTagLine(tag),
        content: <EmbedEventPointerCard pointer={{ type: "nevent", data: pointer }} variant="outline" />,
      });
    }
  }

  if (items.length === 0) {
    return (
      <Text color="GrayText" fontSize="sm">
        No e, a, p, or q tag pointers in this event.
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap="3" w="full">
      {items.map(({ key, line, content }) => (
        <Box key={key} borderWidth="1px" borderRadius="md" p="3" w="full">
          <Text fontFamily="monospace" fontSize="sm" color="GrayText" mb="2" wordBreak="break-all" title={line}>
            {line}
          </Text>
          {content}
        </Box>
      ))}
    </VStack>
  );
}

function ProfilePointerPreview({ profile }: { profile: { pubkey: string; relays?: string[] } }) {
  const { pubkey, relays } = profile;
  return (
    <Box display="flex" gap="4" p="0">
      <UserAvatarLink pubkey={pubkey} />
      <Box>
        <UserLink pubkey={pubkey} fontWeight="bold" />
        <br />
        <UserDnsIdentity pubkey={pubkey} />
        {relays && relays.length > 0 && (
          <Text fontSize="xs" color="GrayText" mt="1">
            Relays: {relays.join(", ")}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function DecodedNostrPointerCard({ decoded }: { decoded: DecodeResult }) {
  switch (decoded.type) {
    case "note":
    case "nevent":
    case "naddr":
      return <EmbedEventPointerCard pointer={decoded} variant="outline" />;
    case "npub":
      return <ProfilePointerPreview profile={{ pubkey: decoded.data as string }} />;
    case "nprofile": {
      const d = decoded.data;
      return <ProfilePointerPreview profile={d} />;
    }
    default:
      return null;
  }
}

function ContentPointerList({ event }: { event: NostrEvent }) {
  const unique = collectContentPointers(event.content ?? "");

  if (unique.length === 0) {
    return (
      <Text color="GrayText" fontSize="sm">
        No Nostr (note / nevent / naddr / npub / nprofile) pointers in the event content.
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap="3" w="full">
      {unique.map((decoded) => {
        const label = encodeDecodeResult(decoded) || decoded.type;
        return (
          <Box key={label} borderWidth="1px" borderRadius="md" p="3" w="full">
            <Text fontFamily="monospace" fontSize="sm" color="GrayText" mb="2" wordBreak="break-all">
              {label}
            </Text>
            <DecodedNostrPointerCard decoded={decoded} />
          </Box>
        );
      })}
    </VStack>
  );
}

export default function DebugEventPointersPage({ event }: { event: NostrEvent }) {
  return (
    <VStack align="stretch" gap="6" w="full" maxH="70vh" overflowY="auto" pr="1">
      <Box w="full">
        <Heading size="sm" mb="3">
          Tag pointers
        </Heading>
        <TagPointerBlock event={event} />
      </Box>

      <Divider />

      <Box w="full">
        <Heading size="sm" mb="3">
          Content pointers
        </Heading>
        <ContentPointerList event={event} />
      </Box>
    </VStack>
  );
}
