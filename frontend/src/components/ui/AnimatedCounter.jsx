import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

/**
 * Counts up from 0 (or its previous value) to `value` whenever `value`
 * changes - the classic Stripe/Linear-dashboard "numbers feel alive" touch.
 * Renders a MotionValue directly as a motion.span's child, which
 * framer-motion updates imperatively (no React re-render per frame), so
 * this stays smooth even with several counters animating on screen at once.
 *
 * value: a plain number (not a pre-formatted string - format via `prefix`/
 * `suffix`/`decimals`, not by passing something like "₹1,234" here).
 */
export default function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, duration = 0.9 }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) =>
    `${prefix}${v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );

  useEffect(() => {
    const controls = animate(motionValue, Number(value) || 0, { duration, ease: 'easeOut' });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <motion.span>{display}</motion.span>;
}
