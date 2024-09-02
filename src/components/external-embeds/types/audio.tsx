import styled from "@emotion/styled";
import { isAudioURL } from "../../../helpers/url";

const StyledAudio = styled.audio`
  max-width: 30rem;
  max-height: 20rem;
  width: 100%;
  position: relative;
  z-index: 1;
`;

export function renderAudioUrl(match: URL) {
  if (!isAudioURL(match)) return null;

  return (
    <StyledAudio controls>
      <source src={match.toString()} />
    </StyledAudio>
  );
}
