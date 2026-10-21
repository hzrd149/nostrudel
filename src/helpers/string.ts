export function truncateId(str: string, keep = 4) {
  if (str.length < keep * 2 + 3) return str;
  return str.substring(0, keep) + "…" + str.substring(str.length - keep);
}
