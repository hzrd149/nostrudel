import type {
  CancelFunction,
  JSONValue,
  ModuleKind,
  StreamError,
  StreamResult,
  WorkerMessageType,
} from '../types'
import { logger } from '../utils/logger'

// Handles communication with the wasm worker
// TODO: Move rpc stream management to a separate "SubscriptionManager" class
export class WorkerClient {
  private worker: Worker
  private requestCounter = 0
  private requestCallbacks = new Map<number, (value: any) => void>()
  private initPromise: Promise<boolean> | undefined = undefined

  constructor() {
    // Must create the URL inside the constructor for vite
    this.worker = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
    this.worker.onerror = this.handleWorkerError.bind(this)
    logger.info('WorkerClient instantiated')
    logger.debug('WorkerClient', this.worker)
  }

  // Idempotent setup - Loads the wasm module
  initialize() {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.sendSingleMessage('init')
    return this.initPromise
  }

  private handleWorkerLogs(event: MessageEvent) {
    const { type, level, message, ...data } = event.data
    logger.log(level, message, ...data)
  }

  private handleWorkerError(event: ErrorEvent) {
    logger.error('Worker error', event)
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, requestId, ...data } = event.data
    if (type === 'log') {
      this.handleWorkerLogs(event.data)
    }
    const streamCallback = this.requestCallbacks.get(requestId)
    // TODO: Handle errors... maybe have another callbacks list for errors?
    logger.debug('WorkerClient - handleWorkerMessage', event.data)
    if (streamCallback) {
      streamCallback(data) // {data: something} OR {error: something}
    } else {
      logger.warn(
        'WorkerClient - handleWorkerMessage - received message with no callback',
        requestId,
        event.data,
      )
    }
  }

  // TODO: Handle errors... maybe have another callbacks list for errors?
  // TODO: Handle timeouts
  // TODO: Handle multiple errors

  sendSingleMessage<
    Response extends JSONValue = JSONValue,
    Payload extends JSONValue = JSONValue,
  >(type: WorkerMessageType, payload?: Payload): Promise<Response> {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestCounter
      logger.debug('WorkerClient - sendSingleMessage', requestId, type, payload)
      this.requestCallbacks.set(
        requestId,
        (response: StreamResult<Response>) => {
          this.requestCallbacks.delete(requestId)
          logger.debug(
            'WorkerClient - sendSingleMessage - response',
            requestId,
            response,
          )
          if (response.data) resolve(response.data)
          else if (response.error) reject(response.error)
          else
            logger.warn(
              'WorkerClient - sendSingleMessage - malformed response',
              requestId,
              response,
            )
        },
      )
      this.worker.postMessage({ type, payload, requestId })
    })
  }

  /**
   * @summary Initiates an RPC stream with the specified module and method.
   *
   * @description
   * This function sets up an RPC stream by sending a request to a worker and
   * handling responses asynchronously. It ensures that unsubscription is handled
   * correctly, even if the unsubscribe function is called before the subscription
   * is fully established, by deferring the unsubscription attempt using `setTimeout`.
   *
   * The function operates in a non-blocking manner, leveraging Promises to manage
   * asynchronous operations and callbacks to handle responses.
   *
   *
   * @template Response - The expected type of the successful response.
   * @template Body - The type of the request body.
   * @param module - The module kind to interact with.
   * @param method - The method name to invoke on the module.
   * @param body - The request payload.
   * @param onSuccess - Callback invoked with the response data on success.
   * @param onError - Callback invoked with error information if an error occurs.
   * @param onEnd - Optional callback invoked when the stream ends.
   * @returns A function that can be called to cancel the subscription.
   *
   */
  rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
  ): CancelFunction {
    const requestId = ++this.requestCounter
    logger.debug('WorkerClient - rpcStream', requestId, module, method, body)
    let unsubscribe: (value: void) => void = () => {}
    let isSubscribed = false

    const unsubscribePromise = new Promise<void>((resolve) => {
      unsubscribe = () => {
        if (isSubscribed) {
          // If already subscribed, resolve immediately to trigger unsubscription
          resolve()
        } else {
          // If not yet subscribed, defer the unsubscribe attempt to the next event loop tick
          // This ensures that subscription setup has time to complete
          setTimeout(() => unsubscribe(), 0)
        }
      }
    })

    // Initiate the inner RPC stream setup asynchronously
    this._rpcStreamInner(
      requestId,
      module,
      method,
      body,
      onSuccess,
      onError,
      onEnd,
      unsubscribePromise,
    ).then(() => {
      isSubscribed = true
    })

    return unsubscribe
  }

  private async _rpcStreamInner<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    requestId: number,
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
    unsubscribePromise: Promise<void>,
    // Unsubscribe function
  ): Promise<void> {
    // await this.openPromise
    // if (!this.worker || !this._isOpen)
    //   throw new Error('FedimintWallet is not open')

    this.requestCallbacks.set(requestId, (response: StreamResult<Response>) => {
      if (response.error !== undefined) {
        onError(response.error)
      } else if (response.data !== undefined) {
        onSuccess(response.data)
      } else if (response.end !== undefined) {
        this.requestCallbacks.delete(requestId)
        onEnd()
      }
    })
    this.worker.postMessage({
      type: 'rpc',
      payload: { module, method, body },
      requestId,
    })

    unsubscribePromise.then(() => {
      this.worker?.postMessage({
        type: 'unsubscribe',
        requestId,
      })
      this.requestCallbacks.delete(requestId)
    })
  }

  rpcSingle<Response extends JSONValue = JSONValue>(
    module: ModuleKind,
    method: string,
    body: JSONValue,
  ): Promise<Response> {
    logger.debug('WorkerClient - rpcSingle', module, method, body)
    return new Promise((resolve, reject) => {
      this.rpcStream<Response>(module, method, body, resolve, reject)
    })
  }

  cleanup() {
    this.worker.terminate()
    this.initPromise = undefined
    this.requestCallbacks.clear()
  }

  // For Testing
  _getRequestCounter() {
    return this.requestCounter
  }
  _getRequestCallbackMap() {
    return this.requestCallbacks
  }
}
