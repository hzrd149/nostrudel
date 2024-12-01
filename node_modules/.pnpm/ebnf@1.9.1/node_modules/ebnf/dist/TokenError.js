"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenError = void 0;
class TokenError extends Error {
    constructor(message, token) {
        super(message);
        this.message = message;
        this.token = token;
        if (token && token.errors)
            token.errors.push(this);
        else
            throw this;
    }
    inspect() {
        return 'SyntaxError: ' + this.message;
    }
}
exports.TokenError = TokenError;
//# sourceMappingURL=TokenError.js.map