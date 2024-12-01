import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { parseSecret } from '../common/NUT11.js';
import { Proof } from '../common/index.js';

export const verifyP2PKSig = (proof: Proof) => {
	if (!proof.witness) {
		throw new Error('could not verify signature, no witness provided');
	}
	const parsedSecret = parseSecret(proof.secret);

	// const tags = {} as Tags
	// parsedSecret[1].tags.forEach((e: string[]) => {tags[e[0]]=e.shift()})
	// if (tags.locktime) {
	//     const locktime = parseInt(tags.locktime[1])

	//     let isUnlocked = false
	//     if (Math.floor(Date.now() / 1000)>=locktime) {
	//         isUnlocked = true
	//     }
	// }
	// if (tags.sigflag as SigFlag) {
	//     if (tags.sigflag[0]==='SIG_INPUT') {

	//     }
	//     else if(tags.sigflag[0]==='SIG_ALL') {

	//     }
	//     else {
	//         throw new Error("Unknown sigflag");
	//     }
	// }
	// if (tags.n_sigs) {
	//     if (tags.pubkeys) {

	//     }
	// }

	return schnorr.verify(
		proof.witness.signatures[0],
		sha256(new TextDecoder().decode(proof.secret)),
		parsedSecret[1].data
	);
};
