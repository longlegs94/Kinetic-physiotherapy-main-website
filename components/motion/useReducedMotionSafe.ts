"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Wrapper around framer-motion's reduced-motion detection.
 * Returns true when the user prefers reduced motion, so callers can
 * swap movement for simple opacity or disable animation entirely.
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
