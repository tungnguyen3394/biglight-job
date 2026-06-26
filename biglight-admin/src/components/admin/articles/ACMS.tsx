"use client";

import { useState } from "react";

// ---- design system (scoped .acms, light/dark qua CSS vars) ----
export const ACMS_CSS = `
.acms{--bg:#F7F8FA;--card:#fff;--soft:#F2F4F7;--text:#16181D;--muted:#6B7280;--faint:#9AA2AE;--border:#E6E8EB;--accent:#D02E26;--accent-soft:#FDECEA;--green:#1F9D55;--amber:#E8810C;--red:#D02E26;color:var(--text);font-family:'Noto Sans JP',system-ui,sans-serif;background:var(--bg)}
.acms.dark{--bg:#0B0C0E;--card:#141619;--soft:#1B1E22;--text:#E7E9EC;--muted:#9AA2AE;--faint:#6B7280;--border:#262A30;--accent:#FF5A4D;--accent-soft:#2A1614}
.acms *{box-sizing:border-box}
.acms .a-card{background:var(--card);border:1px solid var(--border);border-radius:14px;margin-bottom:14px;overflow:hidden;transition:border-color .15s}
.acms .a-head{display:flex;align-items:center;gap:10px;width:100%;padding:14px 16px;cursor:pointer;background:none;border:none;text-align:left;color:var(--text)}
.acms .a-head .ico{color:var(--muted);flex:0 0 auto;display:flex}
.acms .a-head .t{font-size:14px;font-weight:700;flex:1}
.acms .a-head .chev{color:var(--faint);transition:transform .2s}
.acms .a-head .chev.open{transform:rotate(180deg)}
.acms .a-head .pill{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:var(--soft);color:var(--muted)}
.acms .a-body{padding:4px 16px 18px;animation:acms-in .18s ease}
@keyframes acms-in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
.acms .a-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.acms .a-grid.one{grid-template-columns:1fr}
.acms .full{grid-column:1/-1}
.acms .a-field{display:flex;flex-direction:column;gap:5px;margin-bottom:2px}
.acms .a-field>label{font-size:12px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px}
.acms .a-field>label .req{color:var(--accent)}
.acms .a-field .hint{font-size:11px;color:var(--faint)}
.acms .a-inp,.acms .a-sel,.acms .a-ta{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:9px 11px;font-size:13px;color:var(--text);outline:none;font-family:inherit;transition:.14s}
.acms .a-inp:focus,.acms .a-sel:focus,.acms .a-ta:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.acms .a-ta{resize:vertical;min-height:80px;line-height:1.7}
.acms .a-sel{appearance:none;cursor:pointer}
.acms .a-count{font-size:11px;font-weight:600}
.acms .a-chips{display:flex;flex-wrap:wrap;gap:6px}
.acms .a-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:4px 9px;border-radius:20px;background:var(--soft);color:var(--muted)}
.acms .a-chip button{border:none;background:none;color:var(--faint);cursor:pointer;font-size:13px;line-height:1;padding:0}
.acms .a-toggle{display:inline-flex;align-items:center;gap:8px;cursor:pointer}
.acms .a-sw{width:38px;height:22px;border-radius:20px;background:var(--border);position:relative;transition:.16s;flex:0 0 auto}
.acms .a-sw.on{background:var(--green)}
.acms .a-sw::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.16s}
.acms .a-sw.on::after{left:18px}
.acms .a-seg{display:inline-flex;flex-wrap:wrap;gap:6px}
.acms .a-seg button{font-size:12px;font-weight:700;padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--muted);cursor:pointer;transition:.14s}
.acms .a-seg button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.acms .a-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:13px;font-weight:700;padding:9px 14px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;transition:.14s}
.acms .a-btn:hover{border-color:var(--faint)}
.acms .a-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.acms .a-btn.primary:hover{filter:brightness(1.05)}
.acms .a-btn.block{width:100%}
.acms .a-btn:disabled{opacity:.5;cursor:default}
.acms .a-meter{height:6px;border-radius:6px;background:var(--soft);overflow:hidden}
.acms .a-meter>i{display:block;height:100%;border-radius:6px}
.acms .a-row{display:flex;align-items:center;gap:8px}
`;

const PATHS: Record<string, React.ReactNode> = {
  chevron: <path d="M6 9l6 6 6-6" />,
  check: <path d="M20 6L9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8v.01M11 12h1v4h1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  tag: <><path d="M20.6 13.4 12 22l-9-9V3h10z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  doc: <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8z" /><path d="M19 14l.7 1.8L21 16.5l-1.3.7L19 19l-.7-1.8L17 16.5l1.3-.7z" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01" /></>,
  cta: <><path d="M3 11l19-9-9 19-2-8-8-2z" /></>,
  schema: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><path d="M14 7h4a2 2 0 0 1 2 2v1M10 17H6a2 2 0 0 1-2-2v-1" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>,
  shield: <><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  rocket: <><path d="M5 13c-2 1-3 4-3 7 3 0 6-1 7-3M12 15l-3-3a14 14 0 0 1 7-9 14 14 0 0 1 2 9 14 14 0 0 1-6 3z" /><circle cx="15" cy="9" r="1.5" /></>,
  info2: <path d="M12 16v-4M12 8h.01" />,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>,
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PATHS[name] ?? null}</svg>;
}

export function Card({ icon, title, pill, defaultOpen = true, children }: { icon: string; title: string; pill?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="a-card">
      <button type="button" className="a-head" onClick={() => setOpen((o) => !o)}>
        <span className="ico"><Icon name={icon} /></span>
        <span className="t">{title}</span>
        {pill && <span className="pill">{pill}</span>}
        <span className={`chev${open ? " open" : ""}`}><Icon name="chevron" size={18} /></span>
      </button>
      {open && <div className="a-body">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, req, counter, children }: { label?: string; hint?: string; req?: boolean; counter?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="a-field full">
      {label && <label>{label}{req && <span className="req">*</span>}{counter}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <span className="a-toggle" onClick={() => onChange(!on)}>
      <span className={`a-sw${on ? " on" : ""}`} />
      {label && <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>}
    </span>
  );
}

export function Seg({ value, options, onChange }: { value: string; options: { v: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="a-seg">
      {options.map((o) => <button key={o.v} type="button" className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}

export function Chips({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [t, setT] = useState("");
  const add = () => { const v = t.trim(); if (v && !value.includes(v)) onChange([...value, v]); setT(""); };
  return (
    <div>
      {value.length > 0 && (
        <div className="a-chips" style={{ marginBottom: 7 }}>
          {value.map((v) => <span key={v} className="a-chip">{v}<button type="button" onClick={() => onChange(value.filter((x) => x !== v))}>×</button></span>)}
        </div>
      )}
      <input className="a-inp" value={t} placeholder={placeholder} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
    </div>
  );
}

export function Meter({ ratio, tone }: { ratio: number; tone: "red" | "amber" | "green" }) {
  const c = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--red)";
  return <div className="a-meter"><i style={{ width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`, background: c }} /></div>;
}

export function Gauge({ score, tone }: { score: number; tone: "red" | "amber" | "green" }) {
  const c = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--red)";
  const r = 34, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 92, height: 92 }}>
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--soft)" strokeWidth="8" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} transform="rotate(-90 46 46)" style={{ transition: "stroke-dashoffset .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: c, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: "var(--faint)", fontWeight: 700 }}>/100</span>
      </div>
    </div>
  );
}
