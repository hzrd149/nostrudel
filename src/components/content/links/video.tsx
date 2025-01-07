import { lazy, VideoHTMLAttributes } from "react";
import styled from "@emotion/styled";

import { isStreamURL, isVideoURL } from "../../../helpers/url";
import useAppSettings from "../../../hooks/use-user-app-settings";
import useElementTrustBlur from "../../../hooks/use-element-trust-blur";
import ExpandableEmbed from "../components/expandable-embed";
const LiveVideoPlayer = lazy(() => import("../../live-video-player"));

const StyledVideo = styled.video`
  max-width: 30rem;
  max-height: 20rem;
  width: 100%;
  position: relative;
  z-index: 1;
`;

export function TrustVideo({ src, ...props }: { src: string } & VideoHTMLAttributes<HTMLVideoElement>) {
  const { blurImages } = useAppSettings();
  const { onClick, handleEvent, style } = useElementTrustBlur();

  return (
    <StyledVideo
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

  return (
    <ExpandableEmbed label="Video" url={match} hideOnDefaultOpen>
      <TrustVideo src={match.toString()} />
    </ExpandableEmbed>
  );
}

export function renderStreamUrl(match: URL) {
  if (!isStreamURL(match)) return null;

  return (
    <ExpandableEmbed label="Video" url={match} hideOnDefaultOpen>
      <LiveVideoPlayer stream={match.toString()} maxW="md" maxH="md" />
    </ExpandableEmbed>
  );
}
