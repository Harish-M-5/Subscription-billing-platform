import { Mail, X, BookOpen, Keyboard } from 'lucide-react';

// A lightweight popover anchored to the floating action button. Kept
// honest/non-fake: it links to real support contact and the notification
// bell, rather than simulating an AI chat the app doesn't actually have.
export default function QuickHelp({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-24 right-5 z-50 w-72 card p-4 animate-popIn origin-bottom-right">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm">Quick Help</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-1">
          <a
            href="mailto:support@subtrack.app"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Mail size={16} /> Contact Support
          </a>
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <BookOpen size={16} /> Use the bell icon for live updates
          </div>
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Keyboard size={16} /> Use the search bar to jump to a customer
          </div>
        </div>
      </div>
    </>
  );
}
