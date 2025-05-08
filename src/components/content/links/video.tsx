import { Box, BoxProps } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { getHashFromURL } from "blossom-client-sdk";
import { lazy, VideoHTMLAttributes } from "react";

import { isStreamURL, isVideoURL } from "../../../helpers/url";
import useElementTrustBlur from "../../../hooks/use-element-trust-blur";
import useAppSettings from "../../../hooks/use-user-app-settings";
import ExpandableEmbed from "../components/expandable-embed";
import { BlobDetailsButton } from "./common";

const LiveVideoPlayer = lazy(() => import("../../live-video-player"));

const StyledVideo = styled.video`
  width: 100%;
  position: relative;
  z-index: 1;
`;

export function TrustVideo({
  src,
  ...props
}: { src: string } & VideoHTMLAttributes<HTMLVideoElement> & Omit<BoxProps, "children">) {
  const { blurImages } = useAppSettings();
  const { onClick, handleEvent, style } = useElementTrustBlur();

  return (
    <Box
      as={StyledVideo}
      src={src}
      controls
      style={blurImages ? style : undefined}
      onClick={blurImages ? onClick : undefined}
      onPlay={blurImages ? handleEvent : undefined}
      {...props}
    />
  );
}

export function renderVideoUrl(match: URL) {
  if (!isVideoURL(match)) return null;

  const hash = getHashFromURL(match);

  return (
    <ExpandableEmbed
      label="Video"
      url={match}
      actions={hash ? <BlobDetailsButton src={match} original={hash} zIndex={1} /> : undefined}
    >
      <TrustVideo src={match.toString()} maxH="lg" w="auto" />
    </ExpandableEmbed>
  );
}

export function renderStreamUrl(match: URL) {
  if (!isStreamURL(match)) return null;

  return (
    <ExpandableEmbed label="Video" url={match}>
      <LiveVideoPlayer stream={match.toString()} maxH="lg" w="auto" />
    </ExpandableEmbed>
  );
}
