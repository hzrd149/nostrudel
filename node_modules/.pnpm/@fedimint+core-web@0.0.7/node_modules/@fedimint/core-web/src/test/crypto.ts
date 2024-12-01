import * as secp256k1 from 'secp256k1'

const randomBytes = (size: number): Uint8Array => {
  const array = new Uint8Array(size)
  window.crypto.getRandomValues(array)
  return array
}

interface KeyPair {
  secretKey: string
  publicKey: string
}

export const keyPair = (secretKey?: Uint8Array): KeyPair => {
  const privateKey: Uint8Array = secretKey
    ? validatePrivateKey(secretKey)
    : generatePrivateKey()

  const publicKey = secp256k1.publicKeyCreate(privateKey)

  return {
    secretKey: Array.from(privateKey)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''), // Convert Uint8Array to hex string
    publicKey: Array.from(publicKey)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''), // Convert Uint8Array to hex string
  }
}

const validatePrivateKey = (key: Uint8Array): Uint8Array => {
  if (!secp256k1.privateKeyVerify(key)) {
    throw new Error('Invalid private key provided')
  }
  return key
}

const generatePrivateKey = (): Uint8Array => {
  let key: Uint8Array
  do {
    key = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(key))
  return key
}
