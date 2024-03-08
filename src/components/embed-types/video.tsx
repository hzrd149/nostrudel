import styled from "@emotion/styled";
import { isVideoURL } from "../../helpers/url";
import useAppSettings from "../../hooks/use-app-settings";
import useElementTrustBlur from "../../hooks/use-element-trust-blur";
import { useTrustContext } from "../../providers/local/trust";

const StyledVideo = styled.video`
  max-width: 30rem;
  max-height: 20rem;
  width: 100%;
  position: relative;
  z-index: 1;
`;

function TrustVideo({ src }: { src: string }) {
  const { blurImages } = useAppSettings();
  const { onClick, handleEvent, style } = useElementTrustBlur();

  return (
    <StyledVideo
      src={src}
      controls
      style={blurImages ? style : undefined}
      onClick={blurImages ? onClick : undefined}
      onPlay={blurImages ? handleEvent : undefined}
    />
  );
}

export function renderVideoUrl(match: URL) {
  if (!isVideoURL(match)) return null;

  return <TrustVideo src={match.toString()} />;
}
