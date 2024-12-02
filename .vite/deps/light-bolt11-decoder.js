import {
  __commonJS
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/@scure+base@1.1.1/node_modules/@scure/base/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/@scure+base@1.1.1/node_modules/@scure/base/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bytes = exports.stringToBytes = exports.str = exports.bytesToString = exports.hex = exports.utf8 = exports.bech32m = exports.bech32 = exports.base58check = exports.base58xmr = exports.base58xrp = exports.base58flickr = exports.base58 = exports.base64url = exports.base64 = exports.base32crockford = exports.base32hex = exports.base32 = exports.base16 = exports.utils = exports.assertNumber = void 0;
    function assertNumber(n) {
      if (!Number.isSafeInteger(n))
        throw new Error(`Wrong integer: ${n}`);
    }
    exports.assertNumber = assertNumber;
    function chain(...args) {
      const wrap = (a, b) => (c) => a(b(c));
      const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, void 0);
      const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, void 0);
      return { encode, decode };
    }
    function alphabet(alphabet2) {
      return {
        encode: (digits) => {
          if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
            throw new Error("alphabet.encode input should be an array of numbers");
          return digits.map((i) => {
            assertNumber(i);
            if (i < 0 || i >= alphabet2.length)
              throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet2.length})`);
            return alphabet2[i];
          });
        },
        decode: (input) => {
          if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
            throw new Error("alphabet.decode input should be array of strings");
          return input.map((letter) => {
            if (typeof letter !== "string")
              throw new Error(`alphabet.decode: not string element=${letter}`);
            const index = alphabet2.indexOf(letter);
            if (index === -1)
              throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet2}`);
            return index;
          });
        }
      };
    }
    function join(separator = "") {
      if (typeof separator !== "string")
        throw new Error("join separator should be string");
      return {
        encode: (from) => {
          if (!Array.isArray(from) || from.length && typeof from[0] !== "string")
            throw new Error("join.encode input should be array of strings");
          for (let i of from)
            if (typeof i !== "string")
              throw new Error(`join.encode: non-string input=${i}`);
          return from.join(separator);
        },
        decode: (to) => {
          if (typeof to !== "string")
            throw new Error("join.decode input should be string");
          return to.split(separator);
        }
      };
    }
    function padding(bits, chr = "=") {
      assertNumber(bits);
      if (typeof chr !== "string")
        throw new Error("padding chr should be string");
      return {
        encode(data) {
          if (!Array.isArray(data) || data.length && typeof data[0] !== "string")
            throw new Error("padding.encode input should be array of strings");
          for (let i of data)
            if (typeof i !== "string")
              throw new Error(`padding.encode: non-string input=${i}`);
          while (data.length * bits % 8)
            data.push(chr);
          return data;
        },
        decode(input) {
          if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
            throw new Error("padding.encode input should be array of strings");
          for (let i of input)
            if (typeof i !== "string")
              throw new Error(`padding.decode: non-string input=${i}`);
          let end = input.length;
          if (end * bits % 8)
            throw new Error("Invalid padding: string should have whole number of bytes");
          for (; end > 0 && input[end - 1] === chr; end--) {
            if (!((end - 1) * bits % 8))
              throw new Error("Invalid padding: string has too much padding");
          }
          return input.slice(0, end);
        }
      };
    }
    function normalize(fn) {
      if (typeof fn !== "function")
        throw new Error("normalize fn should be function");
      return { encode: (from) => from, decode: (to) => fn(to) };
    }
    function convertRadix(data, from, to) {
      if (from < 2)
        throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
      if (to < 2)
        throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
      if (!Array.isArray(data))
        throw new Error("convertRadix: data should be array");
      if (!data.length)
        return [];
      let pos = 0;
      const res = [];
      const digits = Array.from(data);
      digits.forEach((d) => {
        assertNumber(d);
        if (d < 0 || d >= from)
          throw new Error(`Wrong integer: ${d}`);
      });
      while (true) {
        let carry = 0;
        let done = true;
        for (let i = pos; i < digits.length; i++) {
          const digit = digits[i];
          const digitBase = from * carry + digit;
          if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
            throw new Error("convertRadix: carry overflow");
          }
          carry = digitBase % to;
          digits[i] = Math.floor(digitBase / to);
          if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase)
            throw new Error("convertRadix: carry overflow");
          if (!done)
            continue;
          else if (!digits[i])
            pos = i;
          else
            done = false;
        }
        res.push(carry);
        if (done)
          break;
      }
      for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
        res.push(0);
      return res.reverse();
    }
    var gcd = (a, b) => !b ? a : gcd(b, a % b);
    var radix2carry = (from, to) => from + (to - gcd(from, to));
    function convertRadix2(data, from, to, padding2) {
      if (!Array.isArray(data))
        throw new Error("convertRadix2: data should be array");
      if (from <= 0 || from > 32)
        throw new Error(`convertRadix2: wrong from=${from}`);
      if (to <= 0 || to > 32)
        throw new Error(`convertRadix2: wrong to=${to}`);
      if (radix2carry(from, to) > 32) {
        throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
      }
      let carry = 0;
      let pos = 0;
      const mask = 2 ** to - 1;
      const res = [];
      for (const n of data) {
        assertNumber(n);
        if (n >= 2 ** from)
          throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
        carry = carry << from | n;
        if (pos + from > 32)
          throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
        pos += from;
        for (; pos >= to; pos -= to)
          res.push((carry >> pos - to & mask) >>> 0);
        carry &= 2 ** pos - 1;
      }
      carry = carry << to - pos & mask;
      if (!padding2 && pos >= from)
        throw new Error("Excess padding");
      if (!padding2 && carry)
        throw new Error(`Non-zero padding: ${carry}`);
      if (padding2 && pos > 0)
        res.push(carry >>> 0);
      return res;
    }
    function radix(num) {
      assertNumber(num);
      return {
        encode: (bytes) => {
          if (!(bytes instanceof Uint8Array))
            throw new Error("radix.encode input should be Uint8Array");
          return convertRadix(Array.from(bytes), 2 ** 8, num);
        },
        decode: (digits) => {
          if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
            throw new Error("radix.decode input should be array of strings");
          return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
        }
      };
    }
    function radix2(bits, revPadding = false) {
      assertNumber(bits);
      if (bits <= 0 || bits > 32)
        throw new Error("radix2: bits should be in (0..32]");
      if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
        throw new Error("radix2: carry overflow");
      return {
        encode: (bytes) => {
          if (!(bytes instanceof Uint8Array))
            throw new Error("radix2.encode input should be Uint8Array");
          return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
        },
        decode: (digits) => {
          if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
            throw new Error("radix2.decode input should be array of strings");
          return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
        }
      };
    }
    function unsafeWrapper(fn) {
      if (typeof fn !== "function")
        throw new Error("unsafeWrapper fn should be function");
      return function(...args) {
        try {
          return fn.apply(null, args);
        } catch (e) {
        }
      };
    }
    function checksum(len, fn) {
      assertNumber(len);
      if (typeof fn !== "function")
        throw new Error("checksum fn should be function");
      return {
        encode(data) {
          if (!(data instanceof Uint8Array))
            throw new Error("checksum.encode: input should be Uint8Array");
          const checksum2 = fn(data).slice(0, len);
          const res = new Uint8Array(data.length + len);
          res.set(data);
          res.set(checksum2, data.length);
          return res;
        },
        decode(data) {
          if (!(data instanceof Uint8Array))
            throw new Error("checksum.decode: input should be Uint8Array");
          const payload = data.slice(0, -len);
          const newChecksum = fn(payload).slice(0, len);
          const oldChecksum = data.slice(-len);
          for (let i = 0; i < len; i++)
            if (newChecksum[i] !== oldChecksum[i])
              throw new Error("Invalid checksum");
          return payload;
        }
      };
    }
    exports.utils = { alphabet, chain, checksum, radix, radix2, join, padding };
    exports.base16 = chain(radix2(4), alphabet("0123456789ABCDEF"), join(""));
    exports.base32 = chain(radix2(5), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), padding(5), join(""));
    exports.base32hex = chain(radix2(5), alphabet("0123456789ABCDEFGHIJKLMNOPQRSTUV"), padding(5), join(""));
    exports.base32crockford = chain(radix2(5), alphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ"), join(""), normalize((s) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")));
    exports.base64 = chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), padding(6), join(""));
    exports.base64url = chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), padding(6), join(""));
    var genBase58 = (abc) => chain(radix(58), alphabet(abc), join(""));
    exports.base58 = genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
    exports.base58flickr = genBase58("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ");
    exports.base58xrp = genBase58("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
    var XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
    exports.base58xmr = {
      encode(data) {
        let res = "";
        for (let i = 0; i < data.length; i += 8) {
          const block = data.subarray(i, i + 8);
          res += exports.base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], "1");
        }
        return res;
      },
      decode(str) {
        let res = [];
        for (let i = 0; i < str.length; i += 11) {
          const slice = str.slice(i, i + 11);
          const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
          const block = exports.base58.decode(slice);
          for (let j = 0; j < block.length - blockLen; j++) {
            if (block[j] !== 0)
              throw new Error("base58xmr: wrong padding");
          }
          res = res.concat(Array.from(block.slice(block.length - blockLen)));
        }
        return Uint8Array.from(res);
      }
    };
    var base58check = (sha256) => chain(checksum(4, (data) => sha256(sha256(data))), exports.base58);
    exports.base58check = base58check;
    var BECH_ALPHABET = chain(alphabet("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), join(""));
    var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
    function bech32Polymod(pre) {
      const b = pre >> 25;
      let chk = (pre & 33554431) << 5;
      for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
        if ((b >> i & 1) === 1)
          chk ^= POLYMOD_GENERATORS[i];
      }
      return chk;
    }
    function bechChecksum(prefix, words, encodingConst = 1) {
      const len = prefix.length;
      let chk = 1;
      for (let i = 0; i < len; i++) {
        const c = prefix.charCodeAt(i);
        if (c < 33 || c > 126)
          throw new Error(`Invalid prefix (${prefix})`);
        chk = bech32Polymod(chk) ^ c >> 5;
      }
      chk = bech32Polymod(chk);
      for (let i = 0; i < len; i++)
        chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 31;
      for (let v of words)
        chk = bech32Polymod(chk) ^ v;
      for (let i = 0; i < 6; i++)
        chk = bech32Polymod(chk);
      chk ^= encodingConst;
      return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
    }
    function genBech32(encoding) {
      const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
      const _words = radix2(5);
      const fromWords = _words.decode;
      const toWords = _words.encode;
      const fromWordsUnsafe = unsafeWrapper(fromWords);
      function encode(prefix, words, limit = 90) {
        if (typeof prefix !== "string")
          throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
        if (!Array.isArray(words) || words.length && typeof words[0] !== "number")
          throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
        const actualLength = prefix.length + 7 + words.length;
        if (limit !== false && actualLength > limit)
          throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
        prefix = prefix.toLowerCase();
        return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
      }
      function decode(str, limit = 90) {
        if (typeof str !== "string")
          throw new Error(`bech32.decode input should be string, not ${typeof str}`);
        if (str.length < 8 || limit !== false && str.length > limit)
          throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
        const lowered = str.toLowerCase();
        if (str !== lowered && str !== str.toUpperCase())
          throw new Error(`String must be lowercase or uppercase`);
        str = lowered;
        const sepIndex = str.lastIndexOf("1");
        if (sepIndex === 0 || sepIndex === -1)
          throw new Error(`Letter "1" must be present between prefix and data only`);
        const prefix = str.slice(0, sepIndex);
        const _words2 = str.slice(sepIndex + 1);
        if (_words2.length < 6)
          throw new Error("Data must be at least 6 characters long");
        const words = BECH_ALPHABET.decode(_words2).slice(0, -6);
        const sum = bechChecksum(prefix, words, ENCODING_CONST);
        if (!_words2.endsWith(sum))
          throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
        return { prefix, words };
      }
      const decodeUnsafe = unsafeWrapper(decode);
      function decodeToBytes(str) {
        const { prefix, words } = decode(str, false);
        return { prefix, words, bytes: fromWords(words) };
      }
      return { encode, decode, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
    }
    exports.bech32 = genBech32("bech32");
    exports.bech32m = genBech32("bech32m");
    exports.utf8 = {
      encode: (data) => new TextDecoder().decode(data),
      decode: (str) => new TextEncoder().encode(str)
    };
    exports.hex = chain(radix2(4), alphabet("0123456789abcdef"), join(""), normalize((s) => {
      if (typeof s !== "string" || s.length % 2)
        throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
      return s.toLowerCase();
    }));
    var CODERS = {
      utf8: exports.utf8,
      hex: exports.hex,
      base16: exports.base16,
      base32: exports.base32,
      base64: exports.base64,
      base64url: exports.base64url,
      base58: exports.base58,
      base58xmr: exports.base58xmr
    };
    var coderTypeError = `Invalid encoding type. Available types: ${Object.keys(CODERS).join(", ")}`;
    var bytesToString = (type, bytes) => {
      if (typeof type !== "string" || !CODERS.hasOwnProperty(type))
        throw new TypeError(coderTypeError);
      if (!(bytes instanceof Uint8Array))
        throw new TypeError("bytesToString() expects Uint8Array");
      return CODERS[type].encode(bytes);
    };
    exports.bytesToString = bytesToString;
    exports.str = exports.bytesToString;
    var stringToBytes = (type, str) => {
      if (!CODERS.hasOwnProperty(type))
        throw new TypeError(coderTypeError);
      if (typeof str !== "string")
        throw new TypeError("stringToBytes() expects string");
      return CODERS[type].decode(str);
    };
    exports.stringToBytes = stringToBytes;
    exports.bytes = exports.stringToBytes;
  }
});

