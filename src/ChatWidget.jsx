import { useState, useRef, useEffect, useCallback } from "react";

// ─── Chat Widget ─────────────────────────────────────────────────────────────
// Floating chat panel that connects to the ZeroClaw gateway via /api/chat
// Defaults to the creator-outreach agent

const AGENT_ID = "creator-outreach";

export default function ChatWidget({ theme }) {
  const T = theme;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          agent_id: AGENT_ID,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: "error", content: data.error || "Request failed" }]);
        return;
      }

      // Extract reply from gateway response
      const reply = data.reply || data.response || data.content || data.message || JSON.stringify(data);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);

      // Track conversation
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch {
      setMessages(prev => [...prev, { role: "error", content: "Failed to reach gateway" }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, conversationId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Chat with Creator Outreach Agent"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00D4FF 0%, #00FF87 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,212,255,0.3)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          zIndex: 9999,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,212,255,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,212,255,0.3)"; }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#060606" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3 6.5V18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z" />
          <path d="M9 22h6" />
          <path d="M10 22v-1" />
          <path d="M14 22v-1" />
        </svg>
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      width: 380,
      maxWidth: "calc(100vw - 48px)",
      height: 520,
      maxHeight: "calc(100dvh - 48px)",
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
      zIndex: 9999,
      animation: "scaleIn 0.2s ease",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: T.elevated,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #00D4FF 0%, #00FF87 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🤖</div>
          <div>
            <div style={{ color: T.textBright, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              Creator Outreach Agent
            </div>
            <div style={{ color: T.textDim, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
              {loading ? "thinking..." : "online"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={clearChat} title="Clear chat" style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.textDim, padding: 6, borderRadius: 6, fontSize: 16,
          }}>🗑</button>
          <button onClick={() => setOpen(false)} title="Close" style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.textDim, padding: 6, borderRadius: 6, fontSize: 18, lineHeight: 1,
          }}>✕</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: "auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }} className="hide-sb">
        {messages.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "40px 16px",
            color: T.textDim,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Creator Outreach Agent</div>
            <div style={{ fontSize: 12, color: T.textFaint, lineHeight: 1.5 }}>
              Ask me to find creators, draft outreach messages,<br />
              review the pipeline, or follow up on contacts.
            </div>
            <div style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              {[
                "Find 10 TikTok creators in the fitness niche",
                "Draft outreach for discovered creators",
                "Give me a pipeline status report",
                "Follow up on creators who haven't responded",
              ].map(q => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }} style={{
                  background: `rgba(0,212,255,0.06)`,
                  border: `1px solid rgba(0,212,255,0.15)`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: T.accent,
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user"
                ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,255,135,0.08))"
                : m.role === "error"
                  ? "rgba(255,77,77,0.1)"
                  : T.elevated,
              border: `1px solid ${m.role === "error" ? "rgba(255,77,77,0.25)" : T.border}`,
              color: m.role === "error" ? T.danger : T.text,
              fontSize: 13,
              lineHeight: 1.55,
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: "flex-start",
            padding: "10px 14px",
            borderRadius: "14px 14px 14px 4px",
            background: T.elevated,
            border: `1px solid ${T.border}`,
            display: "flex",
            gap: 4,
          }}>
            {[0, 1, 2].map(j => (
              <div key={j} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: T.accent,
                animation: `dotPulse 1.2s ease infinite ${j * 0.2}s`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: 12,
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        gap: 8,
        background: T.elevated,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the outreach agent..."
          disabled={loading}
          style={{
            flex: 1,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: T.text,
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: input.trim() && !loading
              ? "linear-gradient(135deg, #00D4FF, #00FF87)"
              : T.surface,
            border: `1px solid ${input.trim() && !loading ? "transparent" : T.border}`,
            cursor: input.trim() && !loading ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#060606" : T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
