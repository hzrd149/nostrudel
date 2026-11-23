#!/usr/bin/env node
/**
 * Standalone HTTP proxy for Namecoin ElectrumX name resolution.
 *
 * Usage:
 *   node electrumx-proxy.mjs [--port 3001] [--host nmc2.bitcoins.sk] [--electrumx-port 57001]
 *
 * Endpoints:
 *   GET /lookup/:name  — resolve a Namecoin name (e.g. /lookup/d%2Fexample)
 *   GET /health        — health check
 *
 * For production deployment behind a reverse proxy or CDN.
 */

import { createServer } from "node:http";
import { ElectrumxClient } from "./electrumx-client.mjs";

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const PORT = parseInt(getArg("port", "3001"), 10);
const ELECTRUMX_HOST = getArg("host", "nmc2.bitcoins.sk");
const ELECTRUMX_PORT = parseInt(getArg("electrumx-port", "57001"), 10);

let client = null;

async function getClient() {
  if (!client) {
    client = new ElectrumxClient(ELECTRUMX_HOST, ELECTRUMX_PORT);
    await client.connect();
  }
  return client;
}

// Simple in-memory cache (production should use Redis/similar)
const resultCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, server: `${ELECTRUMX_HOST}:${ELECTRUMX_PORT}` }));
    return;
  }

  const lookupMatch = url.pathname.match(/^\/lookup\/(.+)$/);
  if (!lookupMatch) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const name = decodeURIComponent(lookupMatch[1]);

  // Validate name format
  if (!name.startsWith("d/") && !name.startsWith("id/")) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid name format. Use d/name or id/name" }));
    return;
  }

  // Check cache
  const cached = resultCache.get(name);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.writeHead(200, { "Content-Type": "application/json", "X-Cache": "HIT" });
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

    resultCache.set(name, { data, timestamp: Date.now() });

    // Evict old cache entries
    if (resultCache.size > 1000) {
      const now = Date.now();
      for (const [key, val] of resultCache) {
        if (now - val.timestamp > CACHE_TTL) resultCache.delete(key);
      }
    }

    res.writeHead(200, { "Content-Type": "application/json", "X-Cache": "MISS" });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error(`[proxy] Error resolving ${name}:`, err.message);
    // Reset client on connection errors
    if (client) {
      client.close();
      client = null;
    }
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ElectrumX resolution failed", message: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Namecoin ElectrumX proxy listening on http://localhost:${PORT}`);
  console.log(`ElectrumX server: ${ELECTRUMX_HOST}:${ELECTRUMX_PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /lookup/d%2Fexample  — resolve d/example`);
  console.log(`  GET /lookup/id%2Falice   — resolve id/alice`);
  console.log(`  GET /health              — health check`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  if (client) client.close();
  server.close();
  process.exit(0);
});
