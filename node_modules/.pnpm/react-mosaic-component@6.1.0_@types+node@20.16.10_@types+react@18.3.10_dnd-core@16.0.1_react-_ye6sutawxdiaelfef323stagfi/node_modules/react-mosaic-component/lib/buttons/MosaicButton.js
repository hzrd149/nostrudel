"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultToolbarButton = exports.DefaultToolbarButton = void 0;
var classnames_1 = __importDefault(require("classnames"));
var react_1 = __importDefault(require("react"));
var contextTypes_1 = require("../contextTypes");
var OptionalBlueprint_1 = require("../util/OptionalBlueprint");
var DefaultToolbarButton = function (_a) {
    var title = _a.title, className = _a.className, onClick = _a.onClick, text = _a.text;
    var blueprintNamespace = react_1.default.useContext(contextTypes_1.MosaicContext).blueprintNamespace;
    return (react_1.default.createElement("button", { title: title, onClick: onClick, className: (0, classnames_1.default)('mosaic-default-control', OptionalBlueprint_1.OptionalBlueprint.getClasses(blueprintNamespace, 'BUTTON', 'MINIMAL'), className) }, text && react_1.default.createElement("span", { className: "control-text" }, text)));
};
exports.DefaultToolbarButton = DefaultToolbarButton;
/**
 * @deprecated: see @DefaultToolbarButton
 */
var createDefaultToolbarButton = function (title, className, onClick, text) { return react_1.default.createElement(exports.DefaultToolbarButton, { title: title, className: className, onClick: onClick, text: text }); };
exports.createDefaultToolbarButton = createDefaultToolbarButton;
//# sourceMappingURL=MosaicButton.js.map