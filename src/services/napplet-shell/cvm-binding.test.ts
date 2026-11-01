import { afterEach, expect, it, vi } from "vitest";
import { installCvmBinding } from "./cvm-binding";

afterEach(() => vi.unstubAllGlobals());
it("binds resource contents, notifications and correlated parent replies", async () => {
  let listener: (event: any) => void = () => {};
  const parent = { postMessage: vi.fn() };
  const domain: any = {};
  vi.stubGlobal("window", {
    parent,
    napplet: { cvm: domain },
    addEventListener: (_type: string, handler: typeof listener) => {
      listener = handler;
    },
  });
  installCvmBinding();
  const resources = domain.readResource({ pubkey: "a".repeat(64) }, "test://resource");
  const request = parent.postMessage.mock.calls[0][0] as any;
  listener({ source: {}, data: { type: "cvm.request.result", id: request.id, error: "forged" } });
  const contents = [
    { type: "text", text: "first" },
    { type: "text", text: "second" },
  ];
  listener({
    source: parent,
    data: {
      type: "cvm.request.result",
      id: request.id,
      message: { jsonrpc: "2.0", id: request.message.id, result: { contents } },
    },
  });
  expect(await resources).toEqual(contents);
  const notify = vi.fn();
  const subscription = domain.onEvent(notify);
  listener({ source: parent, data: { type: "cvm.event", server: {}, message: { method: "test" } } });
  expect(notify).toHaveBeenCalledOnce();
  subscription.close();
  listener({ source: parent, data: { type: "cvm.event", server: {}, message: {} } });
  expect(notify).toHaveBeenCalledOnce();
  const notification = domain.request({}, { jsonrpc: "2.0", method: "ping" });
  const next = parent.postMessage.mock.calls[1][0] as any;
  listener({ source: parent, data: { type: "cvm.request.result", id: next.id, message: null } });
  expect(await notification).toBeNull();
});
