import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-50 dark:bg-slate-950">
      <p className="font-display text-6xl font-extrabold text-brand-500">404</p>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Page not found.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
