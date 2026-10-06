import styled from "@emotion/styled";
import { SyntheticEvent } from "react";

import { pauseOthers } from "../../../helpers/media";
import { isAudioURL } from "../../../helpers/url";
import ExpandableEmbed from "../components/content-embed";

const StyledAudio = styled.audio`
  max-width: 30rem;
  max-height: 20rem;
  width: 100%;
  position: relative;
  z-index: 1;
`;

/** Only one audio embed should play at a time, even across notes. Other players (live, video) are left alone */
function pauseOtherAudio(e: SyntheticEvent<HTMLAudioElement>) {
  pauseOthers(e.currentTarget, document.querySelectorAll<HTMLAudioElement>("audio[data-audio-embed]"));
}

export function renderAudioUrl(match: URL) {
  if (!isAudioURL(match)) return null;

  return (
    <ExpandableEmbed label="Audio" url={match}>
      <StyledAudio controls data-audio-embed="" onPlay={pauseOtherAudio}>
        <source src={match.toString()} />
      </StyledAudio>
    </ExpandableEmbed>
  );
}
