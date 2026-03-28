import { useState, useEffect, useRef } from "react";
import { fetchProviders, signIn, signUp } from "./api";

const mono = { fontFamily: "'Space Mono', monospace" };
const sans = { fontFamily: "'DM Sans', sans-serif" };
const heading = { fontFamily: "'Bebas Neue', sans-serif" };

const T = {
  bg: "#060606", surface: "#0A0A0A", border: "#1A1A1A", borderLight: "#1E1E1E",
  text: "#E0E0E0", textBright: "#F0F0F0", textMuted: "#999", textDim: "#888",
  textFaint: "#777", accent: "#00D4FF", success: "#00FF87", danger: "#FF4D4D",
};

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState(null);
  const emailRef = useRef(null);

  useEffect(() => {
    fetchProviders().then(setProviders).catch(() => setProviders({ email: true }));
  }, []);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      onAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (focused) => ({
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "13px 14px", color: T.text,
    fontSize: 16, outline: "none", width: "100%", boxSizing: "border-box",
    ...mono, minHeight: 44, transition: "border 0.2s ease, box-shadow 0.2s ease",
  });

  if (!providers) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.textFaint, fontSize: 14, ...mono, animation: "pulseOverdue 1.5s ease infinite" }}>LOADING…</div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, ...sans }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderTop: `3px solid ${T.accent}`, borderRadius: 16,
        padding: "36px 32px", width: "100%", maxWidth: 420,
        animation: "fadeSlideUp 0.35s ease",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 28, ...heading, letterSpacing: 3, background: `linear-gradient(135deg,${T.success},${T.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CREATOR</span>
            <span style={{ fontSize: 28, ...heading, letterSpacing: 3, color: "#EFEFEF" }}>PIPELINE</span>
          </div>
          <div style={{ fontSize: 13, color: T.textDim, ...mono, letterSpacing: 1 }}>
            {mode === "signin" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)",
            color: T.danger, borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, ...mono, animation: "fadeSlideUp 0.2s ease",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 7, display: "block", ...mono }}>Name</label>
              <input
                placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)}
                style={inp()} autoComplete="name"
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 7, display: "block", ...mono }}>Email</label>
            <input
              ref={emailRef}
              type="email" placeholder="you@example.com" required
              value={email} onChange={e => setEmail(e.target.value)}
              style={inp()} autoComplete="email"
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 7, display: "block", ...mono }}>Password</label>
            <input
              type="password" placeholder={mode === "signup" ? "Min 8 characters" : "Your password"} required
              value={password} onChange={e => setPassword(e.target.value)}
              style={inp()} autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            background: `linear-gradient(135deg,${T.success},${T.accent})`,
            border: "none", color: "#000", borderRadius: 10, padding: "14px",
            cursor: loading ? "wait" : "pointer", fontWeight: 800, fontSize: 14,
            ...mono, minHeight: 48, transition: "all 0.15s",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 4px 16px rgba(0,255,135,0.2)",
            marginTop: 4,
          }}>
            {loading ? "..." : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            style={{
              background: "none", border: "none", color: T.accent,
              cursor: "pointer", fontSize: 13, ...mono, padding: 8,
              transition: "all 0.15s",
            }}>
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
