import { LinkOverlay } from "@chakra-ui/react";
import styled from "@emotion/styled";

const HoverLinkOverlay = styled(LinkOverlay)`
  &:hover:before {
    background-color: var(--chakra-colors-card-hover-overlay);
  }
`;

export default HoverLinkOverlay;
