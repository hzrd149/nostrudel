import useAppSettings from "./use-user-app-settings";

export default function useMaxPageWidth(fallback?: string) {
  const { maxPageWidth } = useAppSettings();

  switch (maxPageWidth) {
    case "sm":
      return "2xl";
    case "md":
      return "4xl";
    case "lg":
      return "6xl";
    case "xl":
      return "8xl";
    case "full":
      return "full";
    default:
    case "none":
      return fallback || "6xl";
  }
}
