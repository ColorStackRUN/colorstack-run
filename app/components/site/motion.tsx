"use client";

import { motion, useReducedMotion, useInView, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const revealVariants: Variants = {
  hidden: (direction: RevealDirection = "up") => ({
    opacity: 0,
    x: direction === "left" ? -32 : direction === "right" ? 32 : 0,
    y: direction === "up" ? 32 : 0,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

type MotionSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function MotionSection({ children, className, id }: MotionSectionProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <section id={id} className={className}>{children}</section>;
  }
  return (
    <motion.section
      id={id}
      className={className}
      variants={staggerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
    >
      {children}
    </motion.section>
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
};
type RevealDirection = "up" | "left" | "right";

export function Reveal({ children, className, direction = "up" }: RevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} custom={direction} variants={revealVariants}>
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState("0");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    if (!inView) return;

    const numMatch = value.match(/^(\d+)(.*)/);
    if (!numMatch) {
      setDisplay(value);
      return;
    }

    const target = parseInt(numMatch[1], 10);
    const suffix = numMatch[2] ?? "";
    const duration = 1400;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(`${Math.round(eased * target)}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [inView, value, reduceMotion]);

  return <span ref={ref} className={className}>{display}</span>;
}
