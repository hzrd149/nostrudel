import { NostrEvent } from "nostr-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DeleteEventMenuItem from "./delete-event";

const { deleteEvent, useActiveAccount } = vi.hoisted(() => ({
  deleteEvent: vi.fn().mockResolvedValue(undefined),
  useActiveAccount: vi.fn(),
}));

vi.mock("@chakra-ui/react", () => ({ MenuItem: () => null }));
vi.mock("applesauce-react/hooks", () => ({ useActiveAccount }));
vi.mock("../../providers/route/delete-event-provider", () => ({
  useDeleteEventContext: () => ({ deleteEvent }),
}));
vi.mock("../icons", () => ({ TrashIcon: () => null }));

const event: NostrEvent = {
  id: "a".repeat(64),
  pubkey: "b".repeat(64),
  sig: "c".repeat(128),
  kind: 1,
  created_at: 1,
  tags: [],
  content: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  useActiveAccount.mockReturnValue({ pubkey: event.pubkey });
});

describe("delete menu action", () => {
  it("only opens deletion and blocks default navigation and parent click actions", () => {
    const item = DeleteEventMenuItem({ event });
    if (!item) throw new Error("Expected a delete menu item");
    const click = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    item.props.onClick(click);

    expect(item.props.type).toBe("button");
    expect(click.preventDefault).toHaveBeenCalledOnce();
    expect(click.stopPropagation).toHaveBeenCalledOnce();
    expect(deleteEvent).toHaveBeenCalledExactlyOnceWith(event);
  });

  it("does not offer deletion for another author's event", () => {
    useActiveAccount.mockReturnValue({ pubkey: "d".repeat(64) });
    expect(DeleteEventMenuItem({ event })).toBe(false);
    expect(deleteEvent).not.toHaveBeenCalled();
  });
});
