import { expect } from 'vitest'
import { TESTING_INVITE } from '../test/TestingService'
import { workerTest } from '../test/setupTests'
import { JSONObject } from '../types'

// Waits for a message of a given type from the worker
const waitForWorkerResponse = (
  worker: Worker,
  messageType: string,
): Promise<JSONObject> => {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.type === messageType) {
        resolve(event.data)
      } else if (event.data.type === 'error') {
        reject(event.data.error)
      }
    }
    worker.onerror = (error) => {
      reject(error.message)
    }
  })
}

workerTest(
  'should initialize WasmClient on init message',
  async ({ worker }) => {
    worker.postMessage({ type: 'init', requestId: 1 })
    const response = await waitForWorkerResponse(worker, 'initialized')
    expect(response.data).toEqual({})
  },
)

workerTest(
  'should return false on open for a new client',
  async ({ worker, clientName }) => {
    worker.postMessage({ type: 'init', requestId: 1 })
    await waitForWorkerResponse(worker, 'initialized')

    worker.postMessage({
      type: 'open',
      requestId: 2,
      payload: { clientName },
    })
    const response = await waitForWorkerResponse(worker, 'open')
    expect(response.data).toEqual({ success: false })
  },
)

workerTest(
  'should error on fake federation invitation',
  async ({ worker, clientName }) => {
    worker.postMessage({ type: 'init', requestId: 1 })
    await waitForWorkerResponse(worker, 'initialized')

    worker.postMessage({
      type: 'join',
      requestId: 2,
      payload: { inviteCode: 'fakefederationinvitation', clientName },
    })
    try {
      await waitForWorkerResponse(worker, 'open')
      expect.unreachable()
    } catch (e) {
      expect(e).toBe('parsing failed')
    }
  },
)

workerTest(
  'should handle joining a federation',
  async ({ worker, clientName }) => {
    worker.postMessage({ type: 'init', requestId: 1 })
    await waitForWorkerResponse(worker, 'initialized')

    worker.postMessage({
      type: 'join',
      requestId: 2,
      payload: { inviteCode: TESTING_INVITE, clientName },
    })
    const response = await waitForWorkerResponse(worker, 'join')
    expect(response.data).toEqual({ success: true })
  },
)

workerTest('should handle unknown message type', async ({ worker }) => {
  worker.postMessage({ type: 'unknown', requestId: 2 })
  const response = await waitForWorkerResponse(worker, 'error')
  expect(response.error).toBe('Unknown message type')
})
