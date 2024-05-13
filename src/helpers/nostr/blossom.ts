/** @deprecated */
export function isServerTag(tag: string[]) {
  return (tag[0] === "r" || tag[0] === "server") && tag[1];
}
