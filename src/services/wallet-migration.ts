// Optional one-time migration of a bitcoin-connect NWC wallet into the applesauce wallet system.
//
// bitcoin-connect persists its single active connector under the "bc:config" localStorage key as a
// `ConnectorConfig` JSON object: { connectorName, connectorType, nwcUrl?, ... }. NWC connectors use a
// `connectorType` of "nwc.*" (e.g. "nwc.generic", "nwc.albyhub") and store the connection string in `nwcUrl`.
//
// This module reads that config directly (so it works even after bitcoin-connect is uninstalled), copies any
// NWC wallet into our preferences-backed wallet list, and never touches "bc:config" itself so a live
// bitcoin-connect session keeps working during the transition. It runs once and is a no-op afterwards.

import { logger } from "../helpers/debug";
import localSettings from "./preferences";
import { addNwcWallet } from "./wallets";

const log = logger.extend("WalletMigration");

/** localStorage flag so the migration only ever runs once */
const MIGRATED_KEY = "nostrudel:bc-nwc-migrated";

/** The bitcoin-connect localStorage key holding the active connector config */
const BC_CONFIG_KEY = "bc:config";

/** The subset of bitcoin-connect's ConnectorConfig we care about */
type BitcoinConnectConfig = {
  connectorName?: string;
  connectorType?: string;
  nwcUrl?: string;
  // Tolerate the raw NWC field name in case an older version stored it
  nostrWalletConnectUrl?: string;
};

/** Migrates a bitcoin-connect NWC wallet into the applesauce wallet list (one-time, idempotent) */
export async function migrateBitcoinConnectNwcWallets(): Promise<void> {
  // One-time guard
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const raw = localStorage.getItem(BC_CONFIG_KEY);
    if (raw) {
      const config = JSON.parse(raw) as BitcoinConnectConfig;
      const uri = config.nwcUrl || config.nostrWalletConnectUrl;

      // Only migrate NWC connectors that have a connection string
      if (config.connectorType?.startsWith("nwc.") && uri) {
        const exists = localSettings.wallets.value.some((wallet) => wallet.uri === uri);
        if (exists) {
          log("bitcoin-connect NWC wallet already present, skipping");
        } else {
          await addNwcWallet({ name: config.connectorName || "Nostr Wallet Connect", uri });
          log("Migrated bitcoin-connect NWC wallet:", config.connectorName);
        }
      }
    }
  } catch (error) {
    log("Failed to migrate bitcoin-connect NWC wallet", error);
  } finally {
    // Mark as done even if nothing was migrated so it never runs again
    localStorage.setItem(MIGRATED_KEY, "true");
  }
}

// Run the migration as a side effect when this module is loaded
migrateBitcoinConnectNwcWallets();
