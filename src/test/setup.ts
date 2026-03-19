import '@testing-library/jest-dom'

import { afterEach, vi } from 'vitest'

declare global {
  interface Window {
    resizeTo: (width: number, height: number) => void
  }
}

type MediaQueryListener = (event: MediaQueryListEvent) => void

const listeners = new Map<string, Set<MediaQueryListener>>()

function parseQuery(query: string) {
  const minMatch = query.match(/\(min-width:\s*(\d+(?:\.\d+)?)px\)/)
  const maxMatch = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/)

  return {
    min: minMatch ? Number(minMatch[1]) : undefined,
    max: maxMatch ? Number(maxMatch[1]) : undefined,
  }
}

function matchesQuery(query: string) {
  const { min, max } = parseQuery(query)

  if (min !== undefined && window.innerWidth < min) {
    return false
  }

  if (max !== undefined && window.innerWidth > max) {
    return false
  }

  return true
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: (_event: string, listener: MediaQueryListener) => {
      const existing = listeners.get(query) ?? new Set<MediaQueryListener>()
      existing.add(listener)
      listeners.set(query, existing)
    },
    addListener: (listener: MediaQueryListener) => {
      const existing = listeners.get(query) ?? new Set<MediaQueryListener>()
      existing.add(listener)
      listeners.set(query, existing)
    },
    dispatchEvent: vi.fn(),
    matches: matchesQuery(query),
    media: query,
    onchange: null,
    removeEventListener: (_event: string, listener: MediaQueryListener) => {
      listeners.get(query)?.delete(listener)
    },
    removeListener: (listener: MediaQueryListener) => {
      listeners.get(query)?.delete(listener)
    },
  })),
})

window.resizeTo = (width: number, height: number) => {
  Object.assign(window, {
    innerHeight: height,
    innerWidth: width,
    outerHeight: height,
    outerWidth: width,
  })

  window.dispatchEvent(new Event('resize'))

  for (const [query, queryListeners] of listeners.entries()) {
    const event = {
      matches: matchesQuery(query),
      media: query,
    } as MediaQueryListEvent

    for (const listener of queryListeners) {
      listener(event)
    }
  }
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 600,
})

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 1024,
})

Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  configurable: true,
  value: 1024,
})

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 1024,
})

window.HTMLElement.prototype.scrollTo = vi.fn()

afterEach(() => {
  window.resizeTo(1280, 900)
})
