import { Button, ButtonProps, Menu, MenuButton, MenuList, MenuOptionGroup, MenuItemOption } from "@chakra-ui/react";
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
  const options = useMemo(() => {
    const presetEntries = Object.entries(presets).sort((a, b) => a[1] - b[1]);
    return [["--", undefined] as const, ...presetEntries];
  }, [presets]);

  const displayText = useMemo(() => {
    if (value === null) return "--";
    const entry = options.find(([, seconds]) => seconds === value);
    return entry ? entry[0] : "--";
  }, [value, options]);

  return (
    <Menu>
      <MenuButton
        as={Button}
        type="button"
        aria-label="Message expiration"
        title={`Message expiration: ${displayText}${value ? ` (${formatDuration(value)})` : ""}`}
        {...props}
      >
        {displayText} ▾
      </MenuButton>
      <MenuList>
        <MenuOptionGroup
          type="radio"
          value={value == null ? "off" : String(value)}
          onChange={(selected) => onChange(selected === "off" ? null : Number(selected))}
        >
          {options.map(([label, seconds]) => (
            <MenuItemOption key={label} value={seconds === undefined ? "off" : String(seconds)}>
              {seconds === undefined ? "Off" : formatDuration(seconds)}
            </MenuItemOption>
          ))}
        </MenuOptionGroup>
      </MenuList>
    </Menu>
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
