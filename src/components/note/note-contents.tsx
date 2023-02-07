import React, { useState } from "react";
import {
  AspectRatio,
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Image,
  ImageProps,
  Link,
  useDisclosure,
} from "@chakra-ui/react";
import { InlineInvoiceCard } from "../inline-invoice-card";
import { TweetEmbed } from "../tweet-embed";
import { UserLink } from "../user-link";
import { normalizeToHex } from "../../helpers/nip-19";
import { NostrEvent } from "../../types/nostr-event";
import { NoteLink } from "../note-link";
import settings from "../../services/settings";
// import { ExternalLinkIcon } from "../icons";

const BlurredImage = (props: ImageProps) => {
  const { isOpen, onToggle } = useDisclosure();
  return <Image onClick={onToggle} cursor="pointer" filter={isOpen ? "" : "blur(1.5rem)"} {...props} />;
};

type EmbedType = {
  regexp: RegExp;
  render: (match: RegExpMatchArray, event?: NostrEvent, trusted?: boolean) => JSX.Element | string;
  name?: string;
  isMedia: boolean;
};

const embeds: EmbedType[] = [
  // Lightning Invoice
  {
    regexp: /(lightning:)?(LNBC[A-Za-z0-9]+)/im,
    render: (match) => <InlineInvoiceCard paymentRequest={match[2]} />,
    name: "Lightning Invoice",
    isMedia: false,
  },
  // Twitter tweet
  {
    regexp: /^https?:\/\/twitter\.com\/(?:\#!\/)?(\w+)\/status(es)?\/(\d+)[^\s]+/im,
    render: (match) => <TweetEmbed href={match[0]} conversation={false} />,
    name: "Tweet",
    isMedia: true,
  },
  // Youtube Playlist
  // note12vqqte3gtd729gp65tgdk0a8yym5ynwqjuhk5s6l333yethlvlcsqptvmk
  {
    regexp: /https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com|youtu\.be)\/(?:playlist\?list=)([\w\-]+)(\S+)?/im,
    render: (match) => (
      <AspectRatio ratio={560 / 315} maxWidth="30rem">
        <iframe
          // width="560"
          // height="315"
          width="100%"
          height="100%"
          src={`https://www.youtube-nocookie.com/embed/videoseries?list=${match[1]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </AspectRatio>
    ),
    name: "Youtube Playlist",
    isMedia: true,
  },
  // Youtube Video
  // note1apu56y4h2ms5uwpzz209vychr309kllhq6wz46te84u9rus5x7kqj5f5n9
  {
    regexp:
      /https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com|youtu\.be)(\/(?:[\w\-]+\?v=|embed\/|v\/|live\/)?)([\w\-]+)(\S+)?/im,
    render: (match) => (
      <AspectRatio ratio={16 / 10} maxWidth="30rem">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${match[2]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          width="100%"
        ></iframe>
      </AspectRatio>
    ),
    name: "Youtube Video",
    isMedia: true,
  },
  // Youtube Music
  {
    regexp: /https?:\/\/music\.youtube\.com\/watch\?v=(\w+)[^\s]+/,
    render: (match) => (
      <AspectRatio ratio={16 / 10} maxWidth="30rem">
        <iframe
          width="100%"
          src={`https://youtube.com/embed/${match[1]}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </AspectRatio>
    ),
    name: "Youtube Music",
    isMedia: true,
  },
  // Tidal
  // note132m5xc3zhj7fap67vzwx5x3s8xqgz49k669htcn8kppr4m654tuq960tuu
  {
    regexp: /https?:\/\/tidal\.com(\/browse)?\/(track|album)\/(\d+)/im,
    render: (match) => (
      <iframe
        src={`https://embed.tidal.com/${match[2]}s/${match[3]}?disableAnalytics=true`}
        width="100%"
        height={match[2] === "album" ? 400 : 96}
      ></iframe>
    ),
    name: "Tidal",
    isMedia: true,
  },
  // Spotify
  // note12xt2pjpwp6gec95p4cw0qzecy764f8wzgcl3z2ufkrkne4t5d2zse3ze78
  {
    regexp: /https?:\/\/open\.spotify\.com\/(track|episode|album)\/(\w+)[^\s]+/im,
    render: (match) => (
      <iframe
        style={{ borderRadius: "12px" }}
        width="100%"
        height={match[1] === "album" ? 400 : 152}
        title="Spotify Embed: Beethoven - Fur Elise - Komuz Remix"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        src={`https://open.spotify.com/embed/${match[1]}/${match[2]}`}
      ></iframe>
    ),
    name: "Spotify",
    isMedia: true,
  },
  // apple music
  // note1tvqk2mu829yr6asf7w5dgpp8t0mlp2ax5t26ctfdx8m0ptkssamqsleeux
  // note1ygx9tec3af92704d92jwrj3zs7cws2jl29yvrlxzqlcdlykhwssqpupa7t
  {
    regexp: /https?:\/\/music\.apple\.com\/[^\s]+/im,
    render: (match) => (
      <iframe
        allow="encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        height={match[0].includes("?i=") ? 175 : 450}
        style={{ width: "100%", maxWidth: "660px", overflow: "hidden", background: "transparent" }}
        // sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src={match[0].replace("music.apple.com", "embed.music.apple.com")}
      ></iframe>
    ),
    name: "Apple Music",
    isMedia: true,
  },
  // Image
  {
    regexp: /(https?:\/\/)([\da-z\.-]+\.[a-z\.]{2,6})([\/\w\.-]+\.(svg|gif|png|jpg|jpeg|webp|avif))[^\s]*/im,
    render: (match, event, trusted) => {
      const ImageComponent = trusted || !settings.blurImages.value ? Image : BlurredImage;
      return <ImageComponent src={match[0]} width="100%" maxWidth="30rem" />;
    },
    name: "Image",
    isMedia: true,
  },
  // Video
  {
    regexp: /(https?:\/\/)([\da-z\.-]+\.[a-z\.]{2,6})([\/\w\.-]+\.(mp4|mkv|webm|mov))[^\s]*/im,
    render: (match) => (
      <AspectRatio ratio={16 / 9} maxWidth="30rem">
        <video src={match[0]} controls />
      </AspectRatio>
    ),
    name: "Video",
    isMedia: true,
  },
  // Link
  {
    regexp: /(https?:\/\/[^\s]+)/im,
    render: (match) => (
      <Link color="blue.500" href={match[0]} target="_blank" isExternal>
        {match[0]}
      </Link>
    ),
    isMedia: false,
  },
  // npub1 and note1 links
  {
    regexp: /@?((npub1|note1)[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/m,
    render: (match) => {
      switch (match[2]) {
        case "npub1":
          const id = normalizeToHex(match[1]);
          return id ? <UserLink color="blue.500" pubkey={id} /> : match[0];
        default:
          return match[0];
      }
    },
    isMedia: false,
  },
  // Nostr Mention Links
  {
    regexp: /#\[(\d+)\]/,
    render: (match, event) => {
      const index = parseInt(match[1]);
      const tag = event?.tags[index];

      if (tag) {
        if (tag[0] === "p" && tag[1]) {
          return <UserLink color="blue.500" pubkey={tag[1]} />;
        }
        if (tag[0] === "e" && tag[1]) {
          return <NoteLink color="blue.500" noteId={tag[1]} />;
        }
      }

      return match[0];
    },
    isMedia: false,
  },
  // bold text
  {
    regexp: /\*\*([^\n]+)\*\*/im,
    render: (match) => <span style={{ fontWeight: "bold" }}>{match[1]}</span>,
    isMedia: false,
  },
];

const MediaEmbed = ({ children, type }: { children: JSX.Element | string; type: EmbedType }) => {
  const [show, setShow] = useState(settings.autoShowMedia.value);

  return show ? (
    <>{children}</>
  ) : (
    <ButtonGroup size="sm" isAttached variant="outline">
      <Button onClick={() => setShow(true)}>Show {type.name ?? "Embed"}</Button>
      {/* TODO: add external link for embed */}
      {/* <IconButton as="a" aria-label="Add to friends" icon={<ExternalLinkIcon />} href={}/> */}
    </ButtonGroup>
  );
};

function embedContent(content: string, event?: NostrEvent, trusted: boolean = false): (string | JSX.Element)[] {
  for (const embedType of embeds) {
    const match = content.match(embedType.regexp);

    if (match && match.index !== undefined) {
      const before = content.slice(0, match.index);
      const after = content.slice(match.index + match[0].length, content.length);
      const embedRender = embedType.render(match, event, trusted);
      const embed = embedType.isMedia ? <MediaEmbed type={embedType}>{embedRender}</MediaEmbed> : embedRender;

      return [...embedContent(before, event, trusted), embed, ...embedContent(after, event, trusted)];
    }
  }
  return [content];
}

export type NoteContentsProps = {
  event: NostrEvent;
  trusted?: boolean;
};

export const NoteContents = React.memo(({ event, trusted }: NoteContentsProps) => {
  const parts = embedContent(event.content, event, trusted ?? false);

  return (
    <Box whiteSpace="pre-wrap">
      {parts.map((part, i) => (
        <span key={"part-" + i}>{part}</span>
      ))}
    </Box>
  );
});
