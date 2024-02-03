import { CashuMint } from "@cashu/cashu-ts";

const mints = new Map<string, CashuMint>();

export async function getMint(url: string) {
  const formatted = new URL(url).toString();
  if (!mints.has(formatted)) {
    const mint = new CashuMint(formatted);
    mints.set(formatted, mint);
  }
  return mints.get(formatted)!;
}
