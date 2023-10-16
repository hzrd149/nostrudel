import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import { InlineInvoiceCard } from "../inline-invoice-card";

export function embedLightningInvoice(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Lightning Invoice",
    regexp: /(lightning:)?(LNBC[A-Za-z0-9]+)/gim,
    render: (match) => <InlineInvoiceCard paymentRequest={match[2]} zIndex={1} position="relative" />,
  });
}
