"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MosaicZeroState = void 0;
var classnames_1 = __importDefault(require("classnames"));
var noop_1 = __importDefault(require("lodash/noop"));
var react_1 = __importDefault(require("react"));
var contextTypes_1 = require("./contextTypes");
var OptionalBlueprint_1 = require("./util/OptionalBlueprint");
var MosaicZeroState = /** @class */ (function (_super) {
    __extends(MosaicZeroState, _super);
    function MosaicZeroState() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.replace = function () {
            return Promise.resolve(_this.props.createNode())
                .then(function (node) { return _this.context.mosaicActions.replaceWith([], node); })
                .catch(noop_1.default);
        }; // Swallow rejections (i.e. on user cancel)
        return _this;
    }
    MosaicZeroState.prototype.render = function () {
        return (react_1.default.createElement("div", { className: (0, classnames_1.default)('mosaic-zero-state', OptionalBlueprint_1.OptionalBlueprint.getClasses(this.context.blueprintNamespace, 'NON_IDEAL_STATE')) },
            react_1.default.createElement("div", { className: OptionalBlueprint_1.OptionalBlueprint.getClasses(this.context.blueprintNamespace, 'NON_IDEAL_STATE_VISUAL') },
                react_1.default.createElement(OptionalBlueprint_1.OptionalBlueprint.Icon, { className: "default-zero-state-icon", size: "large", icon: "APPLICATIONS" })),
            react_1.default.createElement("h4", { className: OptionalBlueprint_1.OptionalBlueprint.getClasses(this.context.blueprintNamespace, 'HEADING') }, "No Windows Present"),
            react_1.default.createElement("div", null, this.props.createNode && (react_1.default.createElement("button", { className: (0, classnames_1.default)(OptionalBlueprint_1.OptionalBlueprint.getClasses(this.context.blueprintNamespace, 'BUTTON'), OptionalBlueprint_1.OptionalBlueprint.getIconClass(this.context.blueprintNamespace, 'ADD')), onClick: this.replace }, "Add New Window")))));
    };
    MosaicZeroState.contextType = contextTypes_1.MosaicContext;
    return MosaicZeroState;
}(react_1.default.PureComponent));
exports.MosaicZeroState = MosaicZeroState;
//# sourceMappingURL=MosaicZeroState.js.map