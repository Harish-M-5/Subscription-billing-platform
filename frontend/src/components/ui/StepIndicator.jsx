import { Check } from 'lucide-react';

// steps: [{ label: 'Initial Transaction' }, { label: 'Verify Your Transaction' }, ...]
// currentStep: 0-based index of the step in progress; steps before it are
// shown complete (checked), the current one pulses, later ones are muted.
export default function StepIndicator({ steps, currentStep = 0 }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div
            key={step.label}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
              done
                ? 'border-accent-200 bg-accent-50/60 dark:border-accent-900 dark:bg-accent-950/30'
                : active
                ? 'border-brand-200 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Step {i + 1}</p>
              <p className="text-sm font-semibold mt-0.5">{step.label}</p>
            </div>
            <div
              className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${
                done
                  ? 'bg-accent-500 text-white'
                  : active
                  ? 'bg-brand-600 text-white animate-glowPulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {done ? <Check size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
