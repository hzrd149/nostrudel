/// <reference types="react" />
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicPath } from './types';
export interface MosaicDropTargetProps {
    position: MosaicDropTargetPosition;
    path: MosaicPath;
}
export declare function MosaicDropTarget({ path, position }: MosaicDropTargetProps): JSX.Element;
