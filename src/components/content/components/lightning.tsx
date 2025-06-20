import InlineInvoiceCard from "../../lightning/inline-invoice-card";
import ExpandableEmbed from "./content-embed";

export default function LightningInvoice({ invoice }: { invoice: string }) {
  return (
    <ExpandableEmbed label="Invoice" url={`lightning:` + invoice} hideOnDefaultOpen>
      <InlineInvoiceCard paymentRequest={invoice} zIndex={1} position="relative" />
    </ExpandableEmbed>
  );
}
