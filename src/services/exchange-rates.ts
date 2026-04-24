import { BehaviorSubject } from "rxjs";

import idbKeyValueStore from "./database/kv";
import localSettings from "./preferences";

export type CachedExchangeRates = {
  updatedAt: number;
  rates: Record<string, number>;
};

const EXCHANGE_RATES_KEY = "exchange-rates";

export const exchangeRates$ = new BehaviorSubject<CachedExchangeRates | null>(null);

let refreshPromise: Promise<CachedExchangeRates | null> | null = null;
let endpointInitialized = false;

function parseExchangeRates(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const rates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(value)) {
    if (typeof rate === "number" && Number.isFinite(rate)) rates[currency.toUpperCase()] = rate;
  }

  return Object.keys(rates).length ? rates : null;
}

export async function getCachedExchangeRates() {
  const cached = await idbKeyValueStore.getItem<CachedExchangeRates>(EXCHANGE_RATES_KEY);
  const rates = parseExchangeRates(cached?.rates);
  if (cached && typeof cached.updatedAt === "number" && rates) {
    const normalized = { updatedAt: cached.updatedAt, rates } satisfies CachedExchangeRates;
    exchangeRates$.next(normalized);
    return normalized;
  }
  return null;
}

export async function setCachedExchangeRates(rates: Record<string, number>) {
  const cached = { updatedAt: Date.now(), rates } satisfies CachedExchangeRates;
  await idbKeyValueStore.setItem(EXCHANGE_RATES_KEY, cached);
  exchangeRates$.next(cached);
  return cached;
}

export async function refreshExchangeRates(force = false) {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const cached = exchangeRates$.value ?? (await getCachedExchangeRates());
    const maxAge = localSettings.exchangeRateRefreshInterval.value;
    if (!force && cached && Date.now() - cached.updatedAt < maxAge) return cached;

    try {
      const response = await fetch(localSettings.exchangeRateEndpoint.value);
      if (!response.ok) throw new Error(`Failed to fetch exchange rates: ${response.status}`);

      const rates = parseExchangeRates(await response.json());
      if (!rates) throw new Error("Exchange rate response did not contain rates");

      return await setCachedExchangeRates(rates);
    } catch (error) {
      if (cached) return cached;
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

getCachedExchangeRates()
  .then(() => refreshExchangeRates())
  .catch(() => undefined);

localSettings.exchangeRateEndpoint.subscribe(() => {
  if (!endpointInitialized) {
    endpointInitialized = true;
    return;
  }
  refreshExchangeRates(true).catch(() => undefined);
});
