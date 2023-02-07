import {
  decode,
  Section,
  AmountSection,
  DescriptionSection,
} from "light-bolt11-decoder";

export type ParsedInvoice = {
  paymentRequest: string;
  description: string;
  amount?: number;
};

function isDescription(section: Section): section is DescriptionSection {
  return section.name === "description";
}
function isAmount(section: Section): section is AmountSection {
  return section.name === "amount";
}

export function parsePaymentRequest(paymentRequest: string): ParsedInvoice {
  const decoded = decode(paymentRequest);

  return {
    paymentRequest: decoded.paymentRequest,
    description: decoded.sections.find(isDescription)?.value ?? "",
    amount: decoded.sections.find(isAmount)?.value,
  };
}

export function getReadableAmount(amount: number) {
  const amountInSats = amount / 1000;
  if (amountInSats > 1000000) {
    return `${amountInSats / 1000000}M sats`;
  } else if (amountInSats > 1000) {
    return `${amountInSats / 1000}K sats`;
  } else return `${amountInSats} sats`;
}
