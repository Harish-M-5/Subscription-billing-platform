import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Wraps a grid of cards (stat cards, plan cards, etc.) so each child enters
// with a staggered fade+rise instead of all popping in at once. Usage:
//   <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
//     <StatCard .../> <StatCard .../> ...
//   </StaggerGrid>
// Each direct child is auto-wrapped - no per-card changes needed.
export default function StaggerGrid({ children, className = '' }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {items.map((child, i) => (
        <motion.div key={child?.key ?? i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
