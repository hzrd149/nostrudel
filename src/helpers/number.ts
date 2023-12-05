// Copied from https://git.v0l.io/Kieran/dtan/src/branch/main/src/const.ts#L220
export const kiB = Math.pow(1024, 1);
export const MiB = Math.pow(1024, 2);
export const GiB = Math.pow(1024, 3);
export const TiB = Math.pow(1024, 4);
export const PiB = Math.pow(1024, 5);
export const EiB = Math.pow(1024, 6);
export const ZiB = Math.pow(1024, 7);
export const YiB = Math.pow(1024, 8);

export function formatBytes(b: number, f?: number) {
  f ??= 2;
  if (b >= YiB) return (b / YiB).toFixed(f) + " YiB";
  if (b >= ZiB) return (b / ZiB).toFixed(f) + " ZiB";
  if (b >= EiB) return (b / EiB).toFixed(f) + " EiB";
  if (b >= PiB) return (b / PiB).toFixed(f) + " PiB";
  if (b >= TiB) return (b / TiB).toFixed(f) + " TiB";
  if (b >= GiB) return (b / GiB).toFixed(f) + " GiB";
  if (b >= MiB) return (b / MiB).toFixed(f) + " MiB";
  if (b >= kiB) return (b / kiB).toFixed(f) + " KiB";
  return b.toFixed(f) + " B";
}
