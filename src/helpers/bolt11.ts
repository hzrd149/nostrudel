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
    amount: parseInt(decoded.sections.find(isAmount)?.value ?? "0"),
    timestamp: convertTimestampToDate(timestamp),
    expiry: convertTimestampToDate(timestamp + decoded.expiry),
  };
}

// based on https://stackoverflow.com/a/10469752
export function readablizeSats(sats: number) {
  if (sats === 0) return "0";
  var s = ["", "K", "M"];
  var e = Math.floor(Math.log(sats) / Math.log(1000));
  return Math.round((sats / Math.pow(1000, e)) * 100) / 100 + s[e];
}
