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
exports.MosaicDropTarget = void 0;
var classnames_1 = __importDefault(require("classnames"));
var react_1 = __importStar(require("react"));
var react_dnd_1 = require("react-dnd");
var contextTypes_1 = require("./contextTypes");
var types_1 = require("./types");
function MosaicDropTarget(_a) {
    var path = _a.path, position = _a.position;
    var mosaicId = (0, react_1.useContext)(contextTypes_1.MosaicContext).mosaicId;
    var _b = (0, react_dnd_1.useDrop)({
        accept: types_1.MosaicDragType.WINDOW,
        drop: function (item, _monitor) {
            if (mosaicId === (item === null || item === void 0 ? void 0 : item.mosaicId)) {
                return { path: path, position: position };
            }
            else {
                return {};
            }
        },
        collect: function (monitor) { return ({
            isOver: monitor.isOver(),
            draggedMosaicId: (monitor.getItem() || {}).mosaicId,
        }); },
    }), _c = _b[0], isOver = _c.isOver, draggedMosaicId = _c.draggedMosaicId, connectDropTarget = _b[1];
    return (react_1.default.createElement("div", { ref: connectDropTarget, className: (0, classnames_1.default)('drop-target', position, {
            'drop-target-hover': isOver && draggedMosaicId === mosaicId,
        }) }));
}
exports.MosaicDropTarget = MosaicDropTarget;
//# sourceMappingURL=MosaicDropTarget.js.map