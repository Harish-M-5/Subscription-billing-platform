// A pill-shaped segmented tab control, e.g.:
//   <SegmentedTabs
//     tabs={[{ key: 'own', label: 'Transfer to Own Accounts' }, ...]}
//     active={tab}
//     onChange={setTab}
//   />
export default function SegmentedTabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`tab-pill-track overflow-x-auto ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`tab-pill ${active === t.key ? 'tab-pill-active' : 'tab-pill-inactive'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
