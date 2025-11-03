import { cbc } from "@noble/ciphers/aes.js";
import { bytesToUtf8 } from "@noble/ciphers/utils.js";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

const TEST_KEY = "_pass_test_";
const TEST_VALUE = "password verification data";

/**
 * Apply PKCS#7 padding to bytes to make length a multiple of blockSize.
 * Appends N bytes of value N where N is the number of padding bytes needed.
 * @param bytes - The data to pad
 * @param blockSize - Block size in bytes (default 16 for AES)
 * @returns Padded bytes
 */
function pad(bytes: Uint8Array, blockSize: number = 16): Uint8Array {
  const paddingLength = blockSize - (bytes.length % blockSize);
  const padded = new Uint8Array(bytes.length + paddingLength);
  padded.set(bytes);
  // Fill padding bytes with the padding length value
  for (let i = bytes.length; i < padded.length; i++) padded[i] = paddingLength;

  return padded;
}

/**
 * Remove PKCS#7 padding from bytes and validate it.
 * @param bytes - The padded data
 * @returns Unpadded bytes
 * @throws Error if padding is invalid or zero
 */
function unpad(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 0) throw new Error("Invalid padding: empty data");

  const paddingLength = bytes[bytes.length - 1];

  // Validate padding length
  if (paddingLength === 0 || paddingLength > 16) throw new Error("Invalid padding: padding length out of range");

  if (paddingLength > bytes.length) throw new Error("Invalid padding: padding length exceeds data length");

  // Validate all padding bytes have the correct value
  for (let i = bytes.length - paddingLength; i < bytes.length; i++) {
    if (bytes[i] !== paddingLength) throw new Error("Invalid padding: inconsistent padding bytes");
  }

  // Return data without padding
  return bytes.slice(0, bytes.length - paddingLength);
}

export default class EncryptedKeyValueStore {
  private key: Uint8Array | null = null;
  get unlocked() {
    return this.key !== null;
  }

  constructor(
    public database: LocalForageDbMethods,
    private salt: Uint8Array,
  ) {}

  // Generate encryption key from password
  private deriveKey(password: string): Uint8Array {
    // Convert password to bytes
    const passwordBytes = utf8ToBytes(password);

    // Use PBKDF2 to derive a key from the password
    // 32 bytes key for AES-256, with 10000 iterations
    return pbkdf2(sha256, passwordBytes, this.salt, { c: 10000, dkLen: 32 });
  }

  // Encrypt and store data
  async setItem(key: string, value: string, encryptionKey = this.key): Promise<boolean> {
    if (!encryptionKey) throw new Error("Storage locked");

    try {
      // Convert value to UTF-8 bytes
      const valueBytes = utf8ToBytes(value);

      // Apply PKCS#7 padding to make length a multiple of 16
      const paddedBytes = pad(valueBytes);

      // Generate a random IV for CBC mode
      const iv = crypto.getRandomValues(new Uint8Array(16));

      // Create AES-CBC cipher
      const cipher = cbc(encryptionKey, iv);

      // Encrypt the padded data
      const encryptedData = cipher.encrypt(paddedBytes);

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
    const encryptedPackage = (await this.database.getItem(key)) as {
      iv: Uint8Array;
      data: Uint8Array;
    } | null;
    if (!encryptedPackage) return null;

    // Create AES-CBC decipher
    const decipher = cbc(encryptionKey, encryptedPackage.iv);

    // Decrypt the data
    let decryptedBytes: Uint8Array;
    try {
      decryptedBytes = decipher.decrypt(encryptedPackage.data);
    } catch (e) {
      throw new Error("Decryption failed, incorrect PIN");
    }

    // Remove PKCS#7 padding
    let unpaddedBytes: Uint8Array;
    try {
      unpaddedBytes = unpad(decryptedBytes);
    } catch (e) {
      throw new Error("Decryption failed, invalid padding");
    }

    // Convert unpadded bytes to UTF-8 string
    const decryptedText = bytesToUtf8(unpaddedBytes);

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

  /** Verify if a password can decrypt stored data */
  async unlock(password: string, testKey: string = TEST_KEY): Promise<boolean> {
    // Create a key from the password
    const key = this.deriveKey(password);

    try {
      // Try to get a known test value with this password
      const testValue = await this.getItem(testKey, key);

      // If we've never set a test value with this password before, set one
      if (testValue === null) {
        // First setup
        await this.setItem(testKey, TEST_VALUE, key);
        this.key = this.deriveKey(password);
        return true;
      } else if (testValue === TEST_VALUE) {
        // Save the key for later
        this.key = this.deriveKey(password);
        return true;
      }
    } catch (error) {
      // decryption failed, do nothing
    }

    return false;
  }
}
