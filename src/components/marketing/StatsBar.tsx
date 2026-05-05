const STATS = [
  { num: "5",    label: "Study frameworks" },
  { num: "3",    label: "Languages supported" },
  { num: "48k+", label: "Interviews completed" },
  { num: "94%",  label: "Report useful insights" },
];

export default function StatsBar() {
  return (
    <div className="border-y grid grid-cols-2 md:grid-cols-4" style={{ borderColor: 'var(--border)' }}>
      {STATS.map(({ num, label }, i) => (
        <div key={label} className="vt-stat-item p-6 md:p-10 text-center border-b md:border-b-0 md:border-r last:border-0" style={{ borderColor: 'var(--border)' }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(38px, 4vw, 56px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 8, color: "var(--txt)" }}>{num}</div>
          <div style={{ fontSize: 13, color: "var(--txt2)", fontWeight: 300 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
