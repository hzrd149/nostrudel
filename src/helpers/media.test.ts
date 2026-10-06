import { describe, expect, it, vi } from "vitest";

import { pauseOthers } from "./media";

function fakeMedia(paused: boolean) {
  return { paused, pause: vi.fn() };
}

describe("pauseOthers", () => {
  it("pauses the other playing elements", () => {
    const current = fakeMedia(false);
    const playing = fakeMedia(false);

    pauseOthers(current, [current, playing]);

    expect(playing.pause).toHaveBeenCalledTimes(1);
  });

  it("does not pause the current element", () => {
    const current = fakeMedia(false);

    pauseOthers(current, [current]);

    expect(current.pause).not.toHaveBeenCalled();
  });

  it("leaves already paused elements alone", () => {
    const current = fakeMedia(false);
    const paused = fakeMedia(true);

    pauseOthers(current, [current, paused]);

    expect(paused.pause).not.toHaveBeenCalled();
  });
});
