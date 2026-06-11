/**
 * ElectrumX TCP/TLS client for Namecoin name resolution.
 *
 * Protocol: JSON-RPC over newline-delimited TCP.
 * Used server-side only (Node.js) — browsers connect via the HTTP proxy.
 */

import { createHash } from "node:crypto";
import { connect as tlsConnect } from "node:tls";

const OP_NAME_UPDATE = 0x53;
const NAME_EXPIRE_DEPTH = 36000;

/**
 * Build the canonical name index script for ElectrumX lookup.
 *
 * Script format: OP_NAME_UPDATE <name> <empty> OP_2DROP OP_DROP OP_RETURN
 * This matches the script pattern that ElectrumX indexes for Namecoin names.
 */
export function buildNameScript(fullName) {
  // fullName is like "d/example" or "id/alice"
  const nameBytes = Buffer.from(fullName, "utf-8");
  const parts = [
    Buffer.from([OP_NAME_UPDATE]),        // OP_NAME_UPDATE
    pushData(nameBytes),                   // <name>
    Buffer.from([0x00]),                   // empty (OP_0)
    Buffer.from([0x6d]),                   // OP_2DROP
    Buffer.from([0x75]),                   // OP_DROP
    Buffer.from([0x6a]),                   // OP_RETURN
  ];
  return Buffer.concat(parts);
}

/** Push data with appropriate length prefix */
function pushData(data) {
  if (data.length < 0x4c) {
    return Buffer.concat([Buffer.from([data.length]), data]);
  } else if (data.length <= 0xff) {
    return Buffer.concat([Buffer.from([0x4c, data.length]), data]);
  } else {
    const lenBuf = Buffer.alloc(3);
    lenBuf[0] = 0x4d;
    lenBuf.writeUInt16LE(data.length, 1);
    return Buffer.concat([lenBuf, data]);
  }
}

/**
 * Compute the scripthash for ElectrumX: SHA-256 of the script, byte-reversed hex.
 */
export function computeScripthash(script) {
  const hash = createHash("sha256").update(script).digest();
  return Buffer.from(hash.reverse()).toString("hex");
}

/**
 * Create a persistent connection to an ElectrumX server.
 */
export class ElectrumxClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.requestId = 0;
    this.pending = new Map();
    this.buffer = "";
  }

  async connect() {
    if (this.socket) return;
    return new Promise((resolve, reject) => {
      this.socket = tlsConnect(
        { host: this.host, port: this.port, rejectUnauthorized: false },
        () => resolve(),
      );
      this.socket.setEncoding("utf-8");
      this.socket.on("data", (chunk) => this._onData(chunk));
      this.socket.on("error", (err) => {
        for (const [, { reject: rej }] of this.pending) rej(err);
        this.pending.clear();
        reject(err);
      });
      this.socket.on("close", () => {
        this.socket = null;
        for (const [, { reject: rej }] of this.pending) rej(new Error("Connection closed"));
        this.pending.clear();
      });
    });
  }

  _onData(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const handler = this.pending.get(msg.id);
        if (handler) {
          this.pending.delete(msg.id);
          if (msg.error) handler.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else handler.resolve(msg.result);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }

  async request(method, params = []) {
    if (!this.socket) await this.connect();
    const id = ++this.requestId;
    const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.write(payload);
    });
  }

  close() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  /**
   * Resolve a Namecoin name to its current value.
   * Returns { value, expired, height } or null if not found.
   */
  async resolveName(fullName) {
    const script = buildNameScript(fullName);
    const scripthash = computeScripthash(script);

    // Get transaction history for this name's scripthash
    const history = await this.request("blockchain.scripthash.get_history", [scripthash]);
    if (!history || !history.length) return null;

    // Get the latest transaction (highest block height)
    const latest = history.reduce((a, b) => (a.height > b.height ? a : b));

    // Fetch full transaction hex
    const rawTx = await this.request("blockchain.transaction.get", [latest.tx_hash, false]);
    if (!rawTx) return null;

    // Parse the NAME_UPDATE value from the transaction
    const value = parseNameValue(rawTx, fullName);
    if (value === null) return null;

    // Check expiry
    const tipHeader = await this.request("blockchain.headers.subscribe", []);
    const tipHeight = tipHeader?.height || tipHeader?.block_height || 0;
    const expired = tipHeight > 0 && (tipHeight - latest.height) > NAME_EXPIRE_DEPTH;

    return { value, expired, height: latest.height, txid: latest.tx_hash };
  }
}

/**
 * Parse NAME_UPDATE value from raw transaction hex.
 *
 * Scans transaction outputs for the OP_NAME_UPDATE pattern and extracts
 * the value field (the data stored in the name).
 */
function parseNameValue(rawTxHex, expectedName) {
  const tx = Buffer.from(rawTxHex, "hex");
  // Simple scan: find OP_NAME_UPDATE byte followed by name push
  const nameBytes = Buffer.from(expectedName, "utf-8");

  for (let i = 0; i < tx.length - nameBytes.length - 4; i++) {
    if (tx[i] !== OP_NAME_UPDATE) continue;

    // Try to read pushdata for the name
    const { data: foundName, nextOffset } = readPushData(tx, i + 1);
    if (!foundName || !foundName.equals(nameBytes)) continue;

    // Next should be the value pushdata
    const { data: value } = readPushData(tx, nextOffset);
    if (value) {
      try {
        return value.toString("utf-8");
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Read a Bitcoin script pushdata at the given offset */
function readPushData(buf, offset) {
  if (offset >= buf.length) return { data: null, nextOffset: offset };
  const opcode = buf[offset];

  if (opcode === 0x00) {
    // OP_0 — empty data
    return { data: Buffer.alloc(0), nextOffset: offset + 1 };
  }
  if (opcode >= 0x01 && opcode <= 0x4b) {
    // Direct push: opcode is the length
    const end = offset + 1 + opcode;
    if (end > buf.length) return { data: null, nextOffset: offset };
    return { data: buf.subarray(offset + 1, end), nextOffset: end };
  }
  if (opcode === 0x4c) {
    // OP_PUSHDATA1
    if (offset + 2 > buf.length) return { data: null, nextOffset: offset };
    const len = buf[offset + 1];
    const end = offset + 2 + len;
    if (end > buf.length) return { data: null, nextOffset: offset };
    return { data: buf.subarray(offset + 2, end), nextOffset: end };
  }
  if (opcode === 0x4d) {
    // OP_PUSHDATA2
    if (offset + 3 > buf.length) return { data: null, nextOffset: offset };
    const len = buf.readUInt16LE(offset + 1);
    const end = offset + 3 + len;
    if (end > buf.length) return { data: null, nextOffset: offset };
    return { data: buf.subarray(offset + 3, end), nextOffset: end };
  }

  return { data: null, nextOffset: offset + 1 };
}
