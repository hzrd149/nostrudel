import {
  assert_default,
  hmac
} from "./chunk-43SEAG5C.js";
import {
  toBytes
} from "./chunk-WVX5ONCR.js";

// node_modules/.pnpm/@noble+hashes@1.3.1/node_modules/@noble/hashes/esm/hkdf.js
function extract(hash, ikm, salt) {
  assert_default.hash(hash);
  if (salt === void 0)
    salt = new Uint8Array(hash.outputLen);
  return hmac(hash, toBytes(salt), toBytes(ikm));
}
var HKDF_COUNTER = new Uint8Array([0]);
var EMPTY_BUFFER = new Uint8Array();
function expand(hash, prk, info, length = 32) {
  assert_default.hash(hash);
  assert_default.number(length);
  if (length > 255 * hash.outputLen)
    throw new Error("Length should be <= 255*HashLen");
  const blocks = Math.ceil(length / hash.outputLen);
  if (info === void 0)
    info = EMPTY_BUFFER;
  const okm = new Uint8Array(blocks * hash.outputLen);
  const HMAC = hmac.create(hash, prk);
  const HMACTmp = HMAC._cloneInto();
  const T = new Uint8Array(HMAC.outputLen);
  for (let counter = 0; counter < blocks; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
    okm.set(T, hash.outputLen * counter);
    HMAC._cloneInto(HMACTmp);
  }
  HMAC.destroy();
  HMACTmp.destroy();
  T.fill(0);
  HKDF_COUNTER.fill(0);
  return okm.slice(0, length);
}
var hkdf = (hash, ikm, salt, info, length) => expand(hash, extract(hash, ikm, salt), info, length);

export {
  extract,
  expand,
  hkdf
};
//# sourceMappingURL=chunk-3QMXQ46N.js.map
