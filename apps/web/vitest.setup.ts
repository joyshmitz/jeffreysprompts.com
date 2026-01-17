import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

// Mock framer-motion globally
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          const Component = React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref) => {
            // Filter out framer-motion props to avoid React warnings in tests
            /* eslint-disable @typescript-eslint/no-unused-vars */
            const {
              initial, animate, exit, variants, transition, layout, layoutId,
              drag, dragConstraints, dragElastic, dragMomentum, dragPropagation, dragDirectionLock,
              onDrag, onDragStart, onDragEnd, onDragTransitionEnd,
              whileHover, whileTap, whileFocus, whileInView, viewport,
              ...validProps
            } = props;
            /* eslint-enable @typescript-eslint/no-unused-vars */
            return React.createElement(prop, { ...validProps, ref }, children);
          });
          Component.displayName = `motion.${prop}`;
          return Component;
        },
      }
    ),
  };
});

