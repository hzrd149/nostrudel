import { useEffect } from "react";

const appName = "noStrudel";

export function useAppTitle(title?: string) {
  useEffect(() => {
    document.title = [title, appName].filter(Boolean).join(" | ");

    return () => {
      document.title = appName;
    };
  }, [title]);
}
