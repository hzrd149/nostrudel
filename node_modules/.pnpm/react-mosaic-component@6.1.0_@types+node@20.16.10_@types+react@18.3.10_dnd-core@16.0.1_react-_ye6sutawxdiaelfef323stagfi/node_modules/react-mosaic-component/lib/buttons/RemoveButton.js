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
exports.RemoveButton = void 0;
var classnames_1 = __importDefault(require("classnames"));
var react_1 = __importDefault(require("react"));
var contextTypes_1 = require("../contextTypes");
var OptionalBlueprint_1 = require("../util/OptionalBlueprint");
var MosaicButton_1 = require("./MosaicButton");
var RemoveButton = /** @class */ (function (_super) {
    __extends(RemoveButton, _super);
    function RemoveButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RemoveButton.prototype.render = function () {
        var _this = this;
        return (react_1.default.createElement(contextTypes_1.MosaicContext.Consumer, null, function (_a) {
            var mosaicActions = _a.mosaicActions, blueprintNamespace = _a.blueprintNamespace;
            return (react_1.default.createElement(MosaicButton_1.DefaultToolbarButton, { title: "Close Window", className: (0, classnames_1.default)('close-button', OptionalBlueprint_1.OptionalBlueprint.getIconClass(blueprintNamespace, 'CROSS')), onClick: _this.createRemove(mosaicActions) }));
        }));
    };
    RemoveButton.prototype.createRemove = function (mosaicActions) {
        var _this = this;
        return function () {
            mosaicActions.remove(_this.context.mosaicWindowActions.getPath());
            if (_this.props.onClick) {
                _this.props.onClick();
            }
        };
    };
    RemoveButton.contextType = contextTypes_1.MosaicWindowContext;
    return RemoveButton;
}(react_1.default.PureComponent));
exports.RemoveButton = RemoveButton;
//# sourceMappingURL=RemoveButton.js.map