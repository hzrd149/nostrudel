/** Serialized into the sandbox after Kehto's namespace and before authored scripts.
 * Self-contained: no host closures, keys, or launcher APIs cross this boundary.
 * This replaces only the CVM methods missing from the pinned Kehto binding.
 */
export function installCvmBinding() {
  type Value = Record<string, any>;
  const target = window as unknown as { napplet: { cvm?: Value } };
  const domain = target.napplet.cvm;
  if (!domain) return;
  const pending = new Map<
    string,
    { resolve(value: Value): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout>; type: string }
  >();
  const listeners = new Set<(server: Value, message: Value) => void>();
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || !event.data || typeof event.data !== "object") return;
    const message = event.data;
    if (message.type === "cvm.event") {
      for (const listener of listeners) listener(message.server, message.message);
      return;
    }
    const request = pending.get(message.id);
    if (!request || message.type !== `${request.type}.result`) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (typeof message.error === "string") request.reject(new Error(message.error));
    else request.resolve(message);
  });
  function send(type: string, payload: Value = {}, timeout = 30000): Promise<Value> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      // Delivery grace lets the shell's authoritative deadline/error arrive first.
      const duration = Number.isInteger(timeout) && timeout > 0 && timeout <= 300000 ? timeout : 30000;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("relay timeout"));
      }, duration + 1000);
      pending.set(id, { resolve, reject, timer, type });
      window.parent.postMessage({ type, id, ...payload }, "*");
    });
  }
  async function request(server: Value, message: Value, options?: Value) {
    const reply = await send("cvm.request", { server, message, options }, options?.timeoutMs);
    return reply.message ?? null;
  }
  async function call(server: Value, method: string, params?: Value, options?: Value) {
    const reply = await request(
      server,
      { jsonrpc: "2.0", id: crypto.randomUUID(), method, ...(params ? { params } : {}) },
      options,
    );
    if (!reply) throw new Error("invalid message");
    if (reply.error) throw new Error(reply.error.message ?? `${method} failed`);
    return reply.result;
  }
  Object.assign(domain, {
    discover: async (query?: Value) => (await send("cvm.discover", { query })).servers,
    request,
    listTools: async (server: Value, options?: Value) => (await call(server, "tools/list", undefined, options)).tools,
    callTool: (server: Value, name: string, args?: Value, options?: Value) =>
      call(server, "tools/call", { name, arguments: args ?? {} }, options),
    listResources: async (server: Value, options?: Value) =>
      (await call(server, "resources/list", undefined, options)).resources,
    readResource: async (server: Value, uri: string, options?: Value) =>
      (await call(server, "resources/read", { uri }, options)).contents,
    close: async (server: Value) => {
      await send("cvm.close", { server });
    },
    onEvent: (handler: (server: Value, message: Value) => void) => {
      listeners.add(handler);
      return {
        close: () => {
          listeners.delete(handler);
        },
      };
    },
    registry: {
      list: async (query?: Value) => (await send("cvm.registry.list", { query })).entries,
      has: async (selector: Value | string, options?: Value) =>
        (
          await send("cvm.registry.has", {
            selector: typeof selector === "string" ? { family: selector } : selector,
            options,
          })
        ).has,
      describe: async (selector: Value | string, options?: Value) =>
        (
          await send("cvm.registry.describe", {
            selector: typeof selector === "string" ? { family: selector } : selector,
            options,
          })
        ).entry,
      call: async (selector: Value | string, tool: string, args?: Value, options?: Value) =>
        (
          await send(
            "cvm.registry.call",
            { selector: typeof selector === "string" ? { family: selector } : selector, tool, args, options },
            options?.timeoutMs,
          )
        ).result,
    },
  });
}
