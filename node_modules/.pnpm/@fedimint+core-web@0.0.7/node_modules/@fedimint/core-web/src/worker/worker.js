// Web Worker for fedimint-client-wasm to run in the browser

// HACK: Fixes vitest browser runner
// TODO: remove once https://github.com/vitest-dev/vitest/pull/6569 lands in a release
globalThis.__vitest_browser_runner__ = { wrapDynamicImport: (foo) => foo() }

// dynamically imported Constructor for WasmClient
let WasmClient = null
// client instance
let client = null

const streamCancelMap = new Map()

const handleFree = (requestId) => {
  streamCancelMap.delete(requestId)
}

console.log('Worker - init')

self.onmessage = async (event) => {
  const { type, payload, requestId } = event.data

  try {
    if (type === 'init') {
      WasmClient = (await import('@fedimint/fedimint-client-wasm-bundler'))
        .WasmClient
      self.postMessage({ type: 'initialized', data: {}, requestId })
    } else if (type === 'open') {
      const { clientName } = payload
      client = (await WasmClient.open(clientName)) || null
      self.postMessage({
        type: 'open',
        data: { success: !!client },
        requestId,
      })
    } else if (type === 'join') {
      const { inviteCode, clientName: joinClientName } = payload
      try {
        client = await WasmClient.join_federation(joinClientName, inviteCode)
        self.postMessage({
          type: 'join',
          data: { success: !!client },
          requestId,
        })
      } catch (e) {
        self.postMessage({ type: 'error', error: e.message, requestId })
      }
    } else if (type === 'rpc') {
      const { module, method, body } = payload
      console.log('RPC received', module, method, body)
      if (!client) {
        self.postMessage({
          type: 'error',
          error: 'WasmClient not initialized',
          requestId,
        })
        return
      }
      const rpcHandle = await client.rpc(
        module,
        method,
        JSON.stringify(body),
        (res) => {
          console.log('RPC response', requestId, res)
          const data = JSON.parse(res)
          self.postMessage({ type: 'rpcResponse', requestId, ...data })

          if (data.end !== undefined) {
            // Handle stream ending
            const handle = streamCancelMap.get(requestId)
            handle?.free()
          }
        },
      )
      streamCancelMap.set(requestId, rpcHandle)
    } else if (type === 'unsubscribe') {
      const rpcHandle = streamCancelMap.get(requestId)
      if (rpcHandle) {
        rpcHandle.cancel()
        rpcHandle.free()
        streamCancelMap.delete(requestId)
      }
    } else {
      self.postMessage({
        type: 'error',
        error: 'Unknown message type',
        requestId,
      })
    }
  } catch (e) {
    console.error('ERROR', e)
    self.postMessage({ type: 'error', error: e, requestId })
  }
}

// self.postMessage({ type: 'init', data: {} })
