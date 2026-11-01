// Shimmer skeleton building blocks - used instead of a bare spinner for
// content that has a predictable shape (stat cards, table rows, list
// cards), since showing the *shape* of what's loading reads as far more
// premium than a centered spinner, and is what Stripe/Linear/Vercel-style
// dashboards use. Pure CSS (the `skeleton-sweep` keyframe lives in
// tailwind.config.js) - no animation library needed for this one.

function Base({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-200 dark:bg-white/10 ${className}`}>
      <div className="absolute inset-0 animate-skeleton-sweep bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

export function SkeletonText({ width = 'w-full', className = '' }) {
  return <Base className={`h-3.5 ${width} ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="card p-5 flex items-start justify-between animate-fadeIn">
      <div className="flex-1">
        <Base className="h-3 w-24 mb-3" />
        <Base className="h-7 w-20" />
      </div>
      <Base className="h-10 w-10 !rounded-full shrink-0" />
    </div>
  );
}

export function SkeletonRow({ columns = 4 }) {
  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <Base className={`h-3.5 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <Base className="h-24 w-full mb-4" />
      <Base className="h-4 w-3/4 mb-2" />
      <Base className="h-3 w-1/2" />
    </div>
  );
}
