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
exports.SplitButton = void 0;
var classnames_1 = __importDefault(require("classnames"));
var noop_1 = __importDefault(require("lodash/noop"));
var react_1 = __importDefault(require("react"));
var contextTypes_1 = require("../contextTypes");
var OptionalBlueprint_1 = require("../util/OptionalBlueprint");
var MosaicButton_1 = require("./MosaicButton");
var SplitButton = /** @class */ (function (_super) {
    __extends(SplitButton, _super);
    function SplitButton() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.split = function () {
            _this.context.mosaicWindowActions
                .split()
                .then(function () {
                if (_this.props.onClick) {
                    _this.props.onClick();
                }
            })
                .catch(noop_1.default); // Swallow rejections (i.e. on user cancel)
        };
        return _this;
    }
    SplitButton.prototype.render = function () {
        return (react_1.default.createElement(MosaicButton_1.DefaultToolbarButton, { title: "Split Window", className: (0, classnames_1.default)('split-button', OptionalBlueprint_1.OptionalBlueprint.getIconClass(this.context.blueprintNamespace, 'ADD_COLUMN_RIGHT')), onClick: this.split }));
    };
    SplitButton.contextType = contextTypes_1.MosaicWindowContext;
    return SplitButton;
}(react_1.default.PureComponent));
exports.SplitButton = SplitButton;
//# sourceMappingURL=SplitButton.js.map