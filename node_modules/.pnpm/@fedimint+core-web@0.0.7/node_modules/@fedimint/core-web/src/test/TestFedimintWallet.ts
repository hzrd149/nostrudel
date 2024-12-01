import { FedimintWallet } from '../FedimintWallet'
import { WorkerClient } from '../worker/WorkerClient'
import { TestingService } from './TestingService'

export class TestFedimintWallet extends FedimintWallet {
  public testing: TestingService

  constructor() {
    super()
    this.testing = new TestingService(this.getWorkerClient())
  }

  // Method to expose the WorkerClient
  getWorkerClient(): WorkerClient {
    return this['_client']
  }
}
