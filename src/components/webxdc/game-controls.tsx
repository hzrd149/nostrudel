import { useCallback, useRef } from "react";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import { ArrowUpIcon, ArrowDownIcon, ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import type { WebxdcHandle } from "./webxdc";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameControlsProps {
  webxdcHandle: WebxdcHandle | null;
}

// Key mappings for each button.
const KEY_MAP = {
  up: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  down: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  left: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  a: { key: "x", code: "KeyX", keyCode: 88 },
  b: { key: "z", code: "KeyZ", keyCode: 90 },
  start: { key: "Enter", code: "Enter", keyCode: 13 },
  select: { key: "Shift", code: "ShiftRight", keyCode: 16 },
} as const;

type GameButton = keyof typeof KEY_MAP;

const HAPTIC_BUTTONS = new Set<GameButton>(["a", "b"]);

function haptic() {
  navigator.vibrate?.(25);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Virtual gamepad: d-pad + A/B + Start/Select. Buttons send synthetic key
 * events into the webxdc iframe via `webxdc.keyboard` postMessage.
 */
export function GameControls({ webxdcHandle }: GameControlsProps) {
  const activeKeys = useRef(new Set<string>());

  const sendKey = useCallback(
    (type: "keydown" | "keyup", button: GameButton) => {
      if (!webxdcHandle) return;
      const { key, code, keyCode } = KEY_MAP[button];

      if (type === "keydown") {
        if (activeKeys.current.has(code)) return;
        activeKeys.current.add(code);
        if (HAPTIC_BUTTONS.has(button)) haptic();
      } else {
        activeKeys.current.delete(code);
      }

      webxdcHandle.postMessage({
        jsonrpc: "2.0",
        method: "webxdc.keyboard",
        params: { type, key, code, keyCode },
      });
    },
    [webxdcHandle],
  );

  /** Pointer handlers that work for touch + mouse and prevent text selection */
  const handlers = (button: GameButton) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      sendKey("keydown", button);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      sendKey("keyup", button);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      sendKey("keyup", button);
    },
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
  });

  return (
    <Box px="4" pb="4" pt="2" userSelect="none" w="full">
      {/* Main controls row: D-pad on left, A/B on right */}
      <Flex alignItems="center" justifyContent="space-between">
        {/* D-Pad — 3×3 grid, centre cell empty */}
        <Box display="grid" gridTemplateColumns="repeat(3, 44px)" gridTemplateRows="repeat(3, 44px)" gap="1">
          {/* row 1: empty | up | empty */}
          <Box />
          <IconButton icon={<ArrowUpIcon />} aria-label="D-pad up" variant="outline" size="md" {...handlers("up")} />
          <Box />

          {/* row 2: left | empty | right */}
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label="D-pad left"
            variant="outline"
            size="md"
            {...handlers("left")}
          />
          <Box />
          <IconButton
            icon={<ArrowForwardIcon />}
            aria-label="D-pad right"
            variant="outline"
            size="md"
            {...handlers("right")}
          />

          {/* row 3: empty | down | empty */}
          <Box />
          <IconButton
            icon={<ArrowDownIcon />}
            aria-label="D-pad down"
            variant="outline"
            size="md"
            {...handlers("down")}
          />
          <Box />
        </Box>

        {/* A / B action buttons */}
        <Flex alignItems="flex-end" gap="2">
          <IconButton
            icon={<>B</>}
            aria-label="B button"
            variant="outline"
            size="lg"
            borderRadius="full"
            {...handlers("b")}
          />
          <IconButton
            icon={<>A</>}
            aria-label="A button"
            variant="solid"
            colorScheme="primary"
            size="lg"
            borderRadius="full"
            mb="6"
            {...handlers("a")}
          />
        </Flex>
      </Flex>

      {/* Start / Select row */}
      <Flex alignItems="center" justifyContent="center" gap="4" mt="2">
        <IconButton
          icon={
            <Box fontSize="xs" fontWeight="bold" textTransform="uppercase" px="2">
              Sel
            </Box>
          }
          aria-label="Select"
          variant="outline"
          size="sm"
          borderRadius="full"
          w="16"
          {...handlers("select")}
        />
        <IconButton
          icon={
            <Box fontSize="xs" fontWeight="bold" textTransform="uppercase" px="2">
              Start
            </Box>
          }
          aria-label="Start"
          variant="outline"
          size="sm"
          borderRadius="full"
          w="16"
          {...handlers("start")}
        />
      </Flex>
    </Box>
  );
}

export default GameControls;
