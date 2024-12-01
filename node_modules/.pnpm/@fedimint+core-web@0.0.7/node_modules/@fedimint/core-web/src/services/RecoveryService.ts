import type { JSONValue } from '../types'
import { WorkerClient } from '../worker'

export class RecoveryService {
  constructor(private client: WorkerClient) {}

  async hasPendingRecoveries(): Promise<boolean> {
    return await this.client.rpcSingle('', 'has_pending_recoveries', {})
  }

  async waitForAllRecoveries(): Promise<void> {
    await this.client.rpcSingle('', 'wait_for_all_recoveries', {})
  }

  subscribeToRecoveryProgress(
    onSuccess: (progress: { module_id: number; progress: JSONValue }) => void,
    onError: (error: string) => void,
  ): () => void {
    const unsubscribe = this.client.rpcStream<{
      module_id: number
      progress: JSONValue
    }>('', 'subscribe_to_recovery_progress', {}, onSuccess, onError)

    return unsubscribe
  }
}
