import { lazy } from "react";
import { Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ComponentMap } from "applesauce-react/hooks";

import Mention from "./mention";
import Cashu from "./cashu";
import { InlineEmoji } from "./ininle-emoji";
const InlineFedimintCard = lazy(() => import("../fedimint/inline-fedimint-card"));

export const components: ComponentMap = {
  text: ({ node }) => <Text as="span">{node.value}</Text>,
  mention: Mention,
  cashu: Cashu,
  fedimint: ({ node }) => <InlineFedimintCard token={node.token} />,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: ({ node }) => (
    <Link as={RouterLink} to={`/t/${node.hashtag}`} color="blue.500">
      #{node.name}
    </Link>
  ),
};
