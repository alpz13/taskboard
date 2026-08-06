import '@testing-library/jest-dom';

// jsdom doesn't implement matchMedia; the theme provider uses it (via the
// no-flash script's logic mirrored in tests) to detect the OS preference.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// @tanstack/react-virtual (used for the taskboard's virtualized lists)
// needs ResizeObserver, which jsdom doesn't implement, and sizes the
// scrollable viewport from offsetWidth/offsetHeight, which jsdom always
// reports as 0 (no real layout) — that would make a virtualized list
// compute a zero-height viewport and render no rows at all in tests. Both
// are shimmed globally so every test gets a stable, non-zero layout.
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only shim, not a spec-complete ResizeObserver
  window.ResizeObserver = ResizeObserverMock;
}

if (typeof HTMLElement !== 'undefined') {
  Object.defineProperties(HTMLElement.prototype, {
    offsetWidth: { configurable: true, value: 1000 },
    offsetHeight: { configurable: true, value: 800 },
  });
}
