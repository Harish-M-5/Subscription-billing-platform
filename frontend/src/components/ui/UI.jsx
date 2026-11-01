import { Loader2, Inbox } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
    blue: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
    purple: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  };
  return <span className={`badge ${tones[tone] || tones.slate}`}>{children}</span>;
}

export function statusTone(status) {
  return {
    active: 'green', expiring_soon: 'amber', expired: 'red', cancelled: 'slate', none: 'slate',
    paid: 'green', partial: 'orange', pending: 'amber', upgraded: 'blue',
  }[status] || 'slate';
}

// Pastel-circle icon treatment matching the reference screenshots' stat/info
// cards (soft tinted circle, not a bold gradient square) - softer, more
// "fintech dashboard" than the previous look.
const ICON_CIRCLE_TONES = {
  brand: 'bg-pastel-blue text-brand-600 dark:bg-brand-950 dark:text-brand-300',
  accent: 'bg-pastel-green text-accent-600 dark:bg-accent-950 dark:text-accent-400',
  amber: 'bg-pastel-amber text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  rose: 'bg-pastel-rose text-rose-600 dark:bg-rose-950 dark:text-rose-400',
  purple: 'bg-pastel-purple text-violet-600 dark:bg-violet-950 dark:text-violet-400',
};

export function StatCard({ label, value, icon: Icon, tone = 'brand', sub }) {
  return (
    <div className="card p-5 flex items-start justify-between animate-fadeIn transition hover:shadow-floating hover:-translate-y-0.5 group">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-display font-bold">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      {Icon && (
        <div className={`icon-circle transition-transform duration-300 group-hover:scale-110 ${ICON_CIRCLE_TONES[tone] || ICON_CIRCLE_TONES.brand}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}

// Compact variant used for "limit"/"quota" style mini-cards: small eyebrow
// label at top, a flat icon circle, and a bold headline value - mirrors the
// "Transaction Limit / Minimum Amount" cards in the reference screenshot.
export function MiniInfoCard({ eyebrow, value, icon: Icon, tone = 'brand', corner }) {
  return (
    <div className="card p-4 animate-fadeIn">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-400">{eyebrow}</p>
        {corner && (
          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">
            {corner}
          </span>
        )}
      </div>
      <p className="mt-2 text-lg font-display font-bold">{value}</p>
      {Icon && (
        <div className={`icon-circle mt-3 h-8 w-8 ${ICON_CIRCLE_TONES[tone] || ICON_CIRCLE_TONES.brand}`}>
          <Icon size={15} />
        </div>
      )}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} size={20} />;
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="text-brand-500" />
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', subtitle, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
      <Icon size={36} className="mb-3 opacity-50" />
      <p className="font-medium">{title}</p>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

// Internal AnimatePresence means every existing call site (`<Modal open={bool} ...>`)
// gets a proper spring-physics enter/exit transition for free - nothing
// elsewhere in the app needs to change to pick this up.
export function Modal({ open, onClose, title, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-lg card p-6 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <h3 className="font-display text-lg font-bold mb-4">{title}</h3>
            {children}
            {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
}
