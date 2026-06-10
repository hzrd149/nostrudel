import { type ComponentType } from "react";
import { type ComponentMap } from "applesauce-react/hooks";
import { type CashuToken } from "applesauce-content/text/cashu";
import { type LightningInvoice as LightningInvoiceToken } from "applesauce-content/text/lightning";

import BipDefinition from "./components/bip";
import Cashu from "./components/cashu";
import { ImageGallery } from "./components/gallery";
import { InlineEmoji } from "./components/ininle-emoji";
import LightningInvoice from "./components/lightning";
import { NostrMentionCard, NostrMentionLink } from "./components/mention";
import NipDefinition from "./components/nip";
import MoneroAddress from "./components/monero";
import HashtagLink from "./links/hashtag";
import { type BIPToken } from "./transform/bip-notation";
import { type NIPToken } from "./transform/nip-notation";
import { type MoneroAddressToken } from "./transform/monero-address";

type ExtendedComponentMap = ComponentMap & {
  cashu?: ComponentType<{ node: CashuToken }>;
  lightning?: ComponentType<{ node: LightningInvoiceToken }>;
  nip?: ComponentType<{ node: NIPToken }>;
  bip?: ComponentType<{ node: BIPToken }>;
  monero?: ComponentType<{ node: MoneroAddressToken }>;
};

export const components: ExtendedComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  mention: NostrMentionCard,
  cashu: Cashu,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: HashtagLink,
  nip: NipDefinition,
  bip: BipDefinition,
  gallery: ({ node }) => <ImageGallery images={node.links} />,
  lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
  monero: MoneroAddress,
};

export const onlyLinkComponents: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  mention: NostrMentionLink,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: HashtagLink,
  nip: NipDefinition,
  bip: BipDefinition,
  monero: MoneroAddress,
  // Disabled components that do not render a link
  // cashu: Cashu,
  // gallery: ({ node }) => <ImageGallery images={node.links} />,
  // lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
};
