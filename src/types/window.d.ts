interface Window {
  CACHE_RELAY_ENABLED: boolean;
  IMAGE_PROXY_PATH: string;
  REQUEST_PROXY: string;
}

// STL Viewer Web Component
declare namespace JSX {
  interface IntrinsicElements {
    "stl-viewer": {
      src: string;
      width?: number;
      height?: number;
      "cors-proxy"?: string;
      "auto-resize"?: boolean | "true" | "false";
      style?: React.CSSProperties;
    };
  }
}
