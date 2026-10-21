import { Input, InputProps, Text } from "@chakra-ui/react";
import { RelayDiscovery } from "applesauce-common/casts";
import { RELAY_DISCOVERY_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { normalizeRelayUrl, normalizeURL, unixNow } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { ChangeEvent, FocusEventHandler, forwardRef, KeyboardEventHandler, useMemo } from "react";

import { DEFAULT_RELAY_DISCOVERY_RELAYS } from "../const";
import { unique } from "../helpers/array";
import { eventStore } from "../services/event-store";
import { relayDiscoveryTimeline } from "../services/relay-discovery";

/** The NIP-66 monitor used for relay URL suggestions */
const SUGGESTION_MONITORS = ["9b85d54cc4bc886d60782f80d676e41bc637ed3ecc73d2bb5aabadc499d6a340"];

/** Relays reported by the suggestion monitor in the last day, optionally only those supporting all `nips` */
function useRelaySuggestions(nips?: number[]) {
  const discoveries = use$(
    () =>
      relayDiscoveryTimeline(DEFAULT_RELAY_DISCOVERY_RELAYS, {
        kinds: [RELAY_DISCOVERY_KIND],
        authors: SUGGESTION_MONITORS,
        since: unixNow() - 60 * 60 * 24,
      }).pipe(castTimelineStream(RelayDiscovery, eventStore)),
    [],
  );

  return useMemo(() => {
    if (!discoveries) return undefined;

    const urls: string[] = [];
    for (const discovery of discoveries) {
      if (!discovery.url) continue;
      if (nips && nips.length > 0) {
        const supported = discovery.supportedNIPs.map((nip) => parseInt(nip));
        if (!nips.every((nip) => supported.includes(nip))) continue;
      }
      urls.push(normalizeURL(discovery.url));
    }
    return unique(urls);
  }, [discoveries, nips]);
}

export const RelayUrlInput = forwardRef(({ nips, ...props }: { nips?: number[] } & Omit<InputProps, "type">, ref) => {
  const { onChange, onBlur, onKeyDown } = props;
  const suggestions = useRelaySuggestions(nips);
  const loading = suggestions === undefined;
  const relaySuggestions = suggestions ?? [];

  // Normalize the value (add wss:// if missing) and notify the form of the change
  const normalizeValue = (event: { currentTarget: HTMLInputElement }) => {
    const value = event.currentTarget.value;
    if (!value) return;

    try {
      const normalized = normalizeRelayUrl(value);
      if (normalized !== value) {
        event.currentTarget.value = normalized;
        onChange?.(event as ChangeEvent<HTMLInputElement>);
      }
    } catch {
      // Ignore invalid URLs, let form validation handle them
      return;
    }
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    normalizeValue(event);
    onBlur?.(event);
  };

  // Normalize before the browser validates the URL on Enter-key form submission
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") normalizeValue(event);
    onKeyDown?.(event);
  };

  return (
    <>
      <Input
        ref={ref}
        list="relay-suggestions"
        type="url"
        aria-label="Relay URL"
        aria-describedby="relay-suggestions-description"
        aria-busy={loading}
        {...props}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <Text id="relay-suggestions-description" srOnly>
        {loading
          ? "Loading relay suggestions..."
          : relaySuggestions.length > 0
            ? `Found ${relaySuggestions.length} relay suggestions`
            : "No relay suggestions available"}
      </Text>
      <datalist id="relay-suggestions">
        {relaySuggestions.map((url) => (
          <option key={url} value={url}>
            {url}
          </option>
        ))}
      </datalist>
    </>
  );
});
