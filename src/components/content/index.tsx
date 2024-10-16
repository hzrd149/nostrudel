import { Text } from "@chakra-ui/react";
import { ComponentMap } from "applesauce-react";

import Mention from "./mention";
import Cashu from "./cashu";

export const components: ComponentMap = {
  text: ({ node }) => <Text as="span">{node.value}</Text>,
  mention: Mention,
  cashu: Cashu,
};
