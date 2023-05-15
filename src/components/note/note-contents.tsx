import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import styled from "@emotion/styled";
import { useExpand } from "./expanded";
import { EmbedableContent } from "../../helpers/embeds";
import {
  embedTweet,
  embedLightningInvoice,
  embedImages,
  embedVideos,
  embedLinks,
  embedSpotifyMusic,
  embedTidalMusic,
  embedYoutubeVideo,
  embedYoutubePlaylist,
  embedYoutubeMusic,
  embedNostrLinks,
  embedNostrMentions,
  embedAppleMusic,
  embedNostrHashtags,
} from "../embed-types";
import { ImageGalleryProvider } from "../image-gallery";

function buildContents(event: NostrEvent | DraftNostrEvent, trusted: boolean = false) {
  let content: EmbedableContent = [event.content];

  content = embedLightningInvoice(content);
  content = embedTweet(content);
  content = embedYoutubeVideo(content);
  content = embedYoutubePlaylist(content);
  content = embedYoutubeMusic(content);
  content = embedTidalMusic(content);
  content = embedAppleMusic(content);
  content = embedSpotifyMusic(content);

  // common
  content = embedImages(content, trusted);
  content = embedVideos(content);
  content = embedLinks(content);

  // nostr
  content = embedNostrLinks(content, event);
  content = embedNostrMentions(content, event);
  content = embedNostrHashtags(content, event);

  return content;
}

const GradientOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, var(--chakra-colors-chakra-body-bg) 100%);
  cursor: pointer;
`;

export type NoteContentsProps = {
  event: NostrEvent | DraftNostrEvent;
  trusted?: boolean;
  maxHeight?: number;
};

export const NoteContents = React.memo(({ event, trusted, maxHeight }: NoteContentsProps) => {
  const content = buildContents(event, trusted ?? false);
  const expand = useExpand();
  const [innerHeight, setInnerHeight] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const testHeight = useCallback(() => {
    if (ref.current && maxHeight) {
      const rect = ref.current.getClientRects()[0];
      setInnerHeight(rect.height);
    }
  }, [maxHeight]);

  useEffect(() => {
    testHeight();
  }, [testHeight]);

  const showOverlay = !!maxHeight && !expand?.expanded && innerHeight > maxHeight;

  return (
    <ImageGalleryProvider>
      <Box
        whiteSpace="pre-wrap"
        maxHeight={!expand?.expanded ? maxHeight : undefined}
        position="relative"
        overflow={maxHeight && !expand?.expanded ? "hidden" : "initial"}
        onLoad={() => testHeight()}
        px="2"
      >
        <div ref={ref}>
          {content.map((part, i) =>
            typeof part === "string" ? (
              <Text as="span" key={"part-" + i}>
                {part}
              </Text>
            ) : (
              React.cloneElement(part, { key: "part-" + i })
            )
          )}
        </div>
        {showOverlay && <GradientOverlay onClick={expand?.onExpand} />}
      </Box>
    </ImageGalleryProvider>
  );
});
