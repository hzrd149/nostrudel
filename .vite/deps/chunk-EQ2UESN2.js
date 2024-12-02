import {
  getDecodedToken
} from "./chunk-AJWI4TU2.js";
import {
  findAndReplace
} from "./chunk-6OYQNWY5.js";
import {
  unified
} from "./chunk-WIEPG7PB.js";
import {
  getEmojiTag,
  getHashtagTag
} from "./chunk-CTT4SYZK.js";
import {
  IMAGE_EXT,
  convertToUrl,
  getURLFilename
} from "./chunk-3HQGVAVI.js";
import {
  decode
} from "./chunk-MG7C4QW5.js";

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/cache.js
function getCachedValue(event, symbol) {
  return event[symbol];
}
function getOrComputeCachedValue(event, symbol, compute) {
  let cached = getCachedValue(event, symbol);
  if (!cached) {
    cached = event[symbol] = compute(event);
  }
  return cached;
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/helpers/regexp.js
var Expressions = {
  get cashu() {
    return /(cashu(?:A|B)[A-Za-z0-9_-]{100,10000}={0,3})/gi;
  },
  get nostrLink() {
    return /(?:nostr:)?((npub|note|nprofile|nevent|nrelay|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/gi;
  },
  get emoji() {
    return /:([a-zA-Z0-9_-]+):/gi;
  },
  get hashtag() {
    return /(?:^|[^\p{L}])#([\p{L}\p{N}\p{M}]+)/gu;
  }
};
var regexp_default = Expressions;

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/mentions.js
function nostrMentions() {
  return (tree) => {
    findAndReplace(tree, [
      [
        regexp_default.nostrLink,
        (_, $1) => {
          try {
            return {
              type: "mention",
              decoded: decode($1),
              encoded: $1
            };
          } catch (error) {
          }
          return false;
        }
      ]
    ]);
  };
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/cashu.js
function cashuTokens() {
  return (tree) => {
    findAndReplace(tree, [
      [
        regexp_default.cashu,
        (_, $1) => {
          try {
            const token = getDecodedToken($1);
            return {
              type: "cashu",
              token,
              raw: $1
            };
          } catch (error) {
          }
          return false;
        }
      ]
    ]);
  };
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/emoji.js
function emojis() {
  return (tree) => {
    const event = tree.event;
    if (!event)
      return;
    findAndReplace(tree, [
      [
        regexp_default.emoji,
        (full, $1) => {
          try {
            const tag = getEmojiTag(event, $1);
            if (!tag)
              return false;
            return {
              type: "emoji",
              tag,
              raw: full,
              code: tag[1].toLowerCase(),
              url: tag[2]
            };
          } catch (error) {
          }
          return false;
        }
      ]
    ]);
  };
}

// node_modules/.pnpm/linkifyjs@4.1.3/node_modules/linkifyjs/dist/linkify.es.js
var encodedTlds = "aaa1rp3bb0ott3vie4c1le2ogado5udhabi7c0ademy5centure6ountant0s9o1tor4d0s1ult4e0g1ro2tna4f0l1rica5g0akhan5ency5i0g1rbus3force5tel5kdn3l0ibaba4pay4lfinanz6state5y2sace3tom5m0azon4ericanexpress7family11x2fam3ica3sterdam8nalytics7droid5quan4z2o0l2partments8p0le4q0uarelle8r0ab1mco4chi3my2pa2t0e3s0da2ia2sociates9t0hleta5torney7u0ction5di0ble3o3spost5thor3o0s4vianca6w0s2x0a2z0ure5ba0by2idu3namex3narepublic11d1k2r0celona5laycard4s5efoot5gains6seball5ketball8uhaus5yern5b0c1t1va3cg1n2d1e0ats2uty4er2ntley5rlin4st0buy5t2f1g1h0arti5i0ble3d1ke2ng0o3o1z2j1lack0friday9ockbuster8g1omberg7ue3m0s1w2n0pparibas9o0ats3ehringer8fa2m1nd2o0k0ing5sch2tik2on4t1utique6x2r0adesco6idgestone9oadway5ker3ther5ussels7s1t1uild0ers6siness6y1zz3v1w1y1z0h3ca0b1fe2l0l1vinklein9m0era3p2non3petown5ital0one8r0avan4ds2e0er0s4s2sa1e1h1ino4t0ering5holic7ba1n1re3c1d1enter4o1rn3f0a1d2g1h0anel2nel4rity4se2t2eap3intai5ristmas6ome4urch5i0priani6rcle4sco3tadel4i0c2y3k1l0aims4eaning6ick2nic1que6othing5ud3ub0med6m1n1o0ach3des3ffee4llege4ogne5m0cast4mbank4unity6pany2re3uter5sec4ndos3struction8ulting7tact3ractors9oking4l1p2rsica5untry4pon0s4rses6pa2r0edit0card4union9icket5own3s1uise0s6u0isinella9v1w1x1y0mru3ou3z2dabur3d1nce3ta1e1ing3sun4y2clk3ds2e0al0er2s3gree4livery5l1oitte5ta3mocrat6ntal2ist5si0gn4v2hl2iamonds6et2gital5rect0ory7scount3ver5h2y2j1k1m1np2o0cs1tor4g1mains5t1wnload7rive4tv2ubai3nlop4pont4rban5vag2r2z2earth3t2c0o2deka3u0cation8e1g1mail3erck5nergy4gineer0ing9terprises10pson4quipment8r0icsson6ni3s0q1tate5t1u0rovision8s2vents5xchange6pert3osed4ress5traspace10fage2il1rwinds6th3mily4n0s2rm0ers5shion4t3edex3edback6rrari3ero6i0delity5o2lm2nal1nce1ial7re0stone6mdale6sh0ing5t0ness6j1k1lickr3ghts4r2orist4wers5y2m1o0o0d1tball6rd1ex2sale4um3undation8x2r0ee1senius7l1ogans4ntier7tr2ujitsu5n0d2rniture7tbol5yi3ga0l0lery3o1up4me0s3p1rden4y2b0iz3d0n2e0a1nt0ing5orge5f1g0ee3h1i0ft0s3ves2ing5l0ass3e1obal2o4m0ail3bh2o1x2n1odaddy5ld0point6f2o0dyear5g0le4p1t1v2p1q1r0ainger5phics5tis4een3ipe3ocery4up4s1t1u0ardian6cci3ge2ide2tars5ru3w1y2hair2mburg5ngout5us3bo2dfc0bank7ealth0care8lp1sinki6re1mes5iphop4samitsu7tachi5v2k0t2m1n1ockey4ldings5iday5medepot5goods5s0ense7nda3rse3spital5t0ing5t0els3mail5use3w2r1sbc3t1u0ghes5yatt3undai7ibm2cbc2e1u2d1e0ee3fm2kano4l1m0amat4db2mo0bilien9n0c1dustries8finiti5o2g1k1stitute6urance4e4t0ernational10uit4vestments10o1piranga7q1r0ish4s0maili5t0anbul7t0au2v3jaguar4va3cb2e0ep2tzt3welry6io2ll2m0p2nj2o0bs1urg4t1y2p0morgan6rs3uegos4niper7kaufen5ddi3e0rryhotels6logistics9properties14fh2g1h1i0a1ds2m1ndle4tchen5wi3m1n1oeln3matsu5sher5p0mg2n2r0d1ed3uokgroup8w1y0oto4z2la0caixa5mborghini8er3ncaster6d0rover6xess5salle5t0ino3robe5w0yer5b1c1ds2ease3clerc5frak4gal2o2xus4gbt3i0dl2fe0insurance9style7ghting6ke2lly3mited4o2ncoln4k2psy3ve1ing5k1lc1p2oan0s3cker3us3l1ndon4tte1o3ve3pl0financial11r1s1t0d0a3u0ndbeck6xe1ury5v1y2ma0drid4if1son4keup4n0agement7go3p1rket0ing3s4riott5shalls7ttel5ba2c0kinsey7d1e0d0ia3et2lbourne7me1orial6n0u2rckmsd7g1h1iami3crosoft7l1ni1t2t0subishi9k1l0b1s2m0a2n1o0bi0le4da2e1i1m1nash3ey2ster5rmon3tgage6scow4to0rcycles9v0ie4p1q1r1s0d2t0n1r2u0seum3ic4v1w1x1y1z2na0b1goya4me2tura4vy3ba2c1e0c1t0bank4flix4work5ustar5w0s2xt0direct7us4f0l2g0o2hk2i0co2ke1on3nja3ssan1y5l1o0kia3rton4w0ruz3tv4p1r0a1w2tt2u1yc2z2obi1server7ffice5kinawa6layan0group9dnavy5lo3m0ega4ne1g1l0ine5oo2pen3racle3nge4g0anic5igins6saka4tsuka4t2vh3pa0ge2nasonic7ris2s1tners4s1y3y2ccw3e0t2f0izer5g1h0armacy6d1ilips5one2to0graphy6s4ysio5ics1tet2ures6d1n0g1k2oneer5zza4k1l0ace2y0station9umbing5s3m1n0c2ohl2ker3litie5rn2st3r0america6xi3ess3ime3o0d0uctions8f1gressive8mo2perties3y5tection8u0dential9s1t1ub2w0c2y2qa1pon3uebec3st5racing4dio4e0ad1lestate6tor2y4cipes5d0stone5umbrella9hab3ise0n3t2liance6n0t0als5pair3ort3ublican8st0aurant8view0s5xroth6ich0ardli6oh3l1o1p2o0cks3deo3gers4om3s0vp3u0gby3hr2n2w0e2yukyu6sa0arland6fe0ty4kura4le1on3msclub4ung5ndvik0coromant12ofi4p1rl2s1ve2xo3b0i1s2c0a1b1haeffler7midt4olarships8ol3ule3warz5ience5ot3d1e0arch3t2cure1ity6ek2lect4ner3rvices6ven3w1x0y3fr2g1h0angrila6rp2w2ell3ia1ksha5oes2p0ping5uji3w3i0lk2na1gles5te3j1k0i0n2y0pe4l0ing4m0art3ile4n0cf3o0ccer3ial4ftbank4ware6hu2lar2utions7ng1y2y2pa0ce3ort2t3r0l2s1t0ada2ples4r1tebank4farm7c0group6ockholm6rage3e3ream4udio2y3yle4u0cks3pplies3y2ort5rf1gery5zuki5v1watch4iss4x1y0dney4stems6z2tab1ipei4lk2obao4rget4tamotors6r2too4x0i3c0i2d0k2eam2ch0nology8l1masek5nnis4va3f1g1h0d1eater2re6iaa2ckets5enda4ps2res2ol4j0maxx4x2k0maxx5l1m0all4n1o0day3kyo3ols3p1ray3shiba5tal3urs3wn2yota3s3r0ade1ing4ining5vel0ers0insurance16ust3v2t1ube2i1nes3shu4v0s2w1z2ua1bank3s2g1k1nicom3versity8o2ol2ps2s1y1z2va0cations7na1guard7c1e0gas3ntures6risign5mögensberater2ung14sicherung10t2g1i0ajes4deo3g1king4llas4n1p1rgin4sa1ion4va1o3laanderen9n1odka3lvo3te1ing3o2yage5u2wales2mart4ter4ng0gou5tch0es6eather0channel12bcam3er2site5d0ding5ibo2r3f1hoswho6ien2ki2lliamhill9n0dows4e1ners6me2olterskluwer11odside6rk0s2ld3w2s1tc1f3xbox3erox4finity6ihuan4n2xx2yz3yachts4hoo3maxun5ndex5e1odobashi7ga2kohama6u0tube6t1un3za0ppos4ra3ero3ip2m1one3uerich6w2";
var encodedUtlds = "ελ1υ2бг1ел3дети4ею2католик6ом3мкд2он1сква6онлайн5рг3рус2ф2сайт3рб3укр3қаз3հայ3ישראל5קום3ابوظبي5رامكو5لاردن4بحرين5جزائر5سعودية6عليان5مغرب5مارات5یران5بارت2زار4يتك3ھارت5تونس4سودان3رية5شبكة4عراق2ب2مان4فلسطين6قطر3كاثوليك6وم3مصر2ليسيا5وريتانيا7قع4همراه5پاکستان7ڀارت4कॉम3नेट3भारत0म्3ोत5संगठन5বাংলা5ভারত2ৰত4ਭਾਰਤ4ભારત4ଭାରତ4இந்தியா6லங்கை6சிங்கப்பூர்11భారత్5ಭಾರತ4ഭാരതം5ලංකා4คอม3ไทย3ລາວ3გე2みんな3アマゾン4クラウド4グーグル4コム2ストア3セール3ファッション6ポイント4世界2中信1国1國1文网3亚马逊3企业2佛山2信息2健康2八卦2公司1益2台湾1灣2商城1店1标2嘉里0大酒店5在线2大拿2天主教3娱乐2家電2广东2微博2慈善2我爱你3手机2招聘2政务1府2新加坡2闻2时尚2書籍2机构2淡马锡3游戏2澳門2点看2移动2组织机构4网址1店1站1络2联通2谷歌2购物2通販2集团2電訊盈科4飞利浦3食品2餐厅2香格里拉3港2닷넷1컴2삼성2한국2";
var assign = (target, properties) => {
  for (const key in properties) {
    target[key] = properties[key];
  }
  return target;
};
var numeric = "numeric";
var ascii = "ascii";
var alpha = "alpha";
var asciinumeric = "asciinumeric";
var alphanumeric = "alphanumeric";
var domain = "domain";
var emoji = "emoji";
var scheme = "scheme";
var slashscheme = "slashscheme";
var whitespace = "whitespace";
function registerGroup(name, groups) {
  if (!(name in groups)) {
    groups[name] = [];
  }
  return groups[name];
}
function addToGroups(t, flags, groups) {
  if (flags[numeric]) {
    flags[asciinumeric] = true;
    flags[alphanumeric] = true;
  }
  if (flags[ascii]) {
    flags[asciinumeric] = true;
    flags[alpha] = true;
  }
  if (flags[asciinumeric]) {
    flags[alphanumeric] = true;
  }
  if (flags[alpha]) {
    flags[alphanumeric] = true;
  }
  if (flags[alphanumeric]) {
    flags[domain] = true;
  }
  if (flags[emoji]) {
    flags[domain] = true;
  }
  for (const k in flags) {
    const group = registerGroup(k, groups);
    if (group.indexOf(t) < 0) {
      group.push(t);
    }
  }
}
function flagsForToken(t, groups) {
  const result = {};
  for (const c in groups) {
    if (groups[c].indexOf(t) >= 0) {
      result[c] = true;
    }
  }
  return result;
}
function State(token) {
  if (token === void 0) {
    token = null;
  }
  this.j = {};
  this.jr = [];
  this.jd = null;
  this.t = token;
}
State.groups = {};
State.prototype = {
  accepts() {
    return !!this.t;
  },
  /**
   * Follow an existing transition from the given input to the next state.
   * Does not mutate.
   * @param {string} input character or token type to transition on
   * @returns {?State<T>} the next state, if any
   */
  go(input) {
    const state = this;
    const nextState = state.j[input];
    if (nextState) {
      return nextState;
    }
    for (let i = 0; i < state.jr.length; i++) {
      const regex = state.jr[i][0];
      const nextState2 = state.jr[i][1];
      if (nextState2 && regex.test(input)) {
        return nextState2;
      }
    }
    return state.jd;
  },
  /**
   * Whether the state has a transition for the given input. Set the second
   * argument to true to only look for an exact match (and not a default or
   * regular-expression-based transition)
   * @param {string} input
   * @param {boolean} exactOnly
   */
  has(input, exactOnly) {
    if (exactOnly === void 0) {
      exactOnly = false;
    }
    return exactOnly ? input in this.j : !!this.go(input);
  },
  /**
   * Short for "transition all"; create a transition from the array of items
   * in the given list to the same final resulting state.
   * @param {string | string[]} inputs Group of inputs to transition on
   * @param {Transition<T> | State<T>} [next] Transition options
   * @param {Flags} [flags] Collections flags to add token to
   * @param {Collections<T>} [groups] Master list of token groups
   */
  ta(inputs, next, flags, groups) {
    for (let i = 0; i < inputs.length; i++) {
      this.tt(inputs[i], next, flags, groups);
    }
  },
  /**
   * Short for "take regexp transition"; defines a transition for this state
   * when it encounters a token which matches the given regular expression
   * @param {RegExp} regexp Regular expression transition (populate first)
   * @param {T | State<T>} [next] Transition options
   * @param {Flags} [flags] Collections flags to add token to
   * @param {Collections<T>} [groups] Master list of token groups
   * @returns {State<T>} taken after the given input
   */
  tr(regexp2, next, flags, groups) {
    groups = groups || State.groups;
    let nextState;
    if (next && next.j) {
      nextState = next;
    } else {
      nextState = new State(next);
      if (flags && groups) {
        addToGroups(next, flags, groups);
      }
    }
    this.jr.push([regexp2, nextState]);
    return nextState;
  },
  /**
   * Short for "take transitions", will take as many sequential transitions as
   * the length of the given input and returns the
   * resulting final state.
   * @param {string | string[]} input
   * @param {T | State<T>} [next] Transition options
   * @param {Flags} [flags] Collections flags to add token to
   * @param {Collections<T>} [groups] Master list of token groups
   * @returns {State<T>} taken after the given input
   */
  ts(input, next, flags, groups) {
    let state = this;
    const len = input.length;
    if (!len) {
      return state;
    }
    for (let i = 0; i < len - 1; i++) {
      state = state.tt(input[i]);
    }
    return state.tt(input[len - 1], next, flags, groups);
  },
  /**
   * Short for "take transition", this is a method for building/working with
   * state machines.
   *
   * If a state already exists for the given input, returns it.
   *
   * If a token is specified, that state will emit that token when reached by
   * the linkify engine.
   *
   * If no state exists, it will be initialized with some default transitions
   * that resemble existing default transitions.
   *
   * If a state is given for the second argument, that state will be
   * transitioned to on the given input regardless of what that input
   * previously did.
   *
   * Specify a token group flags to define groups that this token belongs to.
   * The token will be added to corresponding entires in the given groups
   * object.
   *
   * @param {string} input character, token type to transition on
   * @param {T | State<T>} [next] Transition options
   * @param {Flags} [flags] Collections flags to add token to
   * @param {Collections<T>} [groups] Master list of groups
   * @returns {State<T>} taken after the given input
   */
  tt(input, next, flags, groups) {
    groups = groups || State.groups;
    const state = this;
    if (next && next.j) {
      state.j[input] = next;
      return next;
    }
    const t = next;
    let nextState, templateState = state.go(input);
    if (templateState) {
      nextState = new State();
      assign(nextState.j, templateState.j);
      nextState.jr.push.apply(nextState.jr, templateState.jr);
      nextState.jd = templateState.jd;
      nextState.t = templateState.t;
    } else {
      nextState = new State();
    }
    if (t) {
      if (groups) {
        if (nextState.t && typeof nextState.t === "string") {
          const allFlags = assign(flagsForToken(nextState.t, groups), flags);
          addToGroups(t, allFlags, groups);
        } else if (flags) {
          addToGroups(t, flags, groups);
        }
      }
      nextState.t = t;
    }
    state.j[input] = nextState;
    return nextState;
  }
};
var ta = (state, input, next, flags, groups) => state.ta(input, next, flags, groups);
var tr = (state, regexp2, next, flags, groups) => state.tr(regexp2, next, flags, groups);
var ts = (state, input, next, flags, groups) => state.ts(input, next, flags, groups);
var tt = (state, input, next, flags, groups) => state.tt(input, next, flags, groups);
var WORD = "WORD";
var UWORD = "UWORD";
var LOCALHOST = "LOCALHOST";
var TLD = "TLD";
var UTLD = "UTLD";
var SCHEME = "SCHEME";
var SLASH_SCHEME = "SLASH_SCHEME";
var NUM = "NUM";
var WS = "WS";
var NL$1 = "NL";
var OPENBRACE = "OPENBRACE";
var CLOSEBRACE = "CLOSEBRACE";
var OPENBRACKET = "OPENBRACKET";
var CLOSEBRACKET = "CLOSEBRACKET";
var OPENPAREN = "OPENPAREN";
var CLOSEPAREN = "CLOSEPAREN";
var OPENANGLEBRACKET = "OPENANGLEBRACKET";
var CLOSEANGLEBRACKET = "CLOSEANGLEBRACKET";
var FULLWIDTHLEFTPAREN = "FULLWIDTHLEFTPAREN";
var FULLWIDTHRIGHTPAREN = "FULLWIDTHRIGHTPAREN";
var LEFTCORNERBRACKET = "LEFTCORNERBRACKET";
var RIGHTCORNERBRACKET = "RIGHTCORNERBRACKET";
var LEFTWHITECORNERBRACKET = "LEFTWHITECORNERBRACKET";
var RIGHTWHITECORNERBRACKET = "RIGHTWHITECORNERBRACKET";
var FULLWIDTHLESSTHAN = "FULLWIDTHLESSTHAN";
var FULLWIDTHGREATERTHAN = "FULLWIDTHGREATERTHAN";
var AMPERSAND = "AMPERSAND";
var APOSTROPHE = "APOSTROPHE";
var ASTERISK = "ASTERISK";
var AT = "AT";
var BACKSLASH = "BACKSLASH";
var BACKTICK = "BACKTICK";
var CARET = "CARET";
var COLON = "COLON";
var COMMA = "COMMA";
var DOLLAR = "DOLLAR";
var DOT = "DOT";
var EQUALS = "EQUALS";
var EXCLAMATION = "EXCLAMATION";
var HYPHEN = "HYPHEN";
var PERCENT = "PERCENT";
var PIPE = "PIPE";
var PLUS = "PLUS";
var POUND = "POUND";
var QUERY = "QUERY";
var QUOTE = "QUOTE";
var SEMI = "SEMI";
var SLASH = "SLASH";
var TILDE = "TILDE";
var UNDERSCORE = "UNDERSCORE";
var EMOJI$1 = "EMOJI";
var SYM = "SYM";
var tk = Object.freeze({
  __proto__: null,
  WORD,
  UWORD,
  LOCALHOST,
  TLD,
  UTLD,
  SCHEME,
  SLASH_SCHEME,
  NUM,
  WS,
  NL: NL$1,
  OPENBRACE,
  CLOSEBRACE,
  OPENBRACKET,
  CLOSEBRACKET,
  OPENPAREN,
  CLOSEPAREN,
  OPENANGLEBRACKET,
  CLOSEANGLEBRACKET,
  FULLWIDTHLEFTPAREN,
  FULLWIDTHRIGHTPAREN,
  LEFTCORNERBRACKET,
  RIGHTCORNERBRACKET,
  LEFTWHITECORNERBRACKET,
  RIGHTWHITECORNERBRACKET,
  FULLWIDTHLESSTHAN,
  FULLWIDTHGREATERTHAN,
  AMPERSAND,
  APOSTROPHE,
  ASTERISK,
  AT,
  BACKSLASH,
  BACKTICK,
  CARET,
  COLON,
  COMMA,
  DOLLAR,
  DOT,
  EQUALS,
  EXCLAMATION,
  HYPHEN,
  PERCENT,
  PIPE,
  PLUS,
  POUND,
  QUERY,
  QUOTE,
  SEMI,
  SLASH,
  TILDE,
  UNDERSCORE,
  EMOJI: EMOJI$1,
  SYM
});
var ASCII_LETTER = /[a-z]/;
var LETTER = new RegExp("\\p{L}", "u");
var EMOJI = new RegExp("\\p{Emoji}", "u");
var EMOJI_VARIATION$1 = /\ufe0f/;
var DIGIT = /\d/;
var SPACE = /\s/;
var regexp = Object.freeze({
  __proto__: null,
  ASCII_LETTER,
  LETTER,
  EMOJI,
  EMOJI_VARIATION: EMOJI_VARIATION$1,
  DIGIT,
  SPACE
});
var NL = "\n";
var EMOJI_VARIATION = "️";
var EMOJI_JOINER = "‍";
var tlds = null;
var utlds = null;
function init$2(customSchemes) {
  if (customSchemes === void 0) {
    customSchemes = [];
  }
  const groups = {};
  State.groups = groups;
  const Start = new State();
  if (tlds == null) {
    tlds = decodeTlds(encodedTlds);
  }
  if (utlds == null) {
    utlds = decodeTlds(encodedUtlds);
  }
  tt(Start, "'", APOSTROPHE);
  tt(Start, "{", OPENBRACE);
  tt(Start, "}", CLOSEBRACE);
  tt(Start, "[", OPENBRACKET);
  tt(Start, "]", CLOSEBRACKET);
  tt(Start, "(", OPENPAREN);
  tt(Start, ")", CLOSEPAREN);
  tt(Start, "<", OPENANGLEBRACKET);
  tt(Start, ">", CLOSEANGLEBRACKET);
  tt(Start, "（", FULLWIDTHLEFTPAREN);
  tt(Start, "）", FULLWIDTHRIGHTPAREN);
  tt(Start, "「", LEFTCORNERBRACKET);
  tt(Start, "」", RIGHTCORNERBRACKET);
  tt(Start, "『", LEFTWHITECORNERBRACKET);
  tt(Start, "』", RIGHTWHITECORNERBRACKET);
  tt(Start, "＜", FULLWIDTHLESSTHAN);
  tt(Start, "＞", FULLWIDTHGREATERTHAN);
  tt(Start, "&", AMPERSAND);
  tt(Start, "*", ASTERISK);
  tt(Start, "@", AT);
  tt(Start, "`", BACKTICK);
  tt(Start, "^", CARET);
  tt(Start, ":", COLON);
  tt(Start, ",", COMMA);
  tt(Start, "$", DOLLAR);
  tt(Start, ".", DOT);
  tt(Start, "=", EQUALS);
  tt(Start, "!", EXCLAMATION);
  tt(Start, "-", HYPHEN);
  tt(Start, "%", PERCENT);
  tt(Start, "|", PIPE);
  tt(Start, "+", PLUS);
  tt(Start, "#", POUND);
  tt(Start, "?", QUERY);
  tt(Start, '"', QUOTE);
  tt(Start, "/", SLASH);
  tt(Start, ";", SEMI);
  tt(Start, "~", TILDE);
  tt(Start, "_", UNDERSCORE);
  tt(Start, "\\", BACKSLASH);
  const Num = tr(Start, DIGIT, NUM, {
    [numeric]: true
  });
  tr(Num, DIGIT, Num);
  const Word = tr(Start, ASCII_LETTER, WORD, {
    [ascii]: true
  });
  tr(Word, ASCII_LETTER, Word);
  const UWord = tr(Start, LETTER, UWORD, {
    [alpha]: true
  });
  tr(UWord, ASCII_LETTER);
  tr(UWord, LETTER, UWord);
  const Ws = tr(Start, SPACE, WS, {
    [whitespace]: true
  });
  tt(Start, NL, NL$1, {
    [whitespace]: true
  });
  tt(Ws, NL);
  tr(Ws, SPACE, Ws);
  const Emoji = tr(Start, EMOJI, EMOJI$1, {
    [emoji]: true
  });
  tr(Emoji, EMOJI, Emoji);
  tt(Emoji, EMOJI_VARIATION, Emoji);
  const EmojiJoiner = tt(Emoji, EMOJI_JOINER);
  tr(EmojiJoiner, EMOJI, Emoji);
  const wordjr = [[ASCII_LETTER, Word]];
  const uwordjr = [[ASCII_LETTER, null], [LETTER, UWord]];
  for (let i = 0; i < tlds.length; i++) {
    fastts(Start, tlds[i], TLD, WORD, wordjr);
  }
  for (let i = 0; i < utlds.length; i++) {
    fastts(Start, utlds[i], UTLD, UWORD, uwordjr);
  }
  addToGroups(TLD, {
    tld: true,
    ascii: true
  }, groups);
  addToGroups(UTLD, {
    utld: true,
    alpha: true
  }, groups);
  fastts(Start, "file", SCHEME, WORD, wordjr);
  fastts(Start, "mailto", SCHEME, WORD, wordjr);
  fastts(Start, "http", SLASH_SCHEME, WORD, wordjr);
  fastts(Start, "https", SLASH_SCHEME, WORD, wordjr);
  fastts(Start, "ftp", SLASH_SCHEME, WORD, wordjr);
  fastts(Start, "ftps", SLASH_SCHEME, WORD, wordjr);
  addToGroups(SCHEME, {
    scheme: true,
    ascii: true
  }, groups);
  addToGroups(SLASH_SCHEME, {
    slashscheme: true,
    ascii: true
  }, groups);
  customSchemes = customSchemes.sort((a, b) => a[0] > b[0] ? 1 : -1);
  for (let i = 0; i < customSchemes.length; i++) {
    const sch = customSchemes[i][0];
    const optionalSlashSlash = customSchemes[i][1];
    const flags = optionalSlashSlash ? {
      [scheme]: true
    } : {
      [slashscheme]: true
    };
    if (sch.indexOf("-") >= 0) {
      flags[domain] = true;
    } else if (!ASCII_LETTER.test(sch)) {
      flags[numeric] = true;
    } else if (DIGIT.test(sch)) {
      flags[asciinumeric] = true;
    } else {
      flags[ascii] = true;
    }
    ts(Start, sch, sch, flags);
  }
  ts(Start, "localhost", LOCALHOST, {
    ascii: true
  });
  Start.jd = new State(SYM);
  return {
    start: Start,
    tokens: assign({
      groups
    }, tk)
  };
}
function run$1(start, str) {
  const iterable = stringToArray(str.replace(/[A-Z]/g, (c) => c.toLowerCase()));
  const charCount = iterable.length;
  const tokens = [];
  let cursor = 0;
  let charCursor = 0;
  while (charCursor < charCount) {
    let state = start;
    let nextState = null;
    let tokenLength = 0;
    let latestAccepting = null;
    let sinceAccepts = -1;
    let charsSinceAccepts = -1;
    while (charCursor < charCount && (nextState = state.go(iterable[charCursor]))) {
      state = nextState;
      if (state.accepts()) {
        sinceAccepts = 0;
        charsSinceAccepts = 0;
        latestAccepting = state;
      } else if (sinceAccepts >= 0) {
        sinceAccepts += iterable[charCursor].length;
        charsSinceAccepts++;
      }
      tokenLength += iterable[charCursor].length;
      cursor += iterable[charCursor].length;
      charCursor++;
    }
    cursor -= sinceAccepts;
    charCursor -= charsSinceAccepts;
    tokenLength -= sinceAccepts;
    tokens.push({
      t: latestAccepting.t,
      // token type/name
      v: str.slice(cursor - tokenLength, cursor),
      // string value
      s: cursor - tokenLength,
      // start index
      e: cursor
      // end index (excluding)
    });
  }
  return tokens;
}
function stringToArray(str) {
  const result = [];
  const len = str.length;
  let index = 0;
  while (index < len) {
    let first = str.charCodeAt(index);
    let second;
    let char = first < 55296 || first > 56319 || index + 1 === len || (second = str.charCodeAt(index + 1)) < 56320 || second > 57343 ? str[index] : str.slice(index, index + 2);
    result.push(char);
    index += char.length;
  }
  return result;
}
function fastts(state, input, t, defaultt, jr) {
  let next;
  const len = input.length;
  for (let i = 0; i < len - 1; i++) {
    const char = input[i];
    if (state.j[char]) {
      next = state.j[char];
    } else {
      next = new State(defaultt);
      next.jr = jr.slice();
      state.j[char] = next;
    }
    state = next;
  }
  next = new State(t);
  next.jr = jr.slice();
  state.j[input[len - 1]] = next;
  return next;
}
function decodeTlds(encoded) {
  const words = [];
  const stack = [];
  let i = 0;
  let digits = "0123456789";
  while (i < encoded.length) {
    let popDigitCount = 0;
    while (digits.indexOf(encoded[i + popDigitCount]) >= 0) {
      popDigitCount++;
    }
    if (popDigitCount > 0) {
      words.push(stack.join(""));
      for (let popCount = parseInt(encoded.substring(i, i + popDigitCount), 10); popCount > 0; popCount--) {
        stack.pop();
      }
      i += popDigitCount;
    } else {
      stack.push(encoded[i]);
      i++;
    }
  }
  return words;
}
var defaults = {
  defaultProtocol: "http",
  events: null,
  format: noop,
  formatHref: noop,
  nl2br: false,
  tagName: "a",
  target: null,
  rel: null,
  validate: true,
  truncate: Infinity,
  className: null,
  attributes: null,
  ignoreTags: [],
  render: null
};
function Options(opts, defaultRender) {
  if (defaultRender === void 0) {
    defaultRender = null;
  }
  let o = assign({}, defaults);
  if (opts) {
    o = assign(o, opts instanceof Options ? opts.o : opts);
  }
  const ignoredTags = o.ignoreTags;
  const uppercaseIgnoredTags = [];
  for (let i = 0; i < ignoredTags.length; i++) {
    uppercaseIgnoredTags.push(ignoredTags[i].toUpperCase());
  }
  this.o = o;
  if (defaultRender) {
    this.defaultRender = defaultRender;
  }
  this.ignoreTags = uppercaseIgnoredTags;
}
Options.prototype = {
  o: defaults,
  /**
   * @type string[]
   */
  ignoreTags: [],
  /**
   * @param {IntermediateRepresentation} ir
   * @returns {any}
   */
  defaultRender(ir) {
    return ir;
  },
  /**
   * Returns true or false based on whether a token should be displayed as a
   * link based on the user options.
   * @param {MultiToken} token
   * @returns {boolean}
   */
  check(token) {
    return this.get("validate", token.toString(), token);
  },
  // Private methods
  /**
   * Resolve an option's value based on the value of the option and the given
   * params. If operator and token are specified and the target option is
   * callable, automatically calls the function with the given argument.
   * @template {keyof Opts} K
   * @param {K} key Name of option to use
   * @param {string} [operator] will be passed to the target option if it's a
   * function. If not specified, RAW function value gets returned
   * @param {MultiToken} [token] The token from linkify.tokenize
   * @returns {Opts[K] | any}
   */
  get(key, operator, token) {
    const isCallable = operator != null;
    let option = this.o[key];
    if (!option) {
      return option;
    }
    if (typeof option === "object") {
      option = token.t in option ? option[token.t] : defaults[key];
      if (typeof option === "function" && isCallable) {
        option = option(operator, token);
      }
    } else if (typeof option === "function" && isCallable) {
      option = option(operator, token.t, token);
    }
    return option;
  },
  /**
   * @template {keyof Opts} L
   * @param {L} key Name of options object to use
   * @param {string} [operator]
   * @param {MultiToken} [token]
   * @returns {Opts[L] | any}
   */
  getObj(key, operator, token) {
    let obj = this.o[key];
    if (typeof obj === "function" && operator != null) {
      obj = obj(operator, token.t, token);
    }
    return obj;
  },
  /**
   * Convert the given token to a rendered element that may be added to the
   * calling-interface's DOM
   * @param {MultiToken} token Token to render to an HTML element
   * @returns {any} Render result; e.g., HTML string, DOM element, React
   *   Component, etc.
   */
  render(token) {
    const ir = token.render(this);
    const renderFn = this.get("render", null, token) || this.defaultRender;
    return renderFn(ir, token.t, token);
  }
};
function noop(val) {
  return val;
}
var options = Object.freeze({
  __proto__: null,
  defaults,
  Options,
  assign
});
function MultiToken(value, tokens) {
  this.t = "token";
  this.v = value;
  this.tk = tokens;
}
MultiToken.prototype = {
  isLink: false,
  /**
   * Return the string this token represents.
   * @return {string}
   */
  toString() {
    return this.v;
  },
  /**
   * What should the value for this token be in the `href` HTML attribute?
   * Returns the `.toString` value by default.
   * @param {string} [scheme]
   * @return {string}
  */
  toHref(scheme2) {
    return this.toString();
  },
  /**
   * @param {Options} options Formatting options
   * @returns {string}
   */
  toFormattedString(options2) {
    const val = this.toString();
    const truncate = options2.get("truncate", val, this);
    const formatted = options2.get("format", val, this);
    return truncate && formatted.length > truncate ? formatted.substring(0, truncate) + "…" : formatted;
  },
  /**
   *
   * @param {Options} options
   * @returns {string}
   */
  toFormattedHref(options2) {
    return options2.get("formatHref", this.toHref(options2.get("defaultProtocol")), this);
  },
  /**
   * The start index of this token in the original input string
   * @returns {number}
   */
  startIndex() {
    return this.tk[0].s;
  },
  /**
   * The end index of this token in the original input string (up to this
   * index but not including it)
   * @returns {number}
   */
  endIndex() {
    return this.tk[this.tk.length - 1].e;
  },
  /**
  	Returns an object  of relevant values for this token, which includes keys
  	* type - Kind of token ('url', 'email', etc.)
  	* value - Original text
  	* href - The value that should be added to the anchor tag's href
  		attribute
  		@method toObject
  	@param {string} [protocol] `'http'` by default
  */
  toObject(protocol) {
    if (protocol === void 0) {
      protocol = defaults.defaultProtocol;
    }
    return {
      type: this.t,
      value: this.toString(),
      isLink: this.isLink,
      href: this.toHref(protocol),
      start: this.startIndex(),
      end: this.endIndex()
    };
  },
  /**
   *
   * @param {Options} options Formatting option
   */
  toFormattedObject(options2) {
    return {
      type: this.t,
      value: this.toFormattedString(options2),
      isLink: this.isLink,
      href: this.toFormattedHref(options2),
      start: this.startIndex(),
      end: this.endIndex()
    };
  },
  /**
   * Whether this token should be rendered as a link according to the given options
   * @param {Options} options
   * @returns {boolean}
   */
  validate(options2) {
    return options2.get("validate", this.toString(), this);
  },
  /**
   * Return an object that represents how this link should be rendered.
   * @param {Options} options Formattinng options
   */
  render(options2) {
    const token = this;
    const href = this.toHref(options2.get("defaultProtocol"));
    const formattedHref = options2.get("formatHref", href, this);
    const tagName = options2.get("tagName", href, token);
    const content = this.toFormattedString(options2);
    const attributes = {};
    const className = options2.get("className", href, token);
    const target = options2.get("target", href, token);
    const rel = options2.get("rel", href, token);
    const attrs = options2.getObj("attributes", href, token);
    const eventListeners = options2.getObj("events", href, token);
    attributes.href = formattedHref;
    if (className) {
      attributes.class = className;
    }
    if (target) {
      attributes.target = target;
    }
    if (rel) {
      attributes.rel = rel;
    }
    if (attrs) {
      assign(attributes, attrs);
    }
    return {
      tagName,
      attributes,
      content,
      eventListeners
    };
  }
};
function createTokenClass(type, props) {
  class Token extends MultiToken {
    constructor(value, tokens) {
      super(value, tokens);
      this.t = type;
    }
  }
  for (const p in props) {
    Token.prototype[p] = props[p];
  }
  Token.t = type;
  return Token;
}
var Email = createTokenClass("email", {
  isLink: true,
  toHref() {
    return "mailto:" + this.toString();
  }
});
var Text = createTokenClass("text");
var Nl = createTokenClass("nl");
var Url = createTokenClass("url", {
  isLink: true,
  /**
  	Lowercases relevant parts of the domain and adds the protocol if
  	required. Note that this will not escape unsafe HTML characters in the
  	URL.
  		@param {string} [scheme] default scheme (e.g., 'https')
  	@return {string} the full href
  */
  toHref(scheme2) {
    if (scheme2 === void 0) {
      scheme2 = defaults.defaultProtocol;
    }
    return this.hasProtocol() ? this.v : `${scheme2}://${this.v}`;
  },
  /**
   * Check whether this URL token has a protocol
   * @return {boolean}
   */
  hasProtocol() {
    const tokens = this.tk;
    return tokens.length >= 2 && tokens[0].t !== LOCALHOST && tokens[1].t === COLON;
  }
});
var multi = Object.freeze({
  __proto__: null,
  MultiToken,
  Base: MultiToken,
  createTokenClass,
  Email,
  Text,
  Nl,
  Url
});
var makeState = (arg) => new State(arg);
function init$1(_ref) {
  let {
    groups
  } = _ref;
  const qsAccepting = groups.domain.concat([AMPERSAND, ASTERISK, AT, BACKSLASH, BACKTICK, CARET, DOLLAR, EQUALS, HYPHEN, NUM, PERCENT, PIPE, PLUS, POUND, SLASH, SYM, TILDE, UNDERSCORE]);
  const qsNonAccepting = [APOSTROPHE, COLON, COMMA, DOT, EXCLAMATION, QUERY, QUOTE, SEMI, OPENANGLEBRACKET, CLOSEANGLEBRACKET, OPENBRACE, CLOSEBRACE, CLOSEBRACKET, OPENBRACKET, OPENPAREN, CLOSEPAREN, FULLWIDTHLEFTPAREN, FULLWIDTHRIGHTPAREN, LEFTCORNERBRACKET, RIGHTCORNERBRACKET, LEFTWHITECORNERBRACKET, RIGHTWHITECORNERBRACKET, FULLWIDTHLESSTHAN, FULLWIDTHGREATERTHAN];
  const localpartAccepting = [AMPERSAND, APOSTROPHE, ASTERISK, BACKSLASH, BACKTICK, CARET, DOLLAR, EQUALS, HYPHEN, OPENBRACE, CLOSEBRACE, PERCENT, PIPE, PLUS, POUND, QUERY, SLASH, SYM, TILDE, UNDERSCORE];
  const Start = makeState();
  const Localpart = tt(Start, TILDE);
  ta(Localpart, localpartAccepting, Localpart);
  ta(Localpart, groups.domain, Localpart);
  const Domain = makeState(), Scheme = makeState(), SlashScheme = makeState();
  ta(Start, groups.domain, Domain);
  ta(Start, groups.scheme, Scheme);
  ta(Start, groups.slashscheme, SlashScheme);
  ta(Domain, localpartAccepting, Localpart);
  ta(Domain, groups.domain, Domain);
  const LocalpartAt = tt(Domain, AT);
  tt(Localpart, AT, LocalpartAt);
  tt(Scheme, AT, LocalpartAt);
  tt(SlashScheme, AT, LocalpartAt);
  const LocalpartDot = tt(Localpart, DOT);
  ta(LocalpartDot, localpartAccepting, Localpart);
  ta(LocalpartDot, groups.domain, Localpart);
  const EmailDomain = makeState();
  ta(LocalpartAt, groups.domain, EmailDomain);
  ta(EmailDomain, groups.domain, EmailDomain);
  const EmailDomainDot = tt(EmailDomain, DOT);
  ta(EmailDomainDot, groups.domain, EmailDomain);
  const Email$1 = makeState(Email);
  ta(EmailDomainDot, groups.tld, Email$1);
  ta(EmailDomainDot, groups.utld, Email$1);
  tt(LocalpartAt, LOCALHOST, Email$1);
  const EmailDomainHyphen = tt(EmailDomain, HYPHEN);
  ta(EmailDomainHyphen, groups.domain, EmailDomain);
  ta(Email$1, groups.domain, EmailDomain);
  tt(Email$1, DOT, EmailDomainDot);
  tt(Email$1, HYPHEN, EmailDomainHyphen);
  const EmailColon = tt(Email$1, COLON);
  ta(EmailColon, groups.numeric, Email);
  const DomainHyphen = tt(Domain, HYPHEN);
  const DomainDot = tt(Domain, DOT);
  ta(DomainHyphen, groups.domain, Domain);
  ta(DomainDot, localpartAccepting, Localpart);
  ta(DomainDot, groups.domain, Domain);
  const DomainDotTld = makeState(Url);
  ta(DomainDot, groups.tld, DomainDotTld);
  ta(DomainDot, groups.utld, DomainDotTld);
  ta(DomainDotTld, groups.domain, Domain);
  ta(DomainDotTld, localpartAccepting, Localpart);
  tt(DomainDotTld, DOT, DomainDot);
  tt(DomainDotTld, HYPHEN, DomainHyphen);
  tt(DomainDotTld, AT, LocalpartAt);
  const DomainDotTldColon = tt(DomainDotTld, COLON);
  const DomainDotTldColonPort = makeState(Url);
  ta(DomainDotTldColon, groups.numeric, DomainDotTldColonPort);
  const Url$1 = makeState(Url);
  const UrlNonaccept = makeState();
  ta(Url$1, qsAccepting, Url$1);
  ta(Url$1, qsNonAccepting, UrlNonaccept);
  ta(UrlNonaccept, qsAccepting, Url$1);
  ta(UrlNonaccept, qsNonAccepting, UrlNonaccept);
  tt(DomainDotTld, SLASH, Url$1);
  tt(DomainDotTldColonPort, SLASH, Url$1);
  const SchemeColon = tt(Scheme, COLON);
  const SlashSchemeColon = tt(SlashScheme, COLON);
  const SlashSchemeColonSlash = tt(SlashSchemeColon, SLASH);
  const UriPrefix = tt(SlashSchemeColonSlash, SLASH);
  ta(Scheme, groups.domain, Domain);
  tt(Scheme, DOT, DomainDot);
  tt(Scheme, HYPHEN, DomainHyphen);
  ta(SlashScheme, groups.domain, Domain);
  tt(SlashScheme, DOT, DomainDot);
  tt(SlashScheme, HYPHEN, DomainHyphen);
  ta(SchemeColon, groups.domain, Url$1);
  tt(SchemeColon, SLASH, Url$1);
  ta(UriPrefix, groups.domain, Url$1);
  ta(UriPrefix, qsAccepting, Url$1);
  tt(UriPrefix, SLASH, Url$1);
  const bracketPairs = [
    [OPENBRACE, CLOSEBRACE],
    // {}
    [OPENBRACKET, CLOSEBRACKET],
    // []
    [OPENPAREN, CLOSEPAREN],
    // ()
    [OPENANGLEBRACKET, CLOSEANGLEBRACKET],
    // <>
    [FULLWIDTHLEFTPAREN, FULLWIDTHRIGHTPAREN],
    // （）
    [LEFTCORNERBRACKET, RIGHTCORNERBRACKET],
    // 「」
    [LEFTWHITECORNERBRACKET, RIGHTWHITECORNERBRACKET],
    // 『』
    [FULLWIDTHLESSTHAN, FULLWIDTHGREATERTHAN]
    // ＜＞
  ];
  for (let i = 0; i < bracketPairs.length; i++) {
    const [OPEN, CLOSE] = bracketPairs[i];
    const UrlOpen = tt(Url$1, OPEN);
    tt(UrlNonaccept, OPEN, UrlOpen);
    tt(UrlOpen, CLOSE, Url$1);
    const UrlOpenQ = makeState(Url);
    ta(UrlOpen, qsAccepting, UrlOpenQ);
    const UrlOpenSyms = makeState();
    ta(UrlOpen, qsNonAccepting);
    ta(UrlOpenQ, qsAccepting, UrlOpenQ);
    ta(UrlOpenQ, qsNonAccepting, UrlOpenSyms);
    ta(UrlOpenSyms, qsAccepting, UrlOpenQ);
    ta(UrlOpenSyms, qsNonAccepting, UrlOpenSyms);
    tt(UrlOpenQ, CLOSE, Url$1);
    tt(UrlOpenSyms, CLOSE, Url$1);
  }
  tt(Start, LOCALHOST, DomainDotTld);
  tt(Start, NL$1, Nl);
  return {
    start: Start,
    tokens: tk
  };
}
function run(start, input, tokens) {
  let len = tokens.length;
  let cursor = 0;
  let multis = [];
  let textTokens = [];
  while (cursor < len) {
    let state = start;
    let secondState = null;
    let nextState = null;
    let multiLength = 0;
    let latestAccepting = null;
    let sinceAccepts = -1;
    while (cursor < len && !(secondState = state.go(tokens[cursor].t))) {
      textTokens.push(tokens[cursor++]);
    }
    while (cursor < len && (nextState = secondState || state.go(tokens[cursor].t))) {
      secondState = null;
      state = nextState;
      if (state.accepts()) {
        sinceAccepts = 0;
        latestAccepting = state;
      } else if (sinceAccepts >= 0) {
        sinceAccepts++;
      }
      cursor++;
      multiLength++;
    }
    if (sinceAccepts < 0) {
      cursor -= multiLength;
      if (cursor < len) {
        textTokens.push(tokens[cursor]);
        cursor++;
      }
    } else {
      if (textTokens.length > 0) {
        multis.push(initMultiToken(Text, input, textTokens));
        textTokens = [];
      }
      cursor -= sinceAccepts;
      multiLength -= sinceAccepts;
      const Multi = latestAccepting.t;
      const subtokens = tokens.slice(cursor - multiLength, cursor);
      multis.push(initMultiToken(Multi, input, subtokens));
    }
  }
  if (textTokens.length > 0) {
    multis.push(initMultiToken(Text, input, textTokens));
  }
  return multis;
}
function initMultiToken(Multi, input, tokens) {
  const startIdx = tokens[0].s;
  const endIdx = tokens[tokens.length - 1].e;
  const value = input.slice(startIdx, endIdx);
  return new Multi(value, tokens);
}
var INIT = {
  scanner: null,
  parser: null,
  tokenQueue: [],
  pluginQueue: [],
  customSchemes: [],
  initialized: false
};
function init() {
  INIT.scanner = init$2(INIT.customSchemes);
  for (let i = 0; i < INIT.tokenQueue.length; i++) {
    INIT.tokenQueue[i][1]({
      scanner: INIT.scanner
    });
  }
  INIT.parser = init$1(INIT.scanner.tokens);
  for (let i = 0; i < INIT.pluginQueue.length; i++) {
    INIT.pluginQueue[i][1]({
      scanner: INIT.scanner,
      parser: INIT.parser
    });
  }
  INIT.initialized = true;
}
function tokenize(str) {
  if (!INIT.initialized) {
    init();
  }
  return run(INIT.parser.start, str, run$1(INIT.scanner.start, str));
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/parser.js
function createTextNoteATS(event, content) {
  const tokens = tokenize(content || (typeof event === "string" ? event : event.content));
  return {
    type: "root",
    event: typeof event !== "string" ? event : void 0,
    children: tokens.map((token) => {
      if (token.isLink)
        return { type: "link", href: token.toHref(), value: token.toString() };
      else
        return { type: "text", value: token.v };
    })
  };
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/hashtag.js
function hashtags() {
  return (tree) => {
    const event = tree.event;
    if (!event)
      return;
    findAndReplace(tree, [
      [
        regexp_default.hashtag,
        (_, $1) => {
          try {
            const tag = getHashtagTag(event, $1);
            if (!tag)
              return false;
            return {
              type: "hashtag",
              tag,
              name: $1,
              hashtag: tag[1].toLowerCase()
            };
          } catch (error) {
          }
          return false;
        }
      ]
    ]);
  };
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/gallery.js
function galleries(types = IMAGE_EXT) {
  return (tree) => {
    let links = [];
    const commit = (i) => {
      if (links.length > 1) {
        const start = tree.children.indexOf(links[0]);
        const end = tree.children.indexOf(links[links.length - 1]);
        tree.children.splice(start, 1 + end - start, { type: "gallery", links: links.map((l) => l.href) });
        links = [];
        return end - 1;
      } else {
        links = [];
        return i;
      }
    };
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      try {
        if (node.type === "link") {
          const url = convertToUrl(node.href);
          const filename = getURLFilename(url);
          if (filename && types.some((ext) => filename.endsWith(ext))) {
            links.push(node);
          } else {
            i = commit(i);
          }
        } else if (node.type === "text" && links.length > 0) {
          const isEmpty = node.value === "\n" || !node.value.match(/[^\s]/g);
          if (!isEmpty)
            i = commit(i);
        }
      } catch (error) {
        i = commit(i);
      }
    }
  };
}

// node_modules/.pnpm/applesauce-content@0.7.0_typescript@5.6.2/node_modules/applesauce-content/dist/text/content.js
var ParsedTextContentSymbol = Symbol.for("parsed-text-content");
var defaultTransformers = [nostrMentions, galleries, emojis, hashtags, cashuTokens];
function getParsedTextContent(event, content, transformers = defaultTransformers) {
  if (typeof event === "string") {
    const processor = unified();
    for (const transformer of transformers) {
      processor.use(transformer);
    }
    return processor.runSync(createTextNoteATS(event, content));
  }
  return getOrComputeCachedValue(event, ParsedTextContentSymbol, () => {
    const processor = unified();
    for (const transformer of transformers) {
      processor.use(transformer);
    }
    return processor.runSync(createTextNoteATS(event, content));
  });
}
function removeParsedTextContent(event) {
  delete event[ParsedTextContentSymbol];
}

export {
  nostrMentions,
  cashuTokens,
  emojis,
  createTextNoteATS,
  hashtags,
  ParsedTextContentSymbol,
  defaultTransformers,
  getParsedTextContent,
  removeParsedTextContent
};
//# sourceMappingURL=chunk-EQ2UESN2.js.map
