const STL_VIEWER_SCRIPT_URL = "https://hzrd149.github.io/simple-stl-viewer/component.js";

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

/**
 * Dynamically loads the STL viewer web component script.
 * Only loads once, subsequent calls return the same promise.
 */
export function loadSTLViewerComponent(): Promise<void> {
  if (scriptLoaded) {
    return Promise.resolve();
  }

  if (scriptLoading) {
    return scriptLoading;
  }

  scriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = STL_VIEWER_SCRIPT_URL;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = null;
      resolve();
    };

    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Failed to load STL viewer component"));
    };

    document.head.appendChild(script);
  });

  return scriptLoading;
}
