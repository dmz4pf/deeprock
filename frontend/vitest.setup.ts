import "@testing-library/jest-dom/vitest";

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.ethereum
Object.defineProperty(window, "ethereum", {
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  writable: true,
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
