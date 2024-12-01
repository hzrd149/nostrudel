import React from "react";
import { Result } from "@zxing/library";
export declare const BarcodeScannerComponent: ({ onUpdate, onError, width, height, facingMode, torch, delay, videoConstraints, stopStream, }: {
    onUpdate: (arg0: unknown, arg1?: Result) => void;
    onError?: (arg0: string | DOMException) => void;
    width?: number | string;
    height?: number | string;
    facingMode?: "environment" | "user";
    torch?: boolean;
    delay?: number;
    videoConstraints?: MediaTrackConstraints;
    stopStream?: boolean;
}) => React.ReactElement;
export default BarcodeScannerComponent;
