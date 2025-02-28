import { Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ComponentMap } from "applesauce-react/hooks";

import Mention from "./components/mention";
import Cashu from "./components/cashu";
import { InlineEmoji } from "./components/ininle-emoji";
import { ImageGallery } from "./components/gallery";
import LightningInvoice from "./components/lightning";
import NipDefinition from "./components/nip";
import BipDefinition from "./components/bip";

export const components: ComponentMap = {
  text: ({ node }) => <Text as="span">{node.value}</Text>,
  mention: Mention,
  cashu: Cashu,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: ({ node }) => (
    <Link as={RouterLink} to={`/t/${node.hashtag}`} color="blue.500">
      #{node.name}
    </Link>
  ),
  nip: NipDefinition,
  bip: BipDefinition,
  gallery: ({ node }) => <ImageGallery images={node.links} />,
  lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
};
