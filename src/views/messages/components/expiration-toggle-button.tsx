import { Button, ButtonProps } from "@chakra-ui/react";
import { useMemo } from "react";

const EXPIRATION_PRESETS: Record<string, number> = {
  "1h": 60 * 60,
  "1d": 60 * 60 * 24,
  "1w": 60 * 60 * 24 * 7,
  "2w": 60 * 60 * 24 * 14,
  "1m": 60 * 60 * 24 * 30,
  "1y": 60 * 60 * 24 * 365,
};

export type ExpirationToggleButtonProps = Omit<ButtonProps, "children" | "onClick" | "onChange" | "value"> & {
  /** Current expiration value in seconds, or undefined for "off" */
  value: number | null;
  /** Callback when expiration value changes */
  onChange: (seconds: number | null) => void;
  /** Optional custom presets to use instead of default */
  presets?: Record<string, number>;
};

export function ExpirationToggleButton({
  value,
  onChange,
  presets = EXPIRATION_PRESETS,
  ...props
}: ExpirationToggleButtonProps) {
  // Create ordered list of options including "off"
  const options = useMemo(() => {
    const presetEntries = Object.entries(presets).sort((a, b) => a[1] - b[1]);
    return [["--", undefined] as const, ...presetEntries];
  }, [presets]);

  // Find current option index
  const currentIndex = useMemo(() => {
    if (value === null) return 0; // "off" option
    return options.findIndex(([, seconds]) => seconds === value);
  }, [value, options]);

  // Get display text for current value
  const displayText = useMemo(() => {
    if (value === null) return "--";
    const entry = options.find(([, seconds]) => seconds === value);
    return entry ? entry[0] : "--";
  }, [value, options]);

  const handleToggle = () => {
    // Move to next option, wrapping around to start
    const nextIndex = (currentIndex + 1) % options.length;
    const [, nextValue] = options[nextIndex];
    onChange(nextValue ?? null);
  };

  return (
    <Button
      type="button"
      title={`Message expiration: ${displayText}${value ? ` (${formatDuration(value)})` : ""}`}
      onClick={handleToggle}
      {...props}
    >
      {displayText}
    </Button>
  );
}

// Helper function to format duration in a human-readable way
function formatDuration(seconds: number): string {
  const units = [
    { name: "year", seconds: 365 * 24 * 60 * 60 },
    { name: "month", seconds: 30 * 24 * 60 * 60 },
    { name: "week", seconds: 7 * 24 * 60 * 60 },
    { name: "day", seconds: 24 * 60 * 60 },
    { name: "hour", seconds: 60 * 60 },
    { name: "minute", seconds: 60 },
  ];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds);
    if (count >= 1) {
      return `${count} ${unit.name}${count > 1 ? "s" : ""}`;
    }
  }

  return `${seconds} second${seconds > 1 ? "s" : ""}`;
}

export default ExpirationToggleButton;
