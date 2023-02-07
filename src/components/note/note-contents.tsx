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

const embeds: {
  regexp: RegExp;
  render: (match: RegExpMatchArray, event?: NostrEvent, trusted?: boolean) => JSX.Element | string;
  isMedia: boolean;
}[] = [
  // Lightning Invoice
  {
    regexp: /(lightning:)?(LNBC[A-Za-z0-9]+)/im,
    render: (match) => <InlineInvoiceCard paymentRequest={match[2]} />,
    isMedia: false,
  },
  // Twitter tweet
  {
    regexp: /^https?:\/\/twitter\.com\/(?:\#!\/)?(\w+)\/status(es)?\/(\d+)[^\s]+/im,
    render: (match) => <TweetEmbed href={match[0]} conversation={false} />,
    isMedia: true,
  },
  // Youtube Video
  {
    regexp:
      /https?:\/\/(?:(?:www|m)\.)?((?:youtube\.com|youtu\.be))(\/(?:[\w\-]+\?v=|embed\/|v\/|live\/)?)([\w\-]+)(\S+)?/im,
    render: (match) => (
      <AspectRatio ratio={16 / 10} maxWidth="30rem">
        <iframe
          src={`https://www.youtube.com/embed/${match[3]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          width="100%"
        ></iframe>
      </AspectRatio>
    ),
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
    isMedia: true,
  },
  // Tidal
  {
    regexp: /https?:\/\/tidal\.com(\/browse)?\/track\/(\d+)/im,
    render: (match) => (
      <iframe
        src={`https://embed.tidal.com/tracks/${match[2]}?disableAnalytics=true`}
        width="100%"
        height="96"
      ></iframe>
    ),
    isMedia: true,
  },
  // Spotify
  {
    regexp: /https?:\/\/open\.spotify\.com\/(track|episode)\/(\w+)[^\s]+/im,
    render: (match) => (
      <iframe
        style={{ borderRadius: "12px" }}
        width="100%"
        height="152"
        title="Spotify Embed: Beethoven - Fur Elise - Komuz Remix"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        src={`https://open.spotify.com/embed/${match[1]}/${match[2]}`}
      ></iframe>
    ),
    isMedia: true,
  },
  // apple music
  {
    regexp: /https?:\/\/music\.apple\.com\/[^\s]+/im,
    render: (match) => (
      <iframe
        allow="encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        height="175"
        style={{ width: "100%", maxWidth: "660px", overflow: "hidden", background: "transparent" }}
        // sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src={match[0].replace("music.apple.com", "embed.music.apple.com")}
      ></iframe>
    ),
    isMedia: true,
  },
  // Image
  {
    regexp: /(https?:\/\/)([\da-z\.-]+\.[a-z\.]{2,6})([\/\w\.-]+\.(svg|gif|png|jpg|jpeg|webp|avif))[^\s]*/im,
    render: (match, event, trusted) => {
      const ImageComponent = trusted || !settings.blurImages.value ? Image : BlurredImage;
      return <ImageComponent src={match[0]} width="100%" maxWidth="30rem" />;
    },
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
    isMedia: true,
  },
  // Link
  {
    regexp: /(https?:\/\/[^\s]+)/im,
    render: (match) => (
      <Link color="blue.500" href={match[0]} target="_blank">
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

const MediaEmbed = ({ children }: { children: JSX.Element | string }) => {
  const [show, setShow] = useState(settings.autoShowMedia.value);

  return show ? (
    <>{children}</>
  ) : (
    <ButtonGroup size="sm" isAttached variant="outline">
      <Button onClick={() => setShow(true)}>Show Embed</Button>
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
      const embed = embedType.isMedia ? <MediaEmbed>{embedRender}</MediaEmbed> : embedRender;

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
