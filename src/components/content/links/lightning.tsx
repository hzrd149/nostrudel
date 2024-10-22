import { EmbedableContent, embedJSX } from "../../../helpers/embeds";
import { InlineInvoiceCard } from "../../lightning/inline-invoice-card";
import ExpandableEmbed from "../components/expandable-embed";

export function renderLightningInvoice(invoice: string) {
  return (
    <ExpandableEmbed label="Invoice" url={`lightning:` + invoice} hideOnDefaultOpen>
      <InlineInvoiceCard paymentRequest={invoice} zIndex={1} position="relative" />
    </ExpandableEmbed>
  );
}

export function embedLightningInvoice(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Lightning Invoice",
    regexp: /(lightning:)?(LNBC[A-Za-z0-9]+)/gim,
    render: (match) => renderLightningInvoice(match[2]),
  });
}
