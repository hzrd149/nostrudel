import { test, expect } from 'vitest'
import { TestFedimintWallet } from '../test/TestFedimintWallet'
import { beforeAll } from 'vitest'

let randomTestingId: string
let wallet: TestFedimintWallet

beforeAll(async () => {
  randomTestingId = Math.random().toString(36).substring(2, 15)
  wallet = new TestFedimintWallet()
  expect(wallet).toBeDefined()
  await expect(
    wallet.joinFederation(wallet.testing.TESTING_INVITE, randomTestingId),
  ).resolves.toBeUndefined()
  expect(wallet.isOpen()).toBe(true)

  // Cleanup after all tests
  return async () => {
    // clear up browser resources
    await wallet.cleanup()
    // remove the wallet db
    indexedDB.deleteDatabase(randomTestingId)
    // swap out the randomTestingId for a new one, to avoid raciness
    randomTestingId = Math.random().toString(36).substring(2, 15)
  }
})

test('getBalance should be initially zero', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)
  const beforeGetBalance = wallet.testing.getRequestCounter()
  await expect(wallet.balance.getBalance()).resolves.toEqual(0)
  expect(wallet.testing.getRequestCounter()).toBe(beforeGetBalance + 1)
})

test('subscribe balance', async () => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  const counterBefore = wallet.testing.getRequestCounter()
  const callbacksBefore = wallet.testing.getRequestCallbackMap().size
  const unsubscribe = await wallet.balance.subscribeBalance((balance) => {
    expect(balance).toEqual(0)
  })
  expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
  expect(wallet.testing.getRequestCallbackMap().size).toBe(callbacksBefore + 1)

  await expect(wallet.balance.getBalance()).resolves.toEqual(0)
  expect(unsubscribe()).toBeUndefined()
})
