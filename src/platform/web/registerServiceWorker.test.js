import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './registerServiceWorker.js'

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.__TAURI_INTERNALS__
})

function mockServiceWorker() {
  const register = vi.fn().mockResolvedValue({})
  vi.stubGlobal('navigator', { serviceWorker: { register } })
  vi.stubEnv('PROD', true)
  vi.stubEnv('BASE_URL', '/reader/')
  return register
}

describe('registerServiceWorker', () => {
  it('registers the production worker within the deployment base', async () => {
    const register = mockServiceWorker()
    await registerServiceWorker()
    expect(register).toHaveBeenCalledWith('/reader/sw.js', { scope: '/reader/' })
  })

  it('does not register during development', async () => {
    const register = mockServiceWorker()
    vi.stubEnv('PROD', false)
    await registerServiceWorker()
    expect(register).not.toHaveBeenCalled()
  })

  it('does not register in Tauri', async () => {
    const register = mockServiceWorker()
    window.__TAURI_INTERNALS__ = {}
    await registerServiceWorker()
    expect(register).not.toHaveBeenCalled()
  })

  it('works without service worker support', async () => {
    vi.stubEnv('PROD', true)
    vi.stubGlobal('navigator', {})
    await expect(registerServiceWorker()).resolves.toBeUndefined()
  })

  it('handles registration failure without interrupting startup', async () => {
    const register = mockServiceWorker()
    const error = new Error('Registration failed')
    register.mockRejectedValue(error)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(registerServiceWorker()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('Could not register the offline service worker.', error)
  })
})
