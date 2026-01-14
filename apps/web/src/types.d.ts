export {};

declare global {
  interface WindowEventMap {
    "jfp:open-spotlight": CustomEvent;
  }
}
