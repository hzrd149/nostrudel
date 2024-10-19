import { lazy } from "react";
import { Text } from "@chakra-ui/react";
import { ComponentMap } from "applesauce-react";

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
};
