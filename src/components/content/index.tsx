import { Text } from "@chakra-ui/react";
import { ComponentMap } from "applesauce-react";

import Mention from "./mention";

export const components: ComponentMap = {
  text: ({ node }) => <Text as="span">{node.value}</Text>,
  mention: Mention,
};
