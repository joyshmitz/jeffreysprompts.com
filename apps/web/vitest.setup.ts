import "@testing-library/jest-dom/vitest";

// framer-motion is mocked via the alias in vitest.config.ts pointing to
// src/__mocks__/framer-motion.tsx. This provides stable component references
// (no Proxy) so React reconciliation works correctly across re-renders.

