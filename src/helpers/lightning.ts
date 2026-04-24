// based on https://stackoverflow.com/a/10469752
export function humanReadableSats(sats: number) {
  if (sats === 0) return "0";
  const s = ["", "K", "M"];
  const e = Math.floor(Math.log(sats) / Math.log(1000));
  return Math.round((sats / Math.pow(1000, e)) * 100) / 100 + s[e];
}

export function satsToBtc(sats: number) {
  return sats / 100_000_000;
}

export function btcToSats(btc: number) {
  return btc * 100_000_000;
}

export function currencyToSats(value: number, btcRate: number) {
  return btcToSats(value / btcRate);
}

export function formatSats(sats: number) {
  if (!Number.isFinite(sats)) return "0 sats";
  return `${humanReadableSats(sats)} sats`;
}

export function formatSatsAsCurrency(sats: number, currency: string, btcRate: number) {
  if (!Number.isFinite(sats) || !Number.isFinite(btcRate)) return formatSats(sats);

  const value = satsToBtc(sats) * btcRate;

  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch (error) {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  }
}
