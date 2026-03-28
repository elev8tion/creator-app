import { useState, useEffect, useCallback, useRef } from "react";

// ─── Responsive Hook ────────────────────────────────────────────────────────
function useMediaQuery(query) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setM(mql.matches);
    const h = e => setM(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, [query]);
  return m;
}

// ─── Injected CSS ───────────────────────────────────────────────────────────
function InjectedStyles() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-tap-highlight-color: transparent; }
        body { background: #060606; }
        .hide-sb::-webkit-scrollbar { display: none; }
        .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseOverdue {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(0,255,135,0.3); }
          50% { box-shadow: 0 0 16px rgba(0,255,135,0.6); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        input:focus, select:focus, textarea:focus { outline: none; }
        button:active { transform: scale(0.97) !important; }
        ::selection { background: rgba(0,212,255,0.25); color: #fff; }
      `}</style>
    </>
  );
}

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  bg:       "#060606",
  surface:  "#0A0A0A",
  surfaceHover: "#0E0E0E",
  elevated: "#0C0C0C",
  modal:    "#080808",
  active:   "#161616",
  border:   "#1A1A1A",
  borderSubtle: "#141414",
  borderFaint:  "#151515",
  borderLight:  "#1E1E1E",
  borderHover:  "#2A2A2A",
  text:     "#E0E0E0",
  textBright: "#F0F0F0",
  textMuted:"#999",
  textDim:  "#888",
  textFaint:"#777",
  textGhost:"#666",
  textOff:  "#555",
  textDead: "#444",
  accent:   "#00D4FF",
  success:  "#00FF87",
  danger:   "#FF4D4D",
  warn:     "#FFD600",
  radius:   10,
  radiusLg: 12,
  tap:      44,
  transition: "all 0.15s ease",
};

// ─── Derived color helpers ──────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function stageTheme(hex) {
  const [r,g,b] = hexToRgb(hex);
  return {
    color: hex,
    bg: `rgba(${r},${g},${b},0.07)`,
    border: `rgba(${r},${g},${b},0.25)`,
    glow: `rgba(${r},${g},${b},0.15)`,
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGES = ["Discovered","Contacted","Responded","In Talks","Onboarded","Declined"];
const PLATFORMS = ["Instagram","TikTok","YouTube","Twitter/X","LinkedIn","Twitch","Podcast","Blog","Other"];
const STORAGE_KEY = "creator_pipeline_v2";

const SC = {
  Discovered: stageTheme("#00D4FF"),
  Contacted:  stageTheme("#FFD600"),
  Responded:  stageTheme("#FF6BFF"),
  "In Talks": stageTheme("#FF7A00"),
  Onboarded:  stageTheme("#00FF87"),
  Declined:   stageTheme("#555555"),
};

const PC = { High: T.danger, Medium: T.warn, Low: T.success };
const PO = { High:0, Medium:1, Low:2 };

const EMPTY = {
  name:"", handle:"", platform:"Instagram", niche:"", followers:"",
  contact:"", notes:"", priority:"Medium", status:"Discovered",
  followUpDate:"", tags:[], log:[], dateAdded: Date.now(),
};

const TOAST_COLORS = {
  success: { color: T.success, bg: "rgba(0,255,135,0.12)", border: "rgba(0,255,135,0.3)", shadow: "rgba(0,255,135,0.15)", icon: "✓" },
  error:   { color: T.danger,  bg: "rgba(255,77,77,0.12)",  border: "rgba(255,77,77,0.3)",  shadow: "rgba(255,77,77,0.15)",  icon: "✕" },
  info:    { color: T.accent,  bg: "rgba(0,212,255,0.12)",  border: "rgba(0,212,255,0.3)",  shadow: "rgba(0,212,255,0.15)",  icon: "ℹ" },
};

const NOTES_MAX = 500;

// ─── Typography ─────────────────────────────────────────────────────────────
const mono = { fontFamily:"'Space Mono', monospace" };
const sans = { fontFamily:"'DM Sans', sans-serif" };
const heading = { fontFamily:"'Bebas Neue', sans-serif" };

// ─── Reusable Style Factories ───────────────────────────────────────────────
const btnBase = {
  borderRadius: T.radius, cursor:"pointer", fontSize:13,
  ...mono, minHeight: T.tap, transition: T.transition,
};

const ghostBtn = (extra = {}) => ({
  ...btnBase, background: T.surfaceHover, border:`1px solid ${T.borderLight}`, color: T.textMuted, ...extra,
});

const dangerBtn = (extra = {}) => ({
  ...btnBase, background:"rgba(255,77,77,0.06)", border:"1px solid rgba(255,77,77,0.2)", color: T.danger, ...extra,
});

const gradientBtn = (gradient, shadow, extra = {}) => ({
  ...btnBase, background:`linear-gradient(135deg,${gradient})`, border:"none",
  color:"#000", fontWeight:800, boxShadow: shadow, ...extra,
});

const Chevron = () => (
  <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color: T.textGhost, pointerEvents:"none", fontSize:10 }}>▼</span>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const isOverdue = d => d && new Date(d) < new Date(new Date().toDateString());

function relativeDate(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

function exportCSV(creators) {
  const headers = ["Name","Handle","Platform","Niche","Followers","Contact","Status","Priority","Follow-Up Date","Tags","Notes","Date Added"];
  const rows = creators.map(c => [c.name,c.handle,c.platform,c.niche,c.followers,c.contact,c.status,c.priority,c.followUpDate,(c.tags||[]).join("|"),c.notes,new Date(c.dateAdded).toLocaleDateString()].map(v=>`"${String(v||"").replace(/"/g,'""')}"`));
  const csv = [headers.join(","), ...rows.map(r=>r.join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `creator-pipeline-${Date.now()}.csv`;
  a.click();
}

function generateTemplate(creator) {
  const { name, platform, niche, handle } = creator;
  const p = platform || "your platform";
  const n = niche || "your content";
  const h = handle ? ` (${handle})` : "";
  return `Hey ${name||"there"}${h}! 👋\n\nI came across your ${p} page and love what you're doing in the ${n} space — your content genuinely stands out.\n\nI'm reaching out because we're building a creator program for our app and we think you'd be a perfect fit. We're looking for authentic voices like yours to help shape how we share the product with the world.\n\nHere's what's in it for you:\n• Early access + exclusive features\n• Monthly compensation based on performance\n• A real partnership, not just a one-time promo\n\nWould love to jump on a quick 15-min call to share more details. No pressure at all — just want to connect!\n\nLet me know if you're open to it. 🙏`;
}

// ─── Toast System ───────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:999, display:"flex", flexDirection:"column-reverse", gap:8, pointerEvents:"none", maxWidth:"90vw" }}>
      {toasts.map(t => {
        const tc = TOAST_COLORS[t.type] || TOAST_COLORS.info;
        return (
          <div key={t.id} onClick={() => onDismiss(t.id)} style={{
            pointerEvents:"auto", cursor:"pointer",
            background: tc.bg, border:`1px solid ${tc.border}`, color: tc.color,
            borderRadius: T.radiusLg, padding:"12px 20px", ...mono, fontSize:13, fontWeight:600,
            backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
            boxShadow:`0 8px 32px ${tc.shadow}`,
            animation: t.leaving ? "toastOut 0.25s ease forwards" : "toastIn 0.3s ease",
            display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap",
          }}>
            <span style={{ fontSize:16 }}>{tc.icon}</span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = "success", duration = 2500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, duration);
  }, []);
  const dismiss = useCallback(id => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);
  return { toasts, toast, dismiss };
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ message, detail, confirmLabel, onConfirm, onCancel, color = T.danger, mob }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn 0.15s ease" }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: T.elevated, border:`1px solid ${T.borderLight}`, borderTop:`3px solid ${color}`,
        borderRadius:16, padding: mob ? "24px 20px" : "28px 30px", maxWidth:400, width:"100%",
        animation:"scaleIn 0.2s ease",
        boxShadow:`0 8px 40px rgba(0,0,0,0.5), 0 0 30px ${color}15`,
      }}>
        <div style={{ fontSize:18, fontWeight:700, color: T.textBright, ...sans, marginBottom:8 }}>{message}</div>
        {detail && <div style={{ fontSize:14, color: T.textDim, lineHeight:1.6, ...sans, marginBottom:24 }}>{detail}</div>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={ghostBtn({ padding:"11px 20px" })}>CANCEL</button>
          <button onClick={onConfirm} style={{
            ...btnBase, background:`${color}15`, border:`1px solid ${color}44`,
            color, padding:"11px 20px", fontWeight:800,
          }}>{confirmLabel || "DELETE"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel Chart ────────────────────────────────────────────────────────────
function FunnelChart({ creators, mob }) {
  const active = STAGES.filter(s => s !== "Declined");
  const counts = active.map(s => creators.filter(c => c.status === s).length);
  const max = Math.max(...counts, 1);
  const [hovBar, setHovBar] = useState(null);
  return (
    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radiusLg, padding: mob?"14px":"18px 20px" }}>
      <div style={{ fontSize:11, color: T.textFaint, letterSpacing:2.5, textTransform:"uppercase", ...mono, marginBottom:14 }}>Conversion Funnel</div>
      <div style={{ display:"flex", alignItems:"flex-end", gap: mob?4:8, height:56 }}>
        {active.map((s,i) => {
          const pct = counts[i] / max;
          const c = SC[s];
          const isHov = hovBar === i;
          return (
            <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}
              onMouseEnter={() => setHovBar(i)} onMouseLeave={() => setHovBar(null)}>
              <div style={{ fontSize:mob?12:13, color:c.color, ...mono, fontWeight:700, transition:"transform 0.15s", transform: isHov ? "scale(1.15)" : "scale(1)" }}>{counts[i]}</div>
              <div style={{
                width:"100%", height: Math.max(4, pct * 40),
                background:`linear-gradient(180deg, ${c.color}, ${c.color}88)`,
                borderRadius:"3px 3px 1px 1px", transition:"height 0.4s ease, filter 0.15s",
                filter: isHov ? `drop-shadow(0 0 6px ${c.color}66)` : "none",
              }} />
              <div style={{ fontSize:10, color: isHov ? c.color : T.textFaint, textTransform:"uppercase", letterSpacing:0.5, textAlign:"center", lineHeight:1.2, ...mono, transition:"color 0.15s" }}>{s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tag Chip ────────────────────────────────────────────────────────────────
function TagChip({ label, active, onClick, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        fontSize:12, padding:"6px 12px", borderRadius:6, cursor:onClick?"pointer":"default",
        ...mono, display:"inline-flex", alignItems:"center", gap:6, minHeight:30,
        background: active ? "rgba(0,212,255,0.12)" : hov ? T.border : "#111",
        color: active ? T.accent : hov ? "#BBB" : T.textDim,
        border: `1px solid ${active ? "rgba(0,212,255,0.3)" : hov ? T.borderHover : T.borderLight}`,
        transition: T.transition, whiteSpace:"nowrap",
        transform: hov && onClick ? "translateY(-1px)" : "none",
      }}
    >
      {label}
      {onRemove && (
        <span onClick={e=>{e.stopPropagation();onRemove();}}
          style={{ color: hov ? T.danger : T.textDim, fontSize:11, cursor:"pointer", padding:6, margin:-4, lineHeight:1, borderRadius:4, transition:"color 0.15s", minWidth:28, minHeight:28, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
          ✕
        </span>
      )}
    </span>
  );
}

// ─── Creator Card ────────────────────────────────────────────────────────────
function CreatorCard({ creator, onSelect, draggable, onDragStart, mob, idx }) {
  const cfg = SC[creator.status];
  const overdue = isOverdue(creator.followUpDate);
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable={draggable} onDragStart={onDragStart}
      onClick={() => onSelect(creator)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? T.surfaceHover : T.surface,
        border:`1px solid ${hov ? cfg.border : T.borderFaint}`,
        borderLeft:`3px solid ${cfg.color}`,
        borderRadius: T.radiusLg, padding: mob?"14px":"16px 18px", cursor:"pointer",
        transition:"all 0.2s ease", userSelect:"none",
        WebkitTapHighlightColor:"transparent",
        transform: hov ? "scale(1.008)" : "scale(1)",
        boxShadow: hov ? `0 4px 20px ${cfg.glow}` : "none",
        animation: `fadeSlideUp 0.35s ease ${idx * 0.04}s both`,
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontWeight:600, fontSize: mob?15:14, color: T.textBright, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", ...sans }}>{creator.name||"Unnamed"}</div>
          <div style={{ fontSize:13, color: T.textFaint, marginTop:3, ...mono, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span>{creator.handle||"—"} · {creator.platform}</span>
            <span style={{ fontSize:11, color: T.textOff }}>{relativeDate(creator.dateAdded)}</span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
          <span style={{
            fontSize:10, fontWeight:700, color:cfg.color, background:cfg.bg,
            border:`1px solid ${cfg.border}`, padding:"4px 10px", borderRadius:5,
            letterSpacing:1, ...mono, display:"flex", alignItems:"center", gap:5,
          }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:cfg.color, animation:"dotPulse 2s ease infinite" }} />
            {creator.status.toUpperCase()}
          </span>
          <span style={{ fontSize:11, color:PC[creator.priority], ...mono, fontWeight:600 }}>● {creator.priority}</span>
        </div>
      </div>

      {creator.tags?.length > 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:10 }}>
          {creator.tags.map(t => <TagChip key={t} label={t} />)}
        </div>
      )}

      {creator.followUpDate && (
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color: overdue ? T.danger : T.textDim, ...mono }}>📅 {creator.followUpDate}</span>
          {overdue && <span style={{ fontSize:10, background:"rgba(255,77,77,0.12)", color: T.danger, border:"1px solid rgba(255,77,77,0.25)", padding:"3px 9px", borderRadius:4, ...mono, fontWeight:700, animation:"pulseOverdue 1.5s ease infinite" }}>OVERDUE</span>}
        </div>
      )}

      {creator.notes && (
        <div style={{ marginTop:10, fontSize:13, color: T.textMuted, lineHeight:1.6, borderTop:`1px solid ${T.borderLight}`, paddingTop:10, ...sans }}>
          {creator.notes.length > 90 ? creator.notes.slice(0,90)+"…" : creator.notes}
        </div>
      )}
      {creator.log?.length > 0 && (
        <div style={{ marginTop:6, fontSize:12, color: T.textGhost, ...mono }}>🗒 {creator.log.length} log {creator.log.length===1?"entry":"entries"}</div>
      )}
    </div>
  );
}

// ─── Kanban Board ────────────────────────────────────────────────────────────
function KanbanBoard({ creators, onSelect, onStageChange, mob }) {
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const verySmall = useMediaQuery("(max-width: 380px)");
  const w = verySmall ? 180 : mob ? 220 : 250;
  return (
    <div className="hide-sb" style={{ display:"flex", gap: mob?10:14, overflowX:"auto", paddingBottom:16, alignItems:"flex-start", WebkitOverflowScrolling:"touch", scrollSnapType: mob?"x mandatory":"none" }}>
      {STAGES.map(stage => {
        const cfg = SC[stage];
        const cards = creators.filter(c => c.status === stage);
        const isOver = overStage === stage;
        return (
          <div key={stage}
            onDragOver={e=>{e.preventDefault();setOverStage(stage);}} onDragLeave={()=>setOverStage(null)}
            onDrop={e=>{e.preventDefault();if(dragId)onStageChange(dragId,stage);setDragId(null);setOverStage(null);}}
            style={{ minWidth:w, flex:`0 0 ${w}px`, scrollSnapAlign: mob?"start":"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, paddingBottom:8, borderBottom:`2px solid ${cfg.border}` }}>
              <span style={{ fontSize:12, fontWeight:700, color:cfg.color, textTransform:"uppercase", letterSpacing:1.5, ...mono }}>{stage}</span>
              <span style={{ fontSize:13, fontWeight:800, color:cfg.color, ...mono, background:cfg.bg, padding:"2px 8px", borderRadius:4 }}>{cards.length}</span>
            </div>
            <div style={{
              minHeight:80, borderRadius: T.radius, padding:8,
              background: isOver ? cfg.bg : "transparent",
              border:`1px dashed ${isOver ? cfg.border : T.borderSubtle}`,
              display:"flex", flexDirection:"column", gap:8,
              transition:"all 0.25s ease",
              transform: isOver ? "scale(1.01)" : "scale(1)",
            }}>
              {cards.length===0 && (
                <div style={{
                  fontSize:13, color: isOver ? cfg.color : T.textDead, textAlign:"center",
                  padding:"24px 0", ...mono, transition:"color 0.2s",
                  borderRadius:8, border: isOver ? "none" : `1px dashed ${T.border}`,
                }}>
                  {isOver ? `→ Move to ${stage}` : "Empty"}
                </div>
              )}
              {cards.map((c,i)=><CreatorCard key={c.id} creator={c} onSelect={onSelect} mob={mob} idx={i} draggable onDragStart={()=>setDragId(c.id)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Log Entry ──────────────────────────────────────────────────────────────
function LogEntry({ entry, index, mob, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", flexDirection: mob?"column":"row", gap: mob?3:12,
        background: hov ? T.surfaceHover : T.surface,
        border:`1px solid ${hov ? T.borderLight : T.borderFaint}`,
        borderRadius:8, padding:"10px 14px",
        animation:`fadeSlideUp 0.2s ease ${index*0.03}s both`,
        transition: T.transition, position:"relative",
      }}
    >
      <span style={{ color: T.textFaint, fontSize:12, whiteSpace:"nowrap", ...mono }}>{entry.date}</span>
      <span style={{ fontSize:14, color:"#BBB", lineHeight:1.5, ...sans, flex:1 }}>{entry.text}</span>
      {hov && (
        <button onClick={onRemove} style={{
          ...dangerBtn({
            position: mob ? "relative" : "absolute", right: mob ? "auto" : 4, top: mob ? "auto" : 4,
            borderRadius:6, width: mob ? "100%" : 36, height:36,
            fontSize:12, display:"flex", alignItems:"center", justifyContent:"center",
            marginTop: mob ? 6 : 0, minHeight:36, padding:0,
          }),
        }}>
          {mob ? "Remove" : "✕"}
        </button>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ creator, onClose, onSave, onDelete, mob, toast }) {
  const isNew = !creator;
  const [form, setForm] = useState(creator ? {...creator} : {...EMPTY, dateAdded: Date.now()});
  const [log, setLog] = useState(creator?.log || []);
  const [entry, setEntry] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [template, setTemplate] = useState("");
  const [tab, setTab] = useState("info");
  const [copied, setCopied] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (nameRef.current) {
      const timer = setTimeout(() => nameRef.current.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") {
        if (confirmDelete) { setConfirmDelete(false); return; }
        if (confirmClose) { setConfirmClose(false); return; }
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setDirty(true); };
  const cfg = SC[form.status];

  const addLog = () => {
    if (!entry.trim()) return;
    setLog(l => [{text:entry, date:now()}, ...l]);
    setEntry("");
    setDirty(true);
  };

  const removeLogEntry = idx => {
    setLog(l => l.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const addTag = () => {
    const t=tagInput.trim().toLowerCase().replace(/\s+/g,"-");
    if(!t||form.tags?.includes(t))return;
    set("tags",[...(form.tags||[]),t]);
    setTagInput("");
  };

  const removeTag = tag => set("tags", form.tags.filter(t=>t!==tag));

  const handleSave = () => {
    if (!form.name.trim()) {
      toast("Creator name is required", "error");
      setTab("info");
      if (nameRef.current) nameRef.current.focus();
      return;
    }
    let finalLog = log;
    if (creator && creator.status !== form.status) {
      finalLog = [{text:`Moved to ${form.status}`, date:now()}, ...log];
    }
    onSave({...form, log: finalLog, id: form.id||Date.now()});
    toast(isNew ? "Creator added" : "Changes saved", "success");
  };

  const handleClose = () => {
    if (dirty) setConfirmClose(true);
    else onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    toast("Copied to clipboard", "success");
    setTimeout(()=>setCopied(false),2000);
  };

  const confirmDeleteAction = () => {
    onDelete(creator.id);
    toast("Creator deleted", "error");
  };

  const inp = (key, extra={}) => ({
    background: T.surface, border:`1px solid ${focusField===key ? cfg.border : T.border}`,
    borderRadius: T.radius, padding: mob?"13px 14px":"11px 14px", color: T.text,
    fontSize: mob?16:13, outline:"none", width:"100%", boxSizing:"border-box", ...mono,
    minHeight: T.tap, transition:"border 0.2s ease, box-shadow 0.2s ease",
    boxShadow: focusField===key ? `0 0 0 3px ${cfg.glow}` : "none",
    ...extra,
  });

  const lbl = { fontSize:11, color: T.textDim, textTransform:"uppercase", letterSpacing:2, marginBottom:7, display:"block", ...mono };

  const tabStyle = (id) => ({
    ...btnBase,
    background: tab===id ? cfg.bg : "transparent",
    border:`1px solid ${tab===id ? cfg.border : T.border}`,
    color: tab===id ? cfg.color : T.textFaint,
    borderRadius:8, padding: mob?"11px 14px":"8px 16px",
    fontWeight: tab===id?700:400, flex: mob?1:"none",
  });

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems: mob?"flex-end":"center", justifyContent:"center", padding: mob?0:16, animation:"fadeIn 0.2s ease" }}
        onClick={e => e.target===e.currentTarget && handleClose()}>
        <div className="hide-sb" style={{
          background: T.modal, border:`1px solid ${T.border}`, borderTop:`3px solid ${cfg.color}`,
          borderRadius: mob?"20px 20px 0 0":14,
          width:"100%", maxWidth: mob?"100%":560,
          maxHeight: mob?"calc(94vh - env(safe-area-inset-bottom, 0px))":"90vh",
          overflowY:"auto", padding: mob?"16px 16px":"28px 26px",
          paddingBottom: mob?"calc(20px + env(safe-area-inset-bottom, 0px))":"28px",
          WebkitOverflowScrolling:"touch",
          animation: mob?"slideUp 0.3s ease":"fadeSlideUp 0.25s ease",
          boxShadow: `0 -8px 40px ${cfg.glow}`,
        }}>
          {mob && <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><div style={{ width:36, height:4, borderRadius:2, background: T.borderHover }}/></div>}

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:11, color:cfg.color, letterSpacing:2.5, textTransform:"uppercase", ...mono, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, display:"inline-block" }} />
                {form.status}
              </div>
              <h2 style={{ margin:"6px 0 0", fontSize: mob?20:22, color: T.textBright, ...heading, letterSpacing:2 }}>
                {isNew ? "NEW CREATOR" : "EDIT CREATOR"}
              </h2>
            </div>
            <button onClick={handleClose} style={{
              background:"#111", border:`1px solid ${T.borderLight}`, color: T.textMuted, fontSize:16,
              cursor:"pointer", borderRadius:8, width:44, height:44,
              display:"flex", alignItems:"center", justifyContent:"center", transition: T.transition,
            }}>✕</button>
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:22 }}>
            {[["info","📋 Info"],["log",`🗒 Log${log.length > 0 ? ` (${log.length})` : ""}`],["template","✉️ Outreach"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={tabStyle(id)}>{label}</button>
            ))}
          </div>

          {tab==="info" && (
            <div style={{ display:"grid", gridTemplateColumns: mob?"1fr":"1fr 1fr", gap: mob?14:12 }}>
              {[["name","Creator Name"],["handle","Handle / @username"],["niche","Niche / Category"],["followers","Follower Count"],["contact","Contact Info / Email"]].map(([k,ph])=>(
                <div key={k} style={(!mob && ["name","contact"].includes(k))?{gridColumn:"1/-1"}:{}}>
                  <label style={lbl}>{ph}{k === "name" && <span style={{ color: T.danger, marginLeft:3 }}>*</span>}</label>
                  <input
                    ref={k === "name" ? nameRef : undefined}
                    placeholder={ph}
                    value={form[k]||""}
                    onChange={e=>set(k,e.target.value)}
                    onFocus={()=>setFocusField(k)} onBlur={()=>setFocusField(null)}
                    style={inp(k, k === "name" && !form.name.trim() && dirty ? { borderColor: "rgba(255,77,77,0.4)" } : {})}
                  />
                </div>
              ))}
              <div>
                <label style={lbl}>Platform</label>
                <div style={{ position:"relative" }}>
                  <select value={form.platform} onChange={e=>set("platform",e.target.value)}
                    onFocus={()=>setFocusField("platform")} onBlur={()=>setFocusField(null)}
                    style={inp("platform",{appearance:"none",cursor:"pointer",paddingRight:36})}>
                    {PLATFORMS.map(p=><option key={p} value={p} style={{background:T.surface}}>{p}</option>)}
                  </select>
                  <Chevron />
                </div>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <div style={{ position:"relative" }}>
                  <select value={form.priority} onChange={e=>set("priority",e.target.value)}
                    onFocus={()=>setFocusField("priority")} onBlur={()=>setFocusField(null)}
                    style={inp("priority",{appearance:"none",cursor:"pointer",color:PC[form.priority],paddingRight:36})}>
                    {["High","Medium","Low"].map(p=><option key={p} value={p} style={{background:T.surface,color:PC[p]}}>{p}</option>)}
                  </select>
                  <Chevron />
                </div>
              </div>
              <div>
                <label style={lbl}>Follow-Up Date</label>
                <input type="date" value={form.followUpDate||""} onChange={e=>set("followUpDate",e.target.value)}
                  onFocus={()=>setFocusField("date")} onBlur={()=>setFocusField(null)}
                  style={inp("date",{colorScheme:"dark", color: isOverdue(form.followUpDate) ? T.danger : T.text})} />
              </div>
              <div style={ mob?{}:{gridColumn:"1/-1"}}>
                <label style={lbl}>Status</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {STAGES.map(s => {
                    const a=form.status===s, c=SC[s];
                    return <button key={s} onClick={()=>set("status",s)} style={{
                      ...btnBase,
                      background:a?c.bg:T.surface, border:`1px solid ${a?c.border:T.border}`,
                      color:a?c.color:T.textGhost, borderRadius:8, padding: mob?"10px 12px":"7px 13px",
                      fontSize:12, fontWeight:a?700:400,
                      boxShadow: a?`0 0 12px ${c.glow}`:"none",
                    }}>{s}</button>;
                  })}
                </div>
              </div>
              <div style={ mob?{}:{gridColumn:"1/-1"}}>
                <label style={lbl}>Tags</label>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input placeholder="Add a tag…" value={tagInput} onChange={e=>setTagInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addTag()}
                    onFocus={()=>setFocusField("tag")} onBlur={()=>setFocusField(null)} style={inp("tag",{flex:1})} />
                  <button onClick={addTag} style={gradientBtn(`${T.warn},#FF7A00`, "none", { padding:"0 16px", whiteSpace:"nowrap", opacity: tagInput.trim() ? 1 : 0.5 })}>+ TAG</button>
                </div>
                {form.tags?.length > 0 && <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{form.tags.map(t=><TagChip key={t} label={t} onRemove={()=>removeTag(t)} />)}</div>}
              </div>
              <div style={ mob?{}:{gridColumn:"1/-1"}}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <label style={lbl}>Notes</label>
                  <span style={{ fontSize:11, color: (form.notes||"").length > NOTES_MAX * 0.9 ? T.danger : T.textOff, ...mono }}>
                    {(form.notes||"").length}/{NOTES_MAX}
                  </span>
                </div>
                <textarea rows={3} placeholder="Anything worth remembering…" value={form.notes||""}
                  onChange={e => { if (e.target.value.length <= NOTES_MAX) set("notes", e.target.value); }}
                  onFocus={()=>setFocusField("notes")} onBlur={()=>setFocusField(null)}
                  style={inp("notes",{resize:"vertical",lineHeight:1.7,...sans})} />
              </div>
            </div>
          )}

          {tab==="log" && (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <input placeholder="Log an update…" value={entry} onChange={e=>setEntry(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addLog()}
                  onFocus={()=>setFocusField("log")} onBlur={()=>setFocusField(null)} style={inp("log",{flex:1})} />
                <button onClick={addLog} style={gradientBtn(`${T.accent},${T.success}`, "none", { padding:"0 18px", opacity: entry.trim() ? 1 : 0.5 })}>LOG</button>
              </div>
              <div className="hide-sb" style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:320, overflowY:"auto" }}>
                {log.length===0
                  ? (
                    <div style={{ fontSize:14, color: T.textOff, ...mono, padding:"36px 0", textAlign:"center", border:`1px dashed ${T.border}`, borderRadius: T.radius }}>
                      <div style={{ fontSize:28, marginBottom:8 }}>📝</div>
                      No log entries yet
                    </div>
                  )
                  : log.map((l,i)=>(
                    <LogEntry key={`${l.date}-${i}`} entry={l} index={i} mob={mob} onRemove={() => removeLogEntry(i)} />
                  ))
                }
              </div>
            </div>
          )}

          {tab==="template" && (
            <div>
              <p style={{ fontSize:14, color: T.textMuted, marginBottom:16, lineHeight:1.7, ...sans }}>
                Generate a personalized outreach message based on this creator's info.
              </p>
              <button onClick={()=>setTemplate(generateTemplate(form))} style={gradientBtn("#FF6BFF,#00D4FF", "0 4px 20px rgba(255,107,255,0.2)", { padding:"13px 22px", fontSize:14, marginBottom:18, width: mob?"100%":"auto" })}>
                ✨ GENERATE TEMPLATE
              </button>
              {template && (
                <div style={{ animation:"fadeSlideUp 0.25s ease" }}>
                  <textarea value={template} onChange={e=>setTemplate(e.target.value)} rows={mob?10:12}
                    onFocus={()=>setFocusField("tpl")} onBlur={()=>setFocusField(null)}
                    style={inp("tpl",{lineHeight:1.7, resize:"vertical", color:"#BBB", ...sans, fontSize: mob?16:13})} />
                  <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                    <button onClick={handleCopy} style={{
                      ...btnBase,
                      background: copied?"rgba(0,255,135,0.1)":T.surfaceHover,
                      border: copied?`1px solid rgba(0,255,135,0.3)`:`1px solid ${T.borderLight}`,
                      color: copied ? T.success : T.textMuted,
                      padding:"11px 16px", flex: mob?1:"none",
                      fontWeight: copied ? 700 : 400,
                    }}>
                      {copied ? "✓ COPIED!" : "📋 COPY TO CLIPBOARD"}
                    </button>
                    <button onClick={()=>setTemplate("")} style={ghostBtn({ padding:"11px 16px", color: T.textGhost })}>CLEAR</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${T.borderSubtle}`, paddingTop:20, flexDirection: mob?"column":"row" }}>
            <div style={{ display:"flex", gap:10, width: mob?"100%":"auto", order: mob?1:0 }}>
              <button onClick={handleClose} style={ghostBtn({ padding:"12px 20px", flex: mob?1:"none" })}>CANCEL</button>
              <button onClick={handleSave} style={gradientBtn(`${T.success},${T.accent}`, `0 4px 16px rgba(0,255,135,0.2)`, { padding:"12px 28px", flex: mob?1:"none" })}>SAVE</button>
            </div>
            {!isNew && (
              <button onClick={() => setConfirmDelete(true)} style={dangerBtn({ padding:"12px 18px", width: mob?"100%":"auto", order: mob?2:0 })}>DELETE</button>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message="Delete this creator?"
          detail={`"${form.name || "Unnamed"}" will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(false)}
          mob={mob}
        />
      )}

      {confirmClose && (
        <ConfirmDialog
          message="Discard unsaved changes?"
          detail="You have unsaved changes that will be lost."
          confirmLabel="DISCARD"
          onConfirm={onClose}
          onCancel={() => setConfirmClose(false)}
          color={T.warn}
          mob={mob}
        />
      )}
    </>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const mob = useMediaQuery("(max-width: 640px)");
  const tab = useMediaQuery("(max-width: 900px)");
  const [creators, setCreators] = useState([]);
  const [modal, setModal] = useState(null);
  const [stageFilter, setStageFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("dateAdded");
  const [view, setView] = useState("list");
  const [loaded, setLoaded] = useState(false);
  const { toasts, toast, dismiss } = useToasts();
  const searchRef = useRef(null);

  useEffect(() => {
    try { const d = localStorage.getItem(STORAGE_KEY); if (d) setCreators(JSON.parse(d)); } catch(_) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !modal) {
        e.preventDefault();
        setModal("add");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]);

  const persist = useCallback(data => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(_) {}
  }, []);

  const saveCreator = c => {
    setCreators(prev => { const next = prev.find(x=>x.id===c.id) ? prev.map(x=>x.id===c.id?c:x) : [c,...prev]; persist(next); return next; });
    setModal(null);
  };
  const deleteCreator = id => { setCreators(prev => { const next = prev.filter(x=>x.id!==id); persist(next); return next; }); setModal(null); };
  const changeStage = (id, status) => {
    setCreators(prev => { const next = prev.map(x => x.id===id ? {...x, status, log:[{text:`Moved to ${status}`, date:now()}, ...(x.log||[])]} : x); persist(next); return next; });
    toast(`Moved to ${status}`, "info");
  };

  const handleExport = () => {
    if (creators.length === 0) { toast("No creators to export", "error"); return; }
    exportCSV(creators);
    toast(`Exported ${creators.length} creators`, "success");
  };

  const hasActiveFilters = stageFilter !== "All" || tagFilter || search;
  const clearAllFilters = () => { setStageFilter("All"); setTagFilter(null); setSearch(""); };

  const allTags = [...new Set(creators.flatMap(c=>c.tags||[]))].sort();
  const visible = creators
    .filter(c => {
      if (stageFilter!=="All" && c.status!==stageFilter) return false;
      if (tagFilter && !(c.tags||[]).includes(tagFilter)) return false;
      const q = search.toLowerCase();
      if (q && !["name","handle","niche","platform"].some(k=>c[k]?.toLowerCase().includes(q)) && !(c.tags||[]).some(t=>t.includes(q))) return false;
      return true;
    })
    .sort((a,b) => {
      if (sort==="priority") return PO[a.priority]-PO[b.priority];
      if (sort==="followUp") { if(!a.followUpDate) return 1; if(!b.followUpDate) return -1; return new Date(a.followUpDate)-new Date(b.followUpDate); }
      return (b.dateAdded||0)-(a.dateAdded||0);
    });

  const counts = STAGES.reduce((a,s)=>({...a,[s]:creators.filter(c=>c.status===s).length}),{});
  const csvBtnDisabled = creators.length === 0;

  if (!loaded) return (
    <div style={{ background: T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <InjectedStyles />
      <div style={{ color: T.textFaint, fontSize:14, ...mono, animation:"pulseOverdue 1.5s ease infinite" }}>LOADING…</div>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight:"100vh", ...sans, color: T.text, paddingBottom:"env(safe-area-inset-bottom, 0px)" }}>
      <InjectedStyles />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Top Bar ────────────────────────────── */}
      <div style={{
        borderBottom:"1px solid #111",
        padding: mob?"12px max(14px, env(safe-area-inset-left, 0px)) 12px max(14px, env(safe-area-inset-right, 0px))":"16px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap: mob?8:14,
        background:"rgba(8,8,8,0.9)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:100, flexWrap:"wrap",
      }}>
        <div style={{ display:"flex", alignItems:"baseline", gap: mob?6:8 }}>
          <span style={{ fontSize: mob?20:26, ...heading, letterSpacing:3, background:`linear-gradient(135deg,${T.success},${T.accent})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>CREATOR</span>
          <span style={{ fontSize: mob?20:26, ...heading, letterSpacing:3, color:"#EFEFEF" }}>PIPELINE</span>
        </div>
        <div style={{ display:"flex", gap: mob?6:8, alignItems:"center" }}>
          <div style={{ display:"flex", border:`1px solid ${T.border}`, borderRadius: T.radius, overflow:"hidden", background: T.surface }}>
            {[["list","☰","List"],["kanban","⬛","Kanban"]].map(([v,icon,label])=>(
              <button key={v} onClick={()=>setView(v)} style={{
                ...btnBase,
                background: view===v ? T.active : "transparent", border:"none",
                color: view===v ? T.text : T.textFaint, padding: mob?"10px 14px":"9px 16px",
                borderBottom: view===v ? `2px solid ${T.accent}` : "2px solid transparent",
                borderRadius:0,
              }}>
                {mob ? icon : `${icon} ${label}`}
              </button>
            ))}
          </div>
          {!mob && (
            <button onClick={handleExport} style={ghostBtn({ background: T.surface, border:`1px solid ${T.border}`, padding:"9px 16px", opacity: csvBtnDisabled ? 0.4 : 1 })}>
              ↓ CSV
            </button>
          )}
          <button onClick={()=>setModal("add")} style={gradientBtn(`${T.success},${T.accent}`, "none", {
            padding: mob?"10px 16px":"10px 22px", whiteSpace:"nowrap",
            animation:"pulseGlow 2.5s ease infinite",
          })}>
            + {mob ? "ADD" : "ADD CREATOR"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1140, margin:"0 auto", padding: mob?"14px max(12px, env(safe-area-inset-left, 0px)) 90px max(12px, env(safe-area-inset-right, 0px))":"24px 24px 80px" }}>

        {/* ── Stage Filter ────────────────────── */}
        <div className="hide-sb" style={{
          display:"flex", overflow: mob?"auto":"hidden", borderRadius: T.radiusLg,
          border:`1px solid ${T.borderSubtle}`, marginBottom: mob?14:22,
          background: T.surface, WebkitOverflowScrolling:"touch",
        }}>
          {["All",...STAGES].map((s,i) => {
            const scfg = s==="All" ? null : SC[s];
            const cnt = s==="All" ? creators.length : (counts[s]||0);
            const active = stageFilter===s;
            return (
              <button key={s} onClick={()=>setStageFilter(active&&s!=="All"?"All":s)} style={{
                flex: mob?"0 0 auto":1, minWidth: mob?74:"auto",
                background: active?(scfg?.bg||"rgba(255,255,255,0.04)"):"transparent",
                border:"none", borderRight: i<STAGES.length?`1px solid ${T.borderSubtle}`:"none",
                borderTop: active?`2px solid ${scfg?.color||T.textOff}`:"2px solid transparent",
                padding: mob?"12px 14px":"14px 6px", cursor:"pointer",
                transition: T.transition, minHeight: T.tap,
                boxShadow: active ? `inset 0 -1px 12px ${scfg?.glow||"rgba(255,255,255,0.03)"}` : "none",
              }}>
                <div style={{ fontSize: mob?17:20, fontWeight:800, color: active?(scfg?.color||T.text):(cnt>0?T.textGhost:T.textDead), ...mono, transition:"color 0.2s" }}>{cnt}</div>
                <div style={{ fontSize: mob?10:11, color:active?(scfg?.color||T.text):T.textGhost, textTransform:"uppercase", letterSpacing:1, marginTop:3, whiteSpace:"nowrap", ...mono }}>{s}</div>
              </button>
            );
          })}
        </div>

        {/* ── Stats + Funnel ──────────────────── */}
        <div style={{
          display:"grid",
          gridTemplateColumns: mob?"1fr 1fr" : tab?"1fr 1fr 1fr" : "1fr 1fr 1fr 1fr 1.8fr",
          gap: mob?8:12, marginBottom: mob?14:22,
        }}>
          {[["Total",creators.length,T.accent],["Onboarded",counts["Onboarded"]||0,T.success],["Hot 🔥",counts["In Talks"]||0,"#FF7A00"],["Awaiting",counts["Responded"]||0,"#FF6BFF"]].map(([l,v,a])=>(
            <div key={l} style={{
              background: T.surface, border:`1px solid ${T.borderFaint}`, borderTop:`2px solid ${a}`,
              borderRadius: T.radiusLg, padding: mob?"14px":"18px 20px",
              boxShadow:`inset 0 1px 0 ${a}11`,
            }}>
              <div style={{ fontSize: mob?24:28, fontWeight:800, color:a, ...mono, letterSpacing:-1 }}>{v}</div>
              <div style={{ fontSize: mob?10:11, color: T.textDim, textTransform:"uppercase", letterSpacing:2.5, marginTop:5, ...mono }}>{l}</div>
            </div>
          ))}
          <div style={ mob||tab ? { gridColumn:"1/-1" } : {}}>
            <FunnelChart creators={creators} mob={mob} />
          </div>
        </div>

        {/* ── Search + Sort + Tags ────────────── */}
        <div style={{ display:"flex", flexDirection: mob?"column":"row", gap: mob?10:12, marginBottom:18, flexWrap: mob?"nowrap":"wrap", alignItems: mob?"stretch":"center" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ position:"relative", flex: mob?1:"none" }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color: T.textGhost, fontSize:14, pointerEvents:"none" }}>⌕</span>
              <input ref={searchRef} placeholder={mob ? "Search…" : "Search creators… ⌘K"} value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius, padding:"10px 14px 10px 34px", color: T.text, fontSize: mob?16:12, outline:"none", width: mob?"100%":240, ...mono, minHeight: T.tap, boxSizing:"border-box", transition:"border 0.2s", paddingRight: search ? 42 : 14 }} />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position:"absolute", right:4, top:"50%", transform:"translateY(-50%)",
                  background: T.border, border:"none", color: T.textMuted, cursor:"pointer",
                  borderRadius:6, width:36, height:36, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:12, transition: T.transition, padding:0,
                }}>✕</button>
              )}
            </div>
            <div style={{ position:"relative" }}>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius, padding:"10px 32px 10px 14px", color:"#AAA", fontSize:13, outline:"none", cursor:"pointer", ...mono, minHeight: T.tap, appearance:"none" }}>
                <option value="dateAdded">{mob?"Date":"Sort: Date Added"}</option>
                <option value="priority">{mob?"Priority":"Sort: Priority"}</option>
                <option value="followUp">{mob?"Follow-Up":"Sort: Follow-Up"}</option>
              </select>
              <Chevron />
            </div>
            {mob && <button onClick={handleExport} style={ghostBtn({ background: T.surface, border:`1px solid ${T.border}`, padding:"10px 14px", opacity: csvBtnDisabled ? 0.4 : 1 })}>↓</button>}
          </div>

          {allTags.length > 0 && (
            <div className="hide-sb" style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", overflow:"visible", WebkitOverflowScrolling:"touch" }}>
              <span style={{ fontSize:11, color: T.textDim, ...mono, whiteSpace:"nowrap", letterSpacing:1 }}>TAGS:</span>
              {allTags.map(t=><TagChip key={t} label={t} active={tagFilter===t} onClick={()=>setTagFilter(tagFilter===t?null:t)} />)}
            </div>
          )}

          <div style={{ marginLeft: mob?0:"auto", display:"flex", alignItems:"center", gap:10 }}>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={dangerBtn({ padding:"6px 12px", borderRadius:8, fontSize:12, whiteSpace:"nowrap", background:"rgba(255,77,77,0.06)", border:"1px solid rgba(255,77,77,0.15)" })}>
                CLEAR FILTERS
              </button>
            )}
            <span style={{ fontSize:13, color: T.textFaint, ...mono }}>{visible.length}/{creators.length}</span>
          </div>
        </div>

        {/* ── Content ─────────────────────────── */}
        {creators.length===0 ? (
          <div style={{ textAlign:"center", padding: mob?"56px 20px":"72px 28px", border:`1px dashed ${T.border}`, borderRadius:14, animation:"fadeSlideUp 0.4s ease" }}>
            <div style={{ fontSize:42, marginBottom:16 }}>📡</div>
            <div style={{ color: T.textDim, fontSize:16, ...mono, fontWeight:700, letterSpacing:2 }}>NO CREATORS YET</div>
            <div style={{ color: T.textFaint, fontSize:14, marginTop:10, ...sans }}>Hit <span style={{color: T.success,fontWeight:700}}>+ ADD</span> to start building your pipeline</div>
            <div style={{ color: T.textOff, fontSize:12, marginTop:16, ...mono }}>or press ⌘N</div>
          </div>
        ) : view==="kanban" ? (
          <KanbanBoard creators={visible} onSelect={setModal} onStageChange={changeStage} mob={mob} />
        ) : (
          <div style={{ display:"grid", gap: mob?8:10 }}>
            {visible.length===0
              ? (
                <div style={{ textAlign:"center", padding:"48px", border:`1px dashed ${T.border}`, borderRadius:14 }}>
                  <div style={{ color: T.textDim, ...mono, fontSize:15, marginBottom:8 }}>NO MATCHES</div>
                  <button onClick={clearAllFilters} style={{
                    ...btnBase, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)",
                    color: T.accent, borderRadius:8, padding:"8px 16px", fontSize:12,
                  }}>
                    CLEAR FILTERS
                  </button>
                </div>
              )
              : visible.map((c,i)=><CreatorCard key={c.id} creator={c} onSelect={setModal} mob={mob} idx={i} />)
            }
          </div>
        )}
      </div>

      {modal && (
        <Modal creator={modal==="add"?null:modal} onClose={()=>setModal(null)}
          onSave={saveCreator} onDelete={deleteCreator} mob={mob} toast={toast} />
      )}
    </div>
  );
}
