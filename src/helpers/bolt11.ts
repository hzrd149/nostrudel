import { decode, Section, AmountSection, DescriptionSection, TimestampSection } from "light-bolt11-decoder";
import { convertTimestampToDate } from "./date";

export type ParsedInvoice = {
  paymentRequest: string;
  description: string;
  amount?: number;
  timestamp: Date;
  expiry: Date;
};

function isDescription(section: Section): section is DescriptionSection {
  return section.name === "description";
}
function isAmount(section: Section): section is AmountSection {
  return section.name === "amount";
}
function isTimestamp(section: Section): section is TimestampSection {
  return section.name === "timestamp";
}

export function parsePaymentRequest(paymentRequest: string): ParsedInvoice {
  const decoded = decode(paymentRequest);
  const timestamp = decoded.sections.find(isTimestamp)?.value ?? 0;

  return {
    paymentRequest: decoded.paymentRequest,
    description: decoded.sections.find(isDescription)?.value ?? "",
    amount: decoded.sections.find(isAmount)?.value,
    timestamp: convertTimestampToDate(timestamp),
    expiry: convertTimestampToDate(timestamp + decoded.expiry),
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
