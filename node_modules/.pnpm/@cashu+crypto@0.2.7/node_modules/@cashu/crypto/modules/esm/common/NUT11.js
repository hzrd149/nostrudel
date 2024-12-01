"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSecret = void 0;
const parseSecret = (secret) => {
    try {
        if (secret instanceof Uint8Array) {
            secret = new TextDecoder().decode(secret);
        }
        return JSON.parse(secret);
    }
    catch (e) {
        throw new Error("can't parse secret");
    }
};
exports.parseSecret = parseSecret;
//# sourceMappingURL=NUT11.js.map