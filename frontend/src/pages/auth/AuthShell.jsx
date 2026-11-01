import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import ThemeToggle from '../../components/layout/ThemeToggle';

export default function AuthShell({ title, subtitle, children, backTo = '/', wide = false }) {
  return (
    <div className="relative min-h-screen bg-canvas dark:bg-ink-1000 flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[420px] dark:bg-radial-glow pointer-events-none" />

      <header className="relative flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <Link to={backTo} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition">
          <ArrowLeft size={16} /> Back
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative flex-1 flex items-center justify-center px-4 pb-16">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} animate-fadeIn`}>
          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 p-1.5 text-white">
              <Building2 size={20} />
            </div>
            <span className="font-display font-bold text-xl text-gradient">SubTrack</span>
          </div>
          <div className="glass-card p-8">
            <h1 className="font-display text-2xl font-bold text-center">{title}</h1>
            {subtitle && <p className="mt-1.5 text-center text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
