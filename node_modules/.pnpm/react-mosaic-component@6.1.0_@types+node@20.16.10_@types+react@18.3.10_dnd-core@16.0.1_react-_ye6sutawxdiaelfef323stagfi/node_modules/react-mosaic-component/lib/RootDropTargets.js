"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootDropTargets = void 0;
var classnames_1 = __importDefault(require("classnames"));
var values_1 = __importDefault(require("lodash/values"));
var react_1 = __importDefault(require("react"));
var react_dnd_1 = require("react-dnd");
var internalTypes_1 = require("./internalTypes");
var MosaicDropTarget_1 = require("./MosaicDropTarget");
var types_1 = require("./types");
exports.RootDropTargets = react_1.default.memo(function () {
    var isDragging = (0, react_dnd_1.useDrop)({
        accept: types_1.MosaicDragType.WINDOW,
        collect: function (monitor) { return ({
            isDragging: monitor.getItem() !== null && monitor.getItemType() === types_1.MosaicDragType.WINDOW,
        }); },
    })[0].isDragging;
    var delayedIsDragging = useDelayedTrue(isDragging, 0);
    return (react_1.default.createElement("div", { className: (0, classnames_1.default)('drop-target-container', {
            '-dragging': delayedIsDragging,
        }) }, (0, values_1.default)(internalTypes_1.MosaicDropTargetPosition).map(function (position) { return (react_1.default.createElement(MosaicDropTarget_1.MosaicDropTarget, { position: position, path: [], key: position })); })));
});
exports.RootDropTargets.displayName = 'RootDropTargets';
function useDelayedTrue(currentValue, delay) {
    var delayedRef = react_1.default.useRef(currentValue);
    var _a = react_1.default.useState(0), setCounter = _a[1];
    var setAndRender = function (newValue) {
        delayedRef.current = newValue;
        setCounter(function (count) { return count + 1; });
    };
    if (!currentValue) {
        delayedRef.current = false;
    }
    react_1.default.useEffect(function () {
        if (delayedRef.current === currentValue || !currentValue) {
            return;
        }
        var timer = window.setTimeout(function () { return setAndRender(true); }, delay);
        return function () {
            window.clearTimeout(timer);
        };
    }, [currentValue]);
    return delayedRef.current;
}
//# sourceMappingURL=RootDropTargets.js.map