import { isTouchEvent } from './predicates.js';
const ELEMENT_NODE = 1;
export function getNodeClientOffset(node) {
    const el = node.nodeType === ELEMENT_NODE ? node : node.parentElement;
    if (!el) {
        return undefined;
    }
    const { top , left  } = el.getBoundingClientRect();
    return {
        x: left,
        y: top
    };
}
export function getEventClientTouchOffset(e, lastTargetTouchFallback) {
    if (e.targetTouches.length === 1) {
        return getEventClientOffset(e.targetTouches[0]);
    } else if (lastTargetTouchFallback && e.touches.length === 1) {
        if (e.touches[0].target === lastTargetTouchFallback.target) {
            return getEventClientOffset(e.touches[0]);
        }
    }
    return;
}
export function getEventClientOffset(e, lastTargetTouchFallback) {
    if (isTouchEvent(e)) {
        return getEventClientTouchOffset(e, lastTargetTouchFallback);
    } else {
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
}

//# sourceMappingURL=offsets.js.map