import { lazy } from "react";
import { Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ComponentMap } from "applesauce-react/hooks";

import Mention from "./components/mention";
import Cashu from "./components/cashu";
import { InlineEmoji } from "./components/ininle-emoji";
import NipDefinition from "./components/nip";
import { ImageGallery } from "./components/gallery";
import LightningInvoice from "./components/lightning";
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
  nip: NipDefinition,
  gallery: ({ node }) => <ImageGallery images={node.links} />,
  lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
};
