import { u8, u32, ensureBytes } from './utils.js';
// AES-SIV polyval, little-endian "mirror image" of AES-GCM GHash
// polynomial hash function. Defined in RFC 8452.
// Reverse bits in u32, constant-time, precompute will be faster, but non-constant time
function rev32(x) {
    x = ((x & 1431655765) << 1) | ((x >>> 1) & 1431655765);
    x = ((x & 858993459) << 2) | ((x >>> 2) & 858993459);
    x = ((x & 252645135) << 4) | ((x >>> 4) & 252645135);
    x = ((x & 16711935) << 8) | ((x >>> 8) & 16711935);
    return (x << 16) | (x >>> 16);
}
// wrapped 32 bit multiplication
const wrapMul = (a, b) => Math.imul(a, b) >>> 0;
// https://timtaubert.de/blog/2017/06/verified-binary-multiplication-for-ghash/
function bmul32(x, y) {
    const x0 = x & 286331153;
    const x1 = x & 572662306;
    const x2 = x & 1145324612;
    const x3 = x & 2290649224;
    const y0 = y & 286331153;
    const y1 = y & 572662306;
    const y2 = y & 1145324612;
    const y3 = y & 2290649224;
    let res = (wrapMul(x0, y0) ^ wrapMul(x1, y3) ^ wrapMul(x2, y2) ^ wrapMul(x3, y1)) & 286331153;
    res |= (wrapMul(x0, y1) ^ wrapMul(x1, y0) ^ wrapMul(x2, y3) ^ wrapMul(x3, y2)) & 572662306;
    res |= (wrapMul(x0, y2) ^ wrapMul(x1, y1) ^ wrapMul(x2, y0) ^ wrapMul(x3, y3)) & 1145324612;
    res |= (wrapMul(x0, y3) ^ wrapMul(x1, y2) ^ wrapMul(x2, y1) ^ wrapMul(x3, y0)) & 2290649224;
    return res >>> 0;
}
function mulPart(arr) {
    const a = new Uint32Array(18);
    a[0] = arr[0];
    a[1] = arr[1];
    a[2] = arr[2];
    a[3] = arr[3];
    a[4] = a[0] ^ a[1];
    a[5] = a[2] ^ a[3];
    a[6] = a[0] ^ a[2];
    a[7] = a[1] ^ a[3];
    a[8] = a[6] ^ a[7];
    a[9] = rev32(arr[0]);
    a[10] = rev32(arr[1]);
    a[11] = rev32(arr[2]);
    a[12] = rev32(arr[3]);
    a[13] = a[9] ^ a[10];
    a[14] = a[11] ^ a[12];
    a[15] = a[9] ^ a[11];
    a[16] = a[10] ^ a[12];
    a[17] = a[15] ^ a[16];
    return a;
}
export function polyval(h, data) {
    ensureBytes(h);
    ensureBytes(data);
    const s = new Uint32Array(4);
    // Precompute for multiplication
    const a = mulPart(u32(h));
    if (data.length % 16)
        throw new Error('polyval: data must be padded to 16 bytes');
    const data32 = u32(data);
    for (let i = 0; i < data32.length; i += 4) {
        // Xor
        s[0] ^= data32[i + 0];
        s[1] ^= data32[i + 1];
        s[2] ^= data32[i + 2];
        s[3] ^= data32[i + 3];
        // Dot via Karatsuba multiplication, based on MIT-licensed
        // https://bearssl.org/gitweb/?p=BearSSL;a=blob;f=src/hash/ghash_ctmul32.c;hb=4b6046412
        const b = mulPart(s);
        const c = new Uint32Array(18);
        for (let i = 0; i < 18; i++)
            c[i] = bmul32(a[i], b[i]);
        c[4] ^= c[0] ^ c[1];
        c[5] ^= c[2] ^ c[3];
        c[8] ^= c[6] ^ c[7];
        c[13] ^= c[9] ^ c[10];
        c[14] ^= c[11] ^ c[12];
        c[17] ^= c[15] ^ c[16];
        const zw = new Uint32Array(8);
        zw[0] = c[0];
        zw[1] = c[4] ^ (rev32(c[9]) >>> 1);
        zw[2] = c[1] ^ c[0] ^ c[2] ^ c[6] ^ (rev32(c[13]) >>> 1);
        zw[3] = c[4] ^ c[5] ^ c[8] ^ (rev32(c[10] ^ c[9] ^ c[11] ^ c[15]) >>> 1);
        zw[4] = c[2] ^ c[1] ^ c[3] ^ c[7] ^ (rev32(c[13] ^ c[14] ^ c[17]) >>> 1);
        zw[5] = c[5] ^ (rev32(c[11] ^ c[10] ^ c[12] ^ c[16]) >>> 1);
        zw[6] = c[3] ^ (rev32(c[14]) >>> 1);
        zw[7] = rev32(c[12]) >>> 1;
        for (let i = 0; i < 4; i++) {
            const lw = zw[i];
            zw[i + 4] ^= lw ^ (lw >>> 1) ^ (lw >>> 2) ^ (lw >>> 7);
            zw[i + 3] ^= (lw << 31) ^ (lw << 30) ^ (lw << 25);
        }
        s[0] = zw[4];
        s[1] = zw[5];
        s[2] = zw[6];
        s[3] = zw[7];
    }
    return u8(s);
}
//# sourceMappingURL=_polyval.js.map