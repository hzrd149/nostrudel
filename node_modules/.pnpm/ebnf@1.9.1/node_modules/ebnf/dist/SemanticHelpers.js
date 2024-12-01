"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findChildrenByType = void 0;
/**
 * Finds all the direct childs of a specifyed type
 */
function findChildrenByType(token, type) {
    return token.children ? token.children.filter(x => x.type == type) : [];
}
exports.findChildrenByType = findChildrenByType;
//# sourceMappingURL=SemanticHelpers.js.map