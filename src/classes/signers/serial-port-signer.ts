import { EventTemplate, getEventHash, NostrEvent, verifyEvent } from "nostr-tools";
import { base64 } from "@scure/base";
import { randomBytes, hexToBytes } from "@noble/hashes/utils";
import { Point } from "@noble/secp256k1";

import { logger } from "../../helpers/debug";
import { Nip07Signer } from "../../types/nostr-extensions";
import createDefer, { Deferred } from "../deferred";

type Callback = () => void;
type DeviceOpts = {
  onConnect?: Callback;
  onDisconnect?: Callback;
  onError?: (err: Error) => void;
  onDone?: Callback;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function xOnlyToXY(p: string) {
  return Point.fromHex(p).toHex().substring(2);
}

export const utf8Decoder = new TextDecoder("utf-8");
export const utf8Encoder = new TextEncoder();

export default class SerialPortSigner implements Nip07Signer {
  log = logger.extend("SerialSigner");
  writer: WritableStreamDefaultWriter<string> | null = null;
  pubkey?: string;

  get isConnected() {
    return !!this.writer;
  }

  verifyEvent: typeof verifyEvent = verifyEvent;
  nip04?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;

  constructor() {
    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
  }

  lastCommand: Deferred<string> | null = null;
  async callMethodOnDevice(method: string, params: string[], opts: DeviceOpts = {}) {
    if (!SerialPortSigner.SUPPORTED) throw new Error("Serial devices are not supported");
    if (!this.writer) await this.connectToDevice(opts);

    // only one command can be pending at any time
    // but each will only wait 6 seconds
    if (this.lastCommand) throw new Error("Previous command to device still pending!");
    const command = createDefer<string>();
    this.lastCommand = command;

    // send actual command
    this.sendCommand(method, params);
    setTimeout(() => {
      command.reject(new Error("Device timeout"));
      if (this.lastCommand === command) this.lastCommand = null;
    }, 6000);

    return this.lastCommand;
  }

  async connectToDevice({ onConnect, onDisconnect, onError, onDone }: DeviceOpts): Promise<void> {
    let port: SerialPort = await navigator.serial.requestPort();
    let reader;

    const startSerialPortReading = async () => {
      // reading responses
      while (port && port.readable) {
        const textDecoder = new window.TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();
        const readStringUntil = this.readFromSerialPort(reader);

        try {
          while (true) {
            const { value, done } = await readStringUntil("\n");
            if (value) {
              const { method, data } = this.parseResponse(value);

              // if (method === "/log") deviceLog(data);
              if (method === "/ping") this.log("Pong");

              if (SerialPortSigner.PUBLIC_METHODS.indexOf(method) === -1) {
                // ignore /ping, /log responses
                continue;
              }

              this.log("Received: ", method, data);

              if (this.lastCommand) {
                this.lastCommand.resolve(data);
                this.lastCommand = null;
              }
            }
            if (done) {
              this.lastCommand = null;
              this.writer = null;
              if (onDone) onDone();
              return;
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            this.writer = null;
            if (onError) onError(error);
            if (this.lastCommand) {
              this.lastCommand.reject(error);
              this.lastCommand = null;
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
    this.writer = textEncoder.writable.getWriter();

    // send ping first
    await this.sendCommand(SerialPortSigner.METHOD_PING);
    await this.sendCommand(SerialPortSigner.METHOD_PING, [window.location.host]);

    if (onConnect) onConnect();

    port.addEventListener("disconnect", () => {
      this.log("Disconnected");
      this.lastCommand = null;
      this.writer = null;
      if (onDisconnect) onDisconnect();
    });
  }

  async sendCommand(method: string, params: string[] = []) {
    if (!this.writer) return;
    this.log("Send command", method, params);
    const message = [method].concat(params).join(" ");
    await this.writer.write(message + "\n");
  }

  private readFromSerialPort(reader: ReadableStreamDefaultReader<string>) {
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

  private parseResponse(value: string) {
    const method = value.split(" ")[0];
    const data = value.substring(method.length).trim();

    return { method, data };
  }

  // NIP-04
  public async nip04Encrypt(pubkey: string, text: string) {
    const sharedSecretStr = await this.callMethodOnDevice(SerialPortSigner.METHOD_SHARED_SECRET, [xOnlyToXY(pubkey)]);
    const sharedSecret = hexToBytes(sharedSecretStr);

    let iv = Uint8Array.from(randomBytes(16));
    let plaintext = utf8Encoder.encode(text);
    let cryptoKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "AES-CBC" }, false, ["encrypt"]);
    let ciphertext = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, plaintext);
    let ctb64 = base64.encode(new Uint8Array(ciphertext));
    let ivb64 = base64.encode(new Uint8Array(iv.buffer));

    return `${ctb64}?iv=${ivb64}`;
  }
  public async nip04Decrypt(pubkey: string, data: string) {
    let [ctb64, ivb64] = data.split("?iv=");

    const sharedSecretStr = await this.callMethodOnDevice(SerialPortSigner.METHOD_SHARED_SECRET, [xOnlyToXY(pubkey)]);
    const sharedSecret = hexToBytes(sharedSecretStr);

    let cryptoKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "AES-CBC" }, false, ["decrypt"]);
    let ciphertext = base64.decode(ctb64);
    let iv = base64.decode(ivb64);

    let plaintext = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, ciphertext);

    let text = utf8Decoder.decode(plaintext);
    return text;
  }

  public async getPublicKey() {
    const pubkey = await this.callMethodOnDevice(SerialPortSigner.METHOD_PUBLIC_KEY, []);
    this.pubkey = pubkey;
    return pubkey;
  }
  public async signEvent(draft: EventTemplate & { pubkey?: string }) {
    const pubkey = draft.pubkey || this.pubkey;
    if (!pubkey) throw new Error("Unknown signer pubkey");

    const draftWithId = { ...draft, id: getEventHash({ ...draft, pubkey }) };
    const sig = await this.callMethodOnDevice(SerialPortSigner.METHOD_SIGN_MESSAGE, [draftWithId.id]);

    const event: NostrEvent = { ...draftWithId, sig, pubkey };
    if (!this.verifyEvent(event)) throw new Error("Invalid signature");
    return event;
  }

  public ping() {
    this.sendCommand(SerialPortSigner.METHOD_PING, [window.location.host]);
  }

  // static const
  static SUPPORTED = !!navigator.serial;

  static METHOD_PING = "/ping";
  static METHOD_LOG = "/log";

  static METHOD_SIGN_MESSAGE = "/sign-message";
  static METHOD_SHARED_SECRET = "/shared-secret";
  static METHOD_PUBLIC_KEY = "/public-key";

  static PUBLIC_METHODS = [
    SerialPortSigner.METHOD_PUBLIC_KEY,
    SerialPortSigner.METHOD_SIGN_MESSAGE,
    SerialPortSigner.METHOD_SHARED_SECRET,
  ];
}
