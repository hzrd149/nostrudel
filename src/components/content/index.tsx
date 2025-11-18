import { ComponentMap } from "applesauce-react/hooks";

import BipDefinition from "./components/bip";
import Cashu from "./components/cashu";
import { ImageGallery } from "./components/gallery";
import { InlineEmoji } from "./components/ininle-emoji";
import LightningInvoice from "./components/lightning";
import { NostrMentionCard, NostrMentionLink } from "./components/mention";
import NipDefinition from "./components/nip";
import HashtagLink from "./links/hashtag";

export const components: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  mention: NostrMentionCard,
  cashu: Cashu,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: HashtagLink,
  nip: NipDefinition,
  bip: BipDefinition,
  gallery: ({ node }) => <ImageGallery images={node.links} />,
  lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
};

export const onlyLinkComponents: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  mention: NostrMentionLink,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: HashtagLink,
  nip: NipDefinition,
  bip: BipDefinition,
  // Disabled components that do not render a link
  // cashu: Cashu,
  // gallery: ({ node }) => <ImageGallery images={node.links} />,
  // lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
};
