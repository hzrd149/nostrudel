import type { XYCoord } from 'dnd-core';
export declare function getNodeClientOffset(node: Element): XYCoord | undefined;
export declare function getEventClientTouchOffset(e: TouchEvent, lastTargetTouchFallback?: Touch): XYCoord | undefined;
export declare function getEventClientOffset(e: TouchEvent | Touch | MouseEvent, lastTargetTouchFallback?: Touch): XYCoord | undefined;
