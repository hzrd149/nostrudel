/**
 * Vite dev middleware plugin for Namecoin name resolution.
 *
 * Provides /__namecoin/lookup/:name endpoint during development,
 * so the browser can resolve .bit identities without a separate proxy process.
 *
 * Connects to ElectrumX over TLS on first request (lazy init).
 *
 * Usage in vite.config.ts:
 *   import namecoinPlugin from "./proxy/vite-plugin-namecoin.mjs";
 *   export default defineConfig({ plugins: [namecoinPlugin()] });
 */

import { ElectrumxClient } from "./electrumx-client.mjs";

const DEFAULT_HOST = "nmc2.bitcoins.sk";
const DEFAULT_PORT = 57001;
const CACHE_TTL = 5 * 60 * 1000;

export default function namecoinPlugin(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port || DEFAULT_PORT;

  let client = null;
  const cache = new Map();

  async function getClient() {
    if (!client) {
      client = new ElectrumxClient(host, port);
      await client.connect();
    }
    return client;
  }

  return {
    name: "vite-plugin-namecoin",
    configureServer(server) {
      server.middlewares.use("/__namecoin", async (req, res, next) => {
        // Parse the URL
        const url = new URL(req.url, "http://localhost");
        const match = url.pathname.match(/^\/lookup\/(.+)$/);

        if (!match) return next();

        const name = decodeURIComponent(match[1]);

        // Validate format
        if (!name.startsWith("d/") && !name.startsWith("id/")) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid name format" }));
          return;
        }

        // Check cache
        const cached = cache.get(name);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(cached.data));
          return;
        }

        try {
          const electrumx = await getClient();
          const result = await electrumx.resolveName(name);

          if (!result) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Name not found", name }));
            return;
          }

          const data = {
            name,
            value: result.value,
            expired: result.expired,
            height: result.height,
            txid: result.txid,
          };

          cache.set(name, { data, ts: Date.now() });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data));
        } catch (err) {
          console.error(`[namecoin-plugin] Error resolving ${name}:`, err.message);
          if (client) {
            client.close();
            client = null;
          }
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "ElectrumX error", message: err.message }));
        }
      });
    },
  };
}
