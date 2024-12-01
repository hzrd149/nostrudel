import { expect } from 'vitest'
import { walletTest } from '../test/setupTests'

walletTest(
  'getConfig should return the federation config',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)
    const counterBefore = wallet.testing.getRequestCounter()
    await expect(wallet.federation.getConfig()).resolves.toMatchObject({
      api_endpoints: expect.any(Object),
      broadcast_public_keys: expect.any(Object),
      consensus_version: expect.any(Object),
      meta: expect.any(Object),
      modules: expect.any(Object),
    })
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

walletTest(
  'getFederationId should return the federation id',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const counterBefore = wallet.testing.getRequestCounter()
    const federationId = await wallet.federation.getFederationId()
    expect(federationId).toBeTypeOf('string')
    expect(federationId).toHaveLength(64)
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

walletTest(
  'getInviteCode should return the invite code',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const counterBefore = wallet.testing.getRequestCounter()
    const inviteCode = await wallet.federation.getInviteCode(0)
    expect(inviteCode).toBeTypeOf('string')
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)

walletTest(
  'listOperations should return the list of operations',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    const counterBefore = wallet.testing.getRequestCounter()
    await expect(wallet.federation.listOperations()).resolves.toMatchObject([])
    expect(wallet.testing.getRequestCounter()).toBe(counterBefore + 1)
  },
)
