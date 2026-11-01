import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, Sparkles, ShieldCheck, BarChart3, Github, Twitter, MessageCircle } from 'lucide-react';
import ThemeToggle from '../components/layout/ThemeToggle';

// A motion-wrapped React Router Link - keeps client-side navigation while
// gaining spring-physics hover/tap micro-interactions.
const MotionLink = motion(Link);

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas dark:bg-ink-1000 flex flex-col">
      {/* Glass navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 dark:border-white/5 bg-canvas/80 dark:bg-ink-1000/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 p-1.5 text-white">
              <Building2 size={18} />
            </div>
            <span className="font-display font-bold text-lg text-gradient">SubTrack</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#top" className="hover:text-brand-600 dark:hover:text-white transition">Home</a>
            <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition">Features</a>
            <a href="#get-started" className="hover:text-brand-600 dark:hover:text-white transition">Get Started</a>
            <a href="mailto:support@subtrack.app" className="hover:text-brand-600 dark:hover:text-white transition">Contact Us</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="#get-started" className="hidden sm:inline-flex btn-pill-primary">Get Started</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main id="top" className="relative flex-1">
        <div className="absolute inset-x-0 top-0 h-[480px] dark:bg-radial-glow pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <span className="badge bg-brand-100 text-brand-700 dark:bg-white/10 dark:text-brand-200 mb-5 animate-fadeIn">
            <Sparkles size={13} className="mr-1.5" /> Subscription &amp; billing, without the spreadsheets
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight animate-fadeIn">
            Subscription billing that<br className="hidden sm:block" /> scales with your business
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg animate-fadeIn">
            Whether you run a single gym or a growing chain of clinics, SubTrack gives you one
            secure platform to manage customers, subscriptions, payments and invoices — built to
            grow with you.
          </p>
        </div>

        {/* Entry cards, styled like the reference's pricing cards */}
        <div id="get-started" className="relative max-w-4xl mx-auto px-6 pb-20 grid sm:grid-cols-2 gap-6">
          <MotionLink
            to="/login/business"
            className="glass-card p-8 text-left group"
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="icon-circle h-12 w-12 bg-pastel-blue dark:bg-white/10 text-brand-600 dark:text-brand-300">
              <Building2 size={22} />
            </div>
            <h2 className="font-display text-xl font-bold mt-5">Business</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              For owners, managers and receptionists — manage customers, subscriptions and billing.
            </p>
            <span className="mt-6 btn-pill-primary w-full">Login / Register →</span>
          </MotionLink>

          <MotionLink
            to="/login/customer"
            className="glass-card p-8 text-left group"
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="icon-circle h-12 w-12 bg-pastel-green dark:bg-white/10 text-accent-600 dark:text-accent-300">
              <User size={22} />
            </div>
            <h2 className="font-display text-xl font-bold mt-5">Customer</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track your subscription, payment history and invoices with your Business ID.
            </p>
            <span className="mt-6 btn-pill w-full border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">
              Login / Register →
            </span>
          </MotionLink>
        </div>

        <div id="features" className="relative max-w-4xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-brand-500 shrink-0" size={20} />
            <p className="text-slate-600 dark:text-slate-400">Role-based access with JWT-secured, isolated business workspaces.</p>
          </div>
          <div className="flex items-start gap-3">
            <BarChart3 className="text-brand-500 shrink-0" size={20} />
            <p className="text-slate-600 dark:text-slate-400">Live revenue dashboards, renewal tracking and reporting.</p>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="text-brand-500 shrink-0" size={20} />
            <p className="text-slate-600 dark:text-slate-400">Built for gyms, clinics, academies, salons and more.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 bg-white dark:bg-ink-950">
        <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 p-1.5 text-white">
                <Building2 size={16} />
              </div>
              <span className="font-display font-bold text-gradient">SubTrack</span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Subscription &amp; billing management for subscription-based local businesses.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>Privacy Policy</li>
              <li>Terms &amp; Conditions</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Connect</p>
            <div className="flex items-center gap-3">
              <span className="icon-circle h-9 w-9 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                <Github size={16} />
              </span>
              <span className="icon-circle h-9 w-9 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                <Twitter size={16} />
              </span>
              <span className="icon-circle h-9 w-9 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                <MessageCircle size={16} />
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-white/5 py-4 text-center text-xs text-slate-400">
          © 2026 SubTrack by Harish. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
