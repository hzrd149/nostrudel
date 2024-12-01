"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalBlueprint = void 0;
var classnames_1 = __importDefault(require("classnames"));
var kebabCase_1 = __importDefault(require("lodash/kebabCase"));
var React = __importStar(require("react"));
var contextTypes_1 = require("../contextTypes");
var OptionalBlueprint;
(function (OptionalBlueprint) {
    OptionalBlueprint.Icon = function (_a) {
        var icon = _a.icon, className = _a.className, _b = _a.size, size = _b === void 0 ? 'standard' : _b;
        var blueprintNamespace = React.useContext(contextTypes_1.MosaicContext).blueprintNamespace;
        return (React.createElement("span", { className: (0, classnames_1.default)(className, getIconClass(blueprintNamespace, icon), "".concat(blueprintNamespace, "-icon-").concat(size)) }));
    };
    function getClasses(blueprintNamespace) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return names.map(function (name) { return "".concat(blueprintNamespace, "-").concat((0, kebabCase_1.default)(name)); }).join(' ');
    }
    OptionalBlueprint.getClasses = getClasses;
    function getIconClass(blueprintNamespace, iconName) {
        return "".concat(blueprintNamespace, "-icon-").concat((0, kebabCase_1.default)(iconName));
    }
    OptionalBlueprint.getIconClass = getIconClass;
})(OptionalBlueprint = exports.OptionalBlueprint || (exports.OptionalBlueprint = {}));
//# sourceMappingURL=OptionalBlueprint.js.map