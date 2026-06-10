import { Mint, Wallet, GetInfoResponse } from "@cashu/cashu-ts";
import { normalizeURL } from "applesauce-core/helpers";
import { from, Observable, ReplaySubject, share, switchMap } from "rxjs";

const mints = new Map<string, Mint>();
const wallets = new Map<string, Wallet>();

export async function getCashuMint(url: string) {
  const formatted = new URL(url).toString();
  if (!mints.has(formatted)) {
    const mint = new Mint(formatted);
    mints.set(formatted, mint);
  }
  return mints.get(formatted)!;
}

export async function getCashuWallet(url: string, unit = "sat") {
  const formatted = new URL(url).toString();
  const key = `${formatted}:${unit}`;
  if (!wallets.has(key)) {
    const mint = await getCashuMint(url);
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();
    wallets.set(key, wallet);
  }
  return wallets.get(key)!;
}

const mintInfo = new Map<string, Observable<GetInfoResponse>>();
export function cashuMintInfo(mint: string): Observable<GetInfoResponse> {
  mint = normalizeURL(mint);
  const existing = mintInfo.get(mint);
  if (existing) return existing;

  const observable = from(getCashuMint(mint)).pipe(
    // fetch mint info
    switchMap((m) => from(m.getInfo())),
    // share value and keep warm for 2 minutes
    share({
      connector: () => new ReplaySubject(1),
      resetOnRefCountZero: false,
      resetOnComplete: false,
      resetOnError: false,
    }),
  );
  mintInfo.set(mint, observable);
  return observable;
}
