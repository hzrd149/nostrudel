import { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { secp256k1 } from '@noble/curves/secp256k1';
import { bytesToNumber } from '../util/utils.js';
import { BlindSignature, IntRange, Keyset, MintKeys, Proof } from '../common/index.js';
import { createRandomPrivateKey, deriveKeysetId, hashToCurve } from '../common/index.js';
import { HDKey } from '@scure/bip32';

const DERIVATION_PATH = "m/0'/0'/0'";

export type KeysetPair = {
	keysetId: string;
	pubKeys: MintKeys;
	privKeys: MintKeys;
};

export type KeysetWithKeys = Keyset & {
	pubKeys: MintKeys;
};

export function createBlindSignature(
	B_: ProjPointType<bigint>,
	privateKey: Uint8Array,
	amount: number,
	id: string
): BlindSignature {
	const C_: ProjPointType<bigint> = B_.multiply(bytesToNumber(privateKey));
	return { C_, amount, id };
}

export function getPubKeyFromPrivKey(privKey: Uint8Array) {
	return secp256k1.getPublicKey(privKey, true);
}

export function createNewMintKeys(pow2height: IntRange<0, 65>, seed?: Uint8Array): KeysetPair {
	let counter = 0n;
	const pubKeys: MintKeys = {};
	const privKeys: MintKeys = {};
	let masterKey;
	if (seed) {
		masterKey = HDKey.fromMasterSeed(seed);
	}
	while (counter < pow2height) {
		const index: string = (2n ** counter).toString();
		if (masterKey) {
			const k = masterKey.derive(`${DERIVATION_PATH}/${counter}`).privateKey;
			if (k) {
				privKeys[index] = k;
			} else {
				throw new Error(`Could not derive Private key from: ${DERIVATION_PATH}/${counter}`);
			}
		} else {
			privKeys[index] = createRandomPrivateKey();
		}

		pubKeys[index] = getPubKeyFromPrivKey(privKeys[index]);
		counter++;
	}
	const keysetId = deriveKeysetId(pubKeys);
	return { pubKeys, privKeys, keysetId };
}

export function verifyProof(proof: Proof, privKey: Uint8Array): boolean {
	const Y: ProjPointType<bigint> = hashToCurve(proof.secret);
	const aY: ProjPointType<bigint> = Y.multiply(bytesToNumber(privKey));
	return aY.equals(proof.C);
}
