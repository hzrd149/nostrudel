import { getEventHash } from "nostr-tools";
import { base64 } from "@scure/base";
import { randomBytes, hexToBytes } from "@noble/hashes/utils";
import { Point } from "@noble/secp256k1";

import { logger } from "../helpers/debug";
import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import createDefer, { Deferred } from "../classes/deferred";
import { alwaysVerify } from "./verify-event";

const METHOD_PING = "/ping";
// const METHOD_LOG = '/log'

export const METHOD_SIGN_MESSAGE = "/sign-message";
export const METHOD_SHARED_SECRET = "/shared-secret";
export const METHOD_PUBLIC_KEY = "/public-key";

export const PUBLIC_METHODS = [METHOD_PUBLIC_KEY, METHOD_SIGN_MESSAGE, METHOD_SHARED_SECRET];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const log = logger.extend("SerialPortService");
const deviceLog = log.extend("DeviceLog");
let writer: WritableStreamDefaultWriter<string> | null;

export function isConnected() {
  return !!writer;
}

type Callback = () => void;
type DeviceOpts = {
  onConnect?: Callback;
  onDisconnect?: Callback;
  onError?: (err: Error) => void;
  onDone?: Callback;
};

let lastCommand: Deferred<string> | null = null;
export async function callMethodOnDevice(method: string, params: string[], opts: DeviceOpts = {}) {
  if (!writer) await connectToDevice(opts);

  // only one command can be pending at any time
  // but each will only wait 6 seconds
  if (lastCommand) throw new Error("Previous command to device still pending!");
  const command = createDefer<string>();
  lastCommand = command;

  // send actual command
  sendCommand(method, params);
  setTimeout(() => {
    command.reject(new Error("Device timeout"));
    if (lastCommand === command) lastCommand = null;
  }, 6000);

  return lastCommand;
}

export async function connectToDevice({ onConnect, onDisconnect, onError, onDone }: DeviceOpts): Promise<void> {
  let port: SerialPort = await navigator.serial.requestPort();
  let reader;

  const startSerialPortReading = async () => {
    // reading responses
    while (port && port.readable) {
      const textDecoder = new window.TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();
      const readStringUntil = readFromSerialPort(reader);

      try {
        while (true) {
          const { value, done } = await readStringUntil("\n");
          if (value) {
            const { method, data } = parseResponse(value);

            if (method === "/log") deviceLog(data);
            if (method === "/ping") log("Pong");

            if (PUBLIC_METHODS.indexOf(method) === -1) {
              // ignore /ping, /log responses
              continue;
            }

            log("Received: ", method, data);

            if (lastCommand) {
              lastCommand.resolve(data);
              lastCommand = null;
            }
          }
          if (done) {
            lastCommand = null;
            writer = null;
            if (onDone) onDone();
            return;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          writer = null;
          if (onError) onError(error);
          if (lastCommand) {
            lastCommand.reject(error);
            lastCommand = null;
          }
          throw error;
        }
      }
    }
  };

  await port.open({ baudRate: 9600 });

  // this `sleep()` is a hack, I know!
  // but `port.onconnect` is never called. I don't know why!
  await sleep(1000);
  startSerialPortReading();

  const textEncoder = new window.TextEncoderStream();
  textEncoder.readable.pipeTo(port.writable);
  writer = textEncoder.writable.getWriter();

  // send ping first
  await sendCommand(METHOD_PING);
  await sendCommand(METHOD_PING, [window.location.host]);

  if (onConnect) onConnect();

  port.addEventListener("disconnect", () => {
    log("Disconnected");
    lastCommand = null;
    writer = null;
    if (onDisconnect) onDisconnect();
  });
}

async function sendCommand(method: string, params: string[] = []) {
  if (!writer) return;
  log("Send command", method, params);
  const message = [method].concat(params).join(" ");
  await writer.write(message + "\n");
}

function readFromSerialPort(reader: ReadableStreamDefaultReader<string>) {
  let partialChunk: string | undefined;
  let fulliness: string[] = [];

  const readStringUntil = async (separator = "\n") => {
    if (fulliness.length) return { value: fulliness.shift()!.trim(), done: false };

    const chunks = [];
    if (partialChunk) {
      // leftovers from previous read
      chunks.push(partialChunk);
      partialChunk = undefined;
    }
    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        const values = value.split(separator);
        // found one or more separators
        if (values.length > 1) {
          chunks.push(values.shift()); // first element
          partialChunk = values.pop(); // last element
          fulliness = values; // full lines
          return { value: chunks.join("").trim(), done: false };
        }
        chunks.push(value);
      }
      if (done) return { value: chunks.join("").trim(), done: true };
    }
  };
  return readStringUntil;
}

function parseResponse(value: string) {
  const method = value.split(" ")[0];
  const data = value.substring(method.length).trim();

  return { method, data };
}

export const utf8Decoder = new TextDecoder("utf-8");
export const utf8Encoder = new TextEncoder();

export async function nip04Encrypt(pubkey: string, text: string) {
  const sharedSecretStr = await callMethodOnDevice(METHOD_SHARED_SECRET, [xOnlyToXY(pubkey)]);
  const sharedSecret = hexToBytes(sharedSecretStr);

  let iv = Uint8Array.from(randomBytes(16));
  let plaintext = utf8Encoder.encode(text);
  let cryptoKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "AES-CBC" }, false, ["encrypt"]);
  let ciphertext = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, plaintext);
  let ctb64 = base64.encode(new Uint8Array(ciphertext));
  let ivb64 = base64.encode(new Uint8Array(iv.buffer));

  return `${ctb64}?iv=${ivb64}`;
}

export async function nip04Decrypt(pubkey: string, data: string) {
  let [ctb64, ivb64] = data.split("?iv=");

  const sharedSecretStr = await callMethodOnDevice(METHOD_SHARED_SECRET, [xOnlyToXY(pubkey)]);
  const sharedSecret = hexToBytes(sharedSecretStr);

  let cryptoKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "AES-CBC" }, false, ["decrypt"]);
  let ciphertext = base64.decode(ctb64);
  let iv = base64.decode(ivb64);

  let plaintext = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, ciphertext);

  let text = utf8Decoder.decode(plaintext);
  return text;
}

export function xOnlyToXY(p: string) {
  return Point.fromHex(p).toHex().substring(2);
}

async function getPublicKey() {
  return await callMethodOnDevice(METHOD_PUBLIC_KEY, []);
}
async function signEvent(draft: DraftNostrEvent) {
  let signed = { ...draft } as NostrEvent;

  if (!signed.pubkey) signed.pubkey = await callMethodOnDevice(METHOD_PUBLIC_KEY, []);
  if (!signed.created_at) signed.created_at = Math.round(Date.now() / 1000);
  if (!signed.id) signed.id = getEventHash(signed);

  signed.sig = await callMethodOnDevice(METHOD_SIGN_MESSAGE, [signed.id]);
  if (!alwaysVerify(signed)) throw new Error("Invalid event");

  return signed;
}

const serialPortService = {
  supported: !!navigator.serial,
  signEvent,
  getPublicKey,
  nip04Encrypt,
  nip04Decrypt,
  callMethodOnDevice,
  connectToDevice,
};

setInterval(() => {
  if (writer) {
    sendCommand(METHOD_PING, [window.location.host]);
  }
}, 1000 * 10);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.serialPortService = serialPortService;
}

export default serialPortService;
