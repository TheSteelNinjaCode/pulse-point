import type { PPUtilities } from "./pp-utilities.js";

declare global {
  const pp: PPUtilities;

  interface Window {
    pp: PPUtilities;
  }
}

export {};
