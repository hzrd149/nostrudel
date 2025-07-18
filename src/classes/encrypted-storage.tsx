import { cbc } from "@noble/ciphers/aes";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToUtf8, utf8ToBytes } from "@noble/hashes/utils";
import "localforage";

import localSettings from "../services/preferences";

// Encryption utility class
export default class SecureStorage {
  private key: Uint8Array | null = null;
  private salt = localSettings.encryptionSalt.value;

  get unlocked() {
    return this.key !== null;
  }

  constructor(public database: LocalForageDbMethods) {}

  // Generate encryption key from password
  private async deriveKey(pass: string): Promise<Uint8Array> {
    // Convert password to bytes
    const passBytes = utf8ToBytes(pass);

    // Use PBKDF2 to derive a key from the password
    // 32 bytes key for AES-256, with 10000 iterations
    const key = pbkdf2(sha256, passBytes, this.salt, { c: 10000, dkLen: 32 });

    return key;
  }

  // Encrypt and store data
  async setItem(key: string, value: string, encryptionKey = this.key): Promise<boolean> {
    if (!encryptionKey) throw new Error("Storage locked");

    try {
      // Convert value to string if it's an object
      const valueBytes = utf8ToBytes(value);

      // Generate a random IV for CBC mode
      const iv = crypto.getRandomValues(new Uint8Array(16));

      // Create AES-CBC cipher
      const cipher = cbc(encryptionKey, iv);

      // Encrypt the data
      const encryptedData = cipher.encrypt(valueBytes);

      // Store IV and encrypted data directly as binary
      const dataToStore = { iv, data: encryptedData };

      // Store the encrypted data - LocalForage can handle this directly
      await this.database.setItem(key, dataToStore);
      return true;
    } catch (error) {
      console.error("Encryption error:", error);
      return false;
    }
  }

  // Retrieve and decrypt data
  async getItem(key: string, encryptionKey = this.key): Promise<string | null> {
    if (!encryptionKey) throw new Error("Storage locked");

    // Get encrypted data
    const encryptedPackage = (await this.database.getItem(key)) as { iv: Uint8Array; data: Uint8Array } | null;
    if (!encryptedPackage) return null;

    // Create AES-CBC decipher
    const decipher = cbc(encryptionKey, encryptedPackage.iv);

    // Decrypt the data
    let decryptedBytes: Uint8Array;
    try {
      decryptedBytes = decipher.decrypt(encryptedPackage.data);
    } catch (e) {
      throw new Error("Decryption failed, incorrect password");
    }

    // Convert bytes to UTF-8 string
    const decryptedText = bytesToUtf8(decryptedBytes);

    return decryptedText;
  }

  // Remove an item
  async removeItem(key: string): Promise<void> {
    return this.database.removeItem(key);
  }

  // Clear all stored data
  async clear(): Promise<void> {
    return this.database.clear();
  }

  // Verify if a password can decrypt stored data
  async unlock(pass: string, testKey: string = "_pass_test_"): Promise<boolean> {
    // Create a key from the password
    const key = await this.deriveKey(pass);

    try {
      // Try to get a known test value with this password
      const testValue = await this.getItem(testKey, key);

      // If we've never set a test value with this password before, set one
      if (testValue === null) {
        // First setup
        await this.setItem(testKey, "password verification data", key);
        this.key = await this.deriveKey(pass);
        return true;
      } else if (testValue === "password verification data") {
        // Save the key for later
        this.key = await this.deriveKey(pass);
        return true;
      }
    } catch (error) {
      // decryption failed, do nothing
    }

    return false;
  }
}
