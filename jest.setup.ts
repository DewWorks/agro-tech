import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder
}

// Polyfill standard Web APIs for JSDOM in Jest (Next.js 16 requirements)
if (typeof global.MessageChannel === 'undefined') {
  try {
    const { MessageChannel, MessagePort } = require('node:worker_threads')
    // @ts-ignore
    global.MessageChannel = MessageChannel
    // @ts-ignore
    globalThis.MessageChannel = MessageChannel
    // @ts-ignore
    global.MessagePort = MessagePort
    // @ts-ignore
    globalThis.MessagePort = MessagePort
  } catch {
    // ignore
  }
}

if (typeof global.ReadableStream === 'undefined') {
  try {
    const webStreams = require('node:stream/web')
    // @ts-ignore
    global.ReadableStream = webStreams.ReadableStream
    // @ts-ignore
    globalThis.ReadableStream = webStreams.ReadableStream
    // @ts-ignore
    global.WritableStream = webStreams.WritableStream
    // @ts-ignore
    globalThis.WritableStream = webStreams.WritableStream
    // @ts-ignore
    global.TransformStream = webStreams.TransformStream
    // @ts-ignore
    globalThis.TransformStream = webStreams.TransformStream
  } catch {
    // ignore
  }
}

if (typeof global.Request === 'undefined') {
  try {
    const { Request, Response, Headers, FormData } = require('undici')
    // @ts-ignore
    global.Request = Request
    // @ts-ignore
    globalThis.Request = Request
    // @ts-ignore
    window.Request = Request
    // @ts-ignore
    global.Response = Response
    // @ts-ignore
    globalThis.Response = Response
    // @ts-ignore
    window.Response = Response
    // @ts-ignore
    global.Headers = Headers
    // @ts-ignore
    globalThis.Headers = Headers
    // @ts-ignore
    window.Headers = Headers
    // @ts-ignore
    global.FormData = FormData
    // @ts-ignore
    globalThis.FormData = FormData
    // @ts-ignore
    window.FormData = FormData
  } catch {
    // ignore
  }
}

// Mock de matchMedia para componentes Radix/Shadcn
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock de ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
