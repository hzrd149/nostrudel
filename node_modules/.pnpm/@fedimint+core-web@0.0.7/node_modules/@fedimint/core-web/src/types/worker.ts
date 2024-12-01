const WorkerMessageTypes = [
  'init',
  'initialized',
  'rpc',
  'log',
  'open',
  'join',
  'error',
  'unsubscribe',
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