// node_modules/.pnpm/light-bolt11-decoder@3.2.0/node_modules/light-bolt11-decoder/bolt11.js
var require_bolt11 = __commonJS({
  "node_modules/.pnpm/light-bolt11-decoder@3.2.0/node_modules/light-bolt11-decoder/bolt11.js"(exports, module) {
    var { bech32, hex, utf8 } = require_lib();
    var DEFAULTNETWORK = {
      // default network is bitcoin
      bech32: "bc",
      pubKeyHash: 0,
      scriptHash: 5,
      validWitnessVersions: [0]
    };
    var TESTNETWORK = {
      bech32: "tb",
      pubKeyHash: 111,
      scriptHash: 196,
      validWitnessVersions: [0]
    };
    var SIGNETNETWORK = {
      bech32: "tbs",
      pubKeyHash: 111,
      scriptHash: 196,
      validWitnessVersions: [0]
    };
    var REGTESTNETWORK = {
      bech32: "bcrt",
      pubKeyHash: 111,
      scriptHash: 196,
      validWitnessVersions: [0]
    };
    var SIMNETWORK = {
      bech32: "sb",
      pubKeyHash: 63,
      scriptHash: 123,
      validWitnessVersions: [0]
    };
    var FEATUREBIT_ORDER = [
      "option_data_loss_protect",
      "initial_routing_sync",
      "option_upfront_shutdown_script",
      "gossip_queries",
      "var_onion_optin",
      "gossip_queries_ex",
      "option_static_remotekey",
      "payment_secret",
      "basic_mpp",
      "option_support_large_channel"
    ];
    var DIVISORS = {
      m: BigInt(1e3),
      u: BigInt(1e6),
      n: BigInt(1e9),
      p: BigInt(1e12)
    };
    var MAX_MILLISATS = BigInt("2100000000000000000");
    var MILLISATS_PER_BTC = BigInt(1e11);
    var TAGCODES = {
      payment_hash: 1,
      payment_secret: 16,
      description: 13,
      payee: 19,
      description_hash: 23,
      // commit to longer descriptions (used by lnurl-pay)
      expiry: 6,
      // default: 3600 (1 hour)
      min_final_cltv_expiry: 24,
      // default: 9
      fallback_address: 9,
      route_hint: 3,
      // for extra routing info (private etc.)
      feature_bits: 5,
      metadata: 27
    };
    var TAGNAMES = {};
    for (let i = 0, keys = Object.keys(TAGCODES); i < keys.length; i++) {
      const currentName = keys[i];
      const currentCode = TAGCODES[keys[i]].toString();
      TAGNAMES[currentCode] = currentName;
    }
    var TAGPARSERS = {
      1: (words) => hex.encode(bech32.fromWordsUnsafe(words)),
      // 256 bits
      16: (words) => hex.encode(bech32.fromWordsUnsafe(words)),
      // 256 bits
      13: (words) => utf8.encode(bech32.fromWordsUnsafe(words)),
      // string variable length
      19: (words) => hex.encode(bech32.fromWordsUnsafe(words)),
      // 264 bits
      23: (words) => hex.encode(bech32.fromWordsUnsafe(words)),
      // 256 bits
      27: (words) => hex.encode(bech32.fromWordsUnsafe(words)),
      // variable
      6: wordsToIntBE,
      // default: 3600 (1 hour)
      24: wordsToIntBE,
      // default: 9
      3: routingInfoParser,
      // for extra routing info (private etc.)
      5: featureBitsParser
      // keep feature bits as array of 5 bit words
    };
    function getUnknownParser(tagCode) {
      return (words) => ({
        tagCode: parseInt(tagCode),
        words: bech32.encode("unknown", words, Number.MAX_SAFE_INTEGER)
      });
    }
    function wordsToIntBE(words) {
      return words.reverse().reduce((total, item, index) => {
        return total + item * Math.pow(32, index);
      }, 0);
    }
    function routingInfoParser(words) {
      const routes = [];
      let pubkey, shortChannelId, feeBaseMSats, feeProportionalMillionths, cltvExpiryDelta;
      let routesBuffer = bech32.fromWordsUnsafe(words);
      while (routesBuffer.length > 0) {
        pubkey = hex.encode(routesBuffer.slice(0, 33));
        shortChannelId = hex.encode(routesBuffer.slice(33, 41));
        feeBaseMSats = parseInt(hex.encode(routesBuffer.slice(41, 45)), 16);
        feeProportionalMillionths = parseInt(
          hex.encode(routesBuffer.slice(45, 49)),
          16
        );
        cltvExpiryDelta = parseInt(hex.encode(routesBuffer.slice(49, 51)), 16);
        routesBuffer = routesBuffer.slice(51);
        routes.push({
          pubkey,
          short_channel_id: shortChannelId,
          fee_base_msat: feeBaseMSats,
          fee_proportional_millionths: feeProportionalMillionths,
          cltv_expiry_delta: cltvExpiryDelta
        });
      }
      return routes;
    }
    function featureBitsParser(words) {
      const bools = words.slice().reverse().map((word) => [
        !!(word & 1),
        !!(word & 2),
        !!(word & 4),
        !!(word & 8),
        !!(word & 16)
      ]).reduce((finalArr, itemArr) => finalArr.concat(itemArr), []);
      while (bools.length < FEATUREBIT_ORDER.length * 2) {
        bools.push(false);
      }
      const featureBits = {};
      FEATUREBIT_ORDER.forEach((featureName, index) => {
        let status;
        if (bools[index * 2]) {
          status = "required";
        } else if (bools[index * 2 + 1]) {
          status = "supported";
        } else {
          status = "unsupported";
        }
        featureBits[featureName] = status;
      });
      const extraBits = bools.slice(FEATUREBIT_ORDER.length * 2);
      featureBits.extra_bits = {
        start_bit: FEATUREBIT_ORDER.length * 2,
        bits: extraBits,
        has_required: extraBits.reduce(
          (result, bit, index) => index % 2 !== 0 ? result || false : result || bit,
          false
        )
      };
      return featureBits;
    }
    function hrpToMillisat(hrpString, outputString) {
      let divisor, value;
      if (hrpString.slice(-1).match(/^[munp]$/)) {
        divisor = hrpString.slice(-1);
        value = hrpString.slice(0, -1);
      } else if (hrpString.slice(-1).match(/^[^munp0-9]$/)) {
        throw new Error("Not a valid multiplier for the amount");
      } else {
        value = hrpString;
      }
      if (!value.match(/^\d+$/))
        throw new Error("Not a valid human readable amount");
      const valueBN = BigInt(value);
      const millisatoshisBN = divisor ? valueBN * MILLISATS_PER_BTC / DIVISORS[divisor] : valueBN * MILLISATS_PER_BTC;
      if (divisor === "p" && !(valueBN % BigInt(10) === BigInt(0)) || millisatoshisBN > MAX_MILLISATS) {
        throw new Error("Amount is outside of valid range");
      }
      return outputString ? millisatoshisBN.toString() : millisatoshisBN;
    }
    function decode(paymentRequest, network) {
      if (typeof paymentRequest !== "string")
        throw new Error("Lightning Payment Request must be string");
      if (paymentRequest.slice(0, 2).toLowerCase() !== "ln")
        throw new Error("Not a proper lightning payment request");
      const sections = [];
      const decoded = bech32.decode(paymentRequest, Number.MAX_SAFE_INTEGER);
      paymentRequest = paymentRequest.toLowerCase();
      const prefix = decoded.prefix;
      let words = decoded.words;
      let letters = paymentRequest.slice(prefix.length + 1);
      let sigWords = words.slice(-104);
      words = words.slice(0, -104);
      let prefixMatches = prefix.match(/^ln(\S+?)(\d*)([a-zA-Z]?)$/);
      if (prefixMatches && !prefixMatches[2])
        prefixMatches = prefix.match(/^ln(\S+)$/);
      if (!prefixMatches) {
        throw new Error("Not a proper lightning payment request");
      }
      sections.push({
        name: "lightning_network",
        letters: "ln"
      });
      const bech32Prefix = prefixMatches[1];
      let coinNetwork;
      if (!network) {
        switch (bech32Prefix) {
          case DEFAULTNETWORK.bech32:
            coinNetwork = DEFAULTNETWORK;
            break;
          case TESTNETWORK.bech32:
            coinNetwork = TESTNETWORK;
            break;
          case SIGNETNETWORK.bech32:
            coinNetwork = SIGNETNETWORK;
            break;
          case REGTESTNETWORK.bech32:
            coinNetwork = REGTESTNETWORK;
            break;
          case SIMNETWORK.bech32:
            coinNetwork = SIMNETWORK;
            break;
        }
      } else {
        if (network.bech32 === void 0 || network.pubKeyHash === void 0 || network.scriptHash === void 0 || !Array.isArray(network.validWitnessVersions))
          throw new Error("Invalid network");
        coinNetwork = network;
      }
      if (!coinNetwork || coinNetwork.bech32 !== bech32Prefix) {
        throw new Error("Unknown coin bech32 prefix");
      }
      sections.push({
        name: "coin_network",
        letters: bech32Prefix,
        value: coinNetwork
      });
      const value = prefixMatches[2];
      let millisatoshis;
      if (value) {
        const divisor = prefixMatches[3];
        millisatoshis = hrpToMillisat(value + divisor, true);
        sections.push({
          name: "amount",
          letters: prefixMatches[2] + prefixMatches[3],
          value: millisatoshis
        });
      } else {
        millisatoshis = null;
      }
      sections.push({
        name: "separator",
        letters: "1"
      });
      const timestamp = wordsToIntBE(words.slice(0, 7));
      words = words.slice(7);
      sections.push({
        name: "timestamp",
        letters: letters.slice(0, 7),
        value: timestamp
      });
      letters = letters.slice(7);
      let tagName, parser, tagLength, tagWords;
      while (words.length > 0) {
        const tagCode = words[0].toString();
        tagName = TAGNAMES[tagCode] || "unknown_tag";
        parser = TAGPARSERS[tagCode] || getUnknownParser(tagCode);
        words = words.slice(1);
        tagLength = wordsToIntBE(words.slice(0, 2));
        words = words.slice(2);
        tagWords = words.slice(0, tagLength);
        words = words.slice(tagLength);
        sections.push({
          name: tagName,
          tag: letters[0],
          letters: letters.slice(0, 1 + 2 + tagLength),
          value: parser(tagWords)
          // see: parsers for more comments
        });
        letters = letters.slice(1 + 2 + tagLength);
      }
      sections.push({
        name: "signature",
        letters: letters.slice(0, 104),
        value: hex.encode(bech32.fromWordsUnsafe(sigWords))
      });
      letters = letters.slice(104);
      sections.push({
        name: "checksum",
        letters
      });
      let result = {
        paymentRequest,
        sections,
        get expiry() {
          let exp = sections.find((s) => s.name === "expiry");
          if (exp) return getValue("timestamp") + exp.value;
        },
        get route_hints() {
          return sections.filter((s) => s.name === "route_hint").map((s) => s.value);
        }
      };
      for (let name in TAGCODES) {
        if (name === "route_hint") {
          continue;
        }
        Object.defineProperty(result, name, {
          get() {
            return getValue(name);
          }
        });
      }
      return result;
      function getValue(name) {
        let section = sections.find((s) => s.name === name);
        return section ? section.value : void 0;
      }
    }
    module.exports = {
      decode,
      hrpToMillisat
    };
  }
});
export default require_bolt11();
/*! Bundled license information:

@scure/base/lib/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=light-bolt11-decoder.js.map
