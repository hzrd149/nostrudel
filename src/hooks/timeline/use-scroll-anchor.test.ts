import { BehaviorSubject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  effects: [] as (() => void | (() => void))[],
  layouts: [] as (() => void)[],
  container: { scrollTop: 0, addEventListener: vi.fn(), removeEventListener: vi.fn(), scrollBy: vi.fn() },
}));

vi.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void) => harness.effects.push(effect),
  useLayoutEffect: (effect: () => void) => harness.layouts.push(effect),
}));
vi.mock("../../providers/local/scroll-container", () => ({ useScrollContainer: () => harness.container }));
const subject = new BehaviorSubject<IntersectionObserverEntry[]>([]);
vi.mock("../../providers/local/intersection-observer", () => ({ useIntersectionObserver: () => ({ subject }) }));

import useScrollAnchor from "./use-scroll-anchor";

let top: number;
let element: Element;
let cleanups: (() => void)[];
let afterAnchoredRender: ReturnType<typeof useScrollAnchor>;

beforeEach(() => {
  vi.clearAllMocks();
  harness.effects = [];
  harness.layouts = [];
  harness.container.scrollTop = 0;
  top = 20;
  element = { isConnected: true, getBoundingClientRect: () => ({ top }) } as Element;
  subject.next([]);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  afterAnchoredRender = useScrollAnchor();
  cleanups = harness.effects.map((effect) => effect()).filter((cleanup) => typeof cleanup === "function");
  subject.next([{ target: element, isIntersecting: true } as IntersectionObserverEntry]);
});
afterEach(() => {
  cleanups.forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
});

const render = () => harness.layouts.forEach((effect) => effect());

describe("timeline scroll anchoring", () => {
  it("corrects a layout shift above the visible note", () => {
    top += 100;
    render();
    expect(harness.container.scrollBy).toHaveBeenCalledWith({ top: 100, behavior: "instant" });
  });

  it("does not undo scrolling before the scroll callback records it", () => {
    harness.container.scrollTop = 500;
    top -= 500;
    render();
    expect(harness.container.scrollBy).not.toHaveBeenCalled();
  });

  it("does not correct native browser anchoring a second time", () => {
    harness.container.scrollTop = 100;
    render();
    expect(harness.container.scrollBy).not.toHaveBeenCalled();
  });

  it("still runs the show-new-notes callback after scrolling", () => {
    const afterRender = vi.fn();
    harness.container.scrollTop = 500;
    afterAnchoredRender(afterRender);
    render();
    render();
    expect(afterRender).toHaveBeenCalledTimes(1);
  });
});
