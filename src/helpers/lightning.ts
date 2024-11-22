// based on https://stackoverflow.com/a/10469752
export function humanReadableSats(sats: number) {
  if (sats === 0) return "0";
  var s = ["", "K", "M"];
  var e = Math.floor(Math.log(sats) / Math.log(1000));
  return Math.round((sats / Math.pow(1000, e)) * 100) / 100 + s[e];
}
