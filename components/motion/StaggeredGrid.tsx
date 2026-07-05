"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerParent, staggerChild, viewportOnce } from "@/lib/motion";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * Container that staggers its ScrollItem children upward as the group
 * enters the viewport. Use with <ScrollItem> for each child.
 */
export function StaggeredGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}

export function ScrollItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotionSafe();
  const MotionTag = motion[as];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag className={className} variants={staggerChild}>
      {children}
    </MotionTag>
  );
}
