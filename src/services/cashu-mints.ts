import { CashuMint, CashuWallet } from "@cashu/cashu-ts";

const wallets = new Map<string, CashuWallet>();

export async function getMintWallet(url: string) {
  const formatted = new URL(url).toString();
  if (!wallets.has(formatted)) {
    const mint = new CashuMint(formatted);
    const wallet = new CashuWallet(mint);
    wallets.set(formatted, wallet);
  }
  return wallets.get(formatted)!;
}
