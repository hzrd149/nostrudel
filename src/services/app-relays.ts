import localSettings from "./preferences";

export enum RelayMode {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  BOTH = 1 | 2,
}

export function addAppRelay(relay: string, mode: RelayMode) {
  if (mode & RelayMode.WRITE && !localSettings.writeRelays.value.includes(relay))
    localSettings.writeRelays.next([...localSettings.writeRelays.value, relay]);

  if (mode & RelayMode.READ && !localSettings.readRelays.value.includes(relay))
    localSettings.readRelays.next([...localSettings.readRelays.value, relay]);
}
export function removeAppRelay(relay: string, mode: RelayMode) {
  if (mode & RelayMode.WRITE) {
    localSettings.writeRelays.next(localSettings.writeRelays.value.filter((r) => r !== relay));
  }
  if (mode & RelayMode.READ) {
    localSettings.readRelays.next(localSettings.readRelays.value.filter((r) => r !== relay));
  }
}

export function toggleAppRelay(relay: string, mode: RelayMode) {
  if (mode & RelayMode.WRITE) {
    localSettings.writeRelays.next(
      localSettings.writeRelays.value.includes(relay)
        ? localSettings.writeRelays.value.filter((r) => r !== relay)
        : [...localSettings.writeRelays.value, relay],
    );
  }
  if (mode & RelayMode.READ) {
    localSettings.readRelays.next(
      localSettings.readRelays.value.includes(relay)
        ? localSettings.readRelays.value.filter((r) => r !== relay)
        : [...localSettings.readRelays.value, relay],
    );
  }
}
