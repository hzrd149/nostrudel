import { HDKey } from '@scure/bip32';
import { getKeysetIdInt } from '../common/index.js';
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

const STANDARD_DERIVATION_PATH = `m/129372'/0'`;

enum DerivationType {
	SECRET = 0,
	BLINDING_FACTOR = 1
}

export const deriveSecret = (seed: Uint8Array, keysetId: string, counter: number): Uint8Array => {
	return derive(seed, keysetId, counter, DerivationType.SECRET);
};

export const deriveBlindingFactor = (
	seed: Uint8Array,
	keysetId: string,
	counter: number
): Uint8Array => {
	return derive(seed, keysetId, counter, DerivationType.BLINDING_FACTOR);
};

const derive = (
	seed: Uint8Array,
	keysetId: string,
	counter: number,
	secretOrBlinding: DerivationType
): Uint8Array => {
	const hdkey = HDKey.fromMasterSeed(seed);
	const keysetIdInt = getKeysetIdInt(keysetId);
	const derivationPath = `${STANDARD_DERIVATION_PATH}/${keysetIdInt}'/${counter}'/${secretOrBlinding}`;
	const derived = hdkey.derive(derivationPath);
	if (derived.privateKey === null) {
		throw new Error('Could not derive private key');
	}
	return derived.privateKey;
};

export const generateNewMnemonic = (): string => {
	const mnemonic = generateMnemonic(wordlist, 128);
	return mnemonic;
};

export const deriveSeedFromMnemonic = (mnemonic: string): Uint8Array => {
	const seed = mnemonicToSeedSync(mnemonic);
	return seed;
};
