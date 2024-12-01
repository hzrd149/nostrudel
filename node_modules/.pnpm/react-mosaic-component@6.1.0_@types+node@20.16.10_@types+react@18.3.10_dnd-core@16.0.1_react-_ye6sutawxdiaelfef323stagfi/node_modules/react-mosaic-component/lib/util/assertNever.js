"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNever = void 0;
function assertNever(shouldBeNever) {
    throw new Error('Unhandled case: ' + JSON.stringify(shouldBeNever));
}
exports.assertNever = assertNever;
//# sourceMappingURL=assertNever.js.map