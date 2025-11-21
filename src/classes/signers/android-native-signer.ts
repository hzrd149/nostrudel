import { ISigner } from "applesauce-signers";
import { nanoid } from "nanoid";
import { NostrSignerPlugin, Permission } from "nostr-signer-capacitor-plugin";
import { EventTemplate, getEventHash, NostrEvent, UnsignedEvent, verifyEvent } from "nostr-tools";
import { decode, npubEncode } from "nostr-tools/nip19";

export default class AndroidNativeSigner implements ISigner {
  packageName: string;
  connected = false;

  permissions: Permission[] = [];

  private pubkey: string | null = null;
  verifyEvent: typeof verifyEvent = verifyEvent;

  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };

  constructor(packageName: string) {
    this.packageName = packageName;

    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  static async getSignerApps() {
    return (await NostrSignerPlugin.getInstalledSignerApps()).apps;
  }

  async setup() {
    if (this.connected) return;

    await NostrSignerPlugin.setPackageName(this.packageName);

    const result = await NostrSignerPlugin.getPublicKey(this.packageName, this.permissions);

    const pubkey = decode(result.npub).data as string;
    this.pubkey = pubkey;

    this.connected = true;
  }

  async getPublicKey() {
    await this.setup();
    return this.pubkey!;
  }
  async signEvent(template: UnsignedEvent | EventTemplate) {
    const pubkey = await this.getPublicKey();

    // add pubkey to template
    const withPubkey: UnsignedEvent = {
      ...template,
      pubkey: pubkey,
    };

    // calculate the event id
    const unsigned = {
      ...withPubkey,
      id: getEventHash(withPubkey),
      // plugin requires an empty sig field
      sig: "",
    };

    // request signature
    const result = await NostrSignerPlugin.signEvent(
      this.packageName,
      JSON.stringify(unsigned),
      unsigned.id,
      npubEncode(unsigned.pubkey),
    );

    const signed: NostrEvent = { ...unsigned, id: result.id, sig: result.signature };
    if (!this.verifyEvent(signed)) throw new Error("Invalid signature");

    return signed;
  }

  // NIP-04
  async nip04Encrypt(pubkey: string, plaintext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip04Encrypt(this.packageName, plaintext, nanoid(), pubkey, npubEncode(p));
    return result.result;
  }
  async nip04Decrypt(pubkey: string, ciphertext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip04Decrypt(this.packageName, ciphertext, nanoid(), pubkey, npubEncode(p));
    return result.result;
  }

  // NIP-44
  async nip44Encrypt(pubkey: string, plaintext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip44Encrypt(this.packageName, plaintext, nanoid(), pubkey, npubEncode(p));
    return result.result;
  }
  async nip44Decrypt(pubkey: string, ciphertext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip44Decrypt(this.packageName, ciphertext, nanoid(), pubkey, npubEncode(p));
    return result.result;
  }
}
