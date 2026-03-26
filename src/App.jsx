import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants & Helpers ─────────────────────────────────────────
const STORAGE_KEY = "ideabook-ideas";
const TAGS_PALETTE = [
  "#E07A5F", "#3D405B", "#81B29A", "#F2CC8F", "#6D597A",
  "#B56576", "#355070", "#EAAC8B", "#56876D", "#E88D67",
];

const TAG_CATEGORIES = {
  "marketplace": ["marketplace", "platform", "two-sided", "supply", "demand", "aggregat"],
  "ai/ml": ["ai", "ml", "machine learning", "gpt", "llm", "neural", "model", "automat", "intellig"],
  "saas": ["saas", "subscription", "b2b", "enterprise", "dashboard", "analytics", "crm"],
  "mobile": ["mobile", "app", "ios", "android", "phone", "native"],
  "fintech": ["fintech", "payment", "banking", "wallet", "transaction", "money", "finance"],
  "health": ["health", "wellness", "fitness", "medical", "therapy", "mental health", "care"],
  "social": ["social", "community", "connect", "chat", "messaging", "network", "friend"],
  "creator": ["creator", "content", "video", "podcast", "newsletter", "audience", "media"],
  "productivity": ["productivity", "task", "workflow", "automate", "notion", "tool", "manage"],
  "ecommerce": ["ecommerce", "shop", "store", "product", "retail", "buy", "sell", "commerce"],
  "education": ["education", "learn", "course", "tutor", "skill", "teach", "student"],
  "real-estate": ["real estate", "property", "rent", "tenant", "listing", "home", "apartment"],
  "api": ["api", "integration", "webhook", "endpoint", "developer", "sdk"],
  "hardware": ["hardware", "device", "iot", "sensor", "wearable", "embedded"],
  "design": ["design", "ux", "ui", "interface", "prototype", "figma", "visual"],
  "music": ["music", "audio", "song", "audiobook", "playlist", "sound", "band", "concert", "artist"],
  "construction": ["construction", "architecture", "building", "contractor", "renovation", "materials", "builder"],
  "insurance": ["insurance", "policy", "premium", "coverage", "claim", "underwriting", "broker", "insurtech"],
};

function generateTags(text) {
  const lower = text.toLowerCase();
  const tags = [];
  for (const [tag, keywords] of Object.entries(TAG_CATEGORIES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tags.push(tag);
    }
  }
  if (tags.length === 0) tags.push("idea");
  return tags;
}

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAGS_PALETTE[Math.abs(hash) % TAGS_PALETTE.length];
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return "Today, " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function formatFullDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function groupByMonth(ideas) {
  const groups = {};
  ideas.forEach(idea => {
    const d = new Date(idea.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = { label, ideas: [] };
    groups[key].ideas.push(idea);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

// ─── Storage ─────────────────────────────────────────────────────
function loadIdeas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

// ─── Icons ───────────────────────────────────────────────────────
const PlusIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const BackIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const TagIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const ChatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const CalendarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const SparkleIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>;
const DownloadIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const UploadIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
// ─── Tag Chip ────────────────────────────────────────────────────
function TagChip({ tag, onRemove, onClick, active, small }) {
  const color = getTagColor(tag);
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 20,
        fontSize: small ? 11 : 12,
        fontFamily: "'DM Mono', monospace",
        background: active ? color : `${color}18`,
        color: active ? "#FFFCF5" : color,
        border: `1px solid ${active ? color : `${color}40`}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {tag}
      {onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ cursor: "pointer", marginLeft: 2, opacity: 0.7, lineHeight: 1 }}>&times;</span>
      )}
    </span>
  );
}

// ─── Idea Card ───────────────────────────────────────────────────
function IdeaCard({ idea, onClick }) {
  const preview = idea.content.length > 100 ? idea.content.slice(0, 100) + "..." : idea.content;
  return (
    <div onClick={onClick} style={{
      padding: "14px 18px", cursor: "pointer",
      borderBottom: "1px solid #E8E0D4",
      transition: "background 0.15s",
      background: "transparent",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "#F5EDE2"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: "#2C2416", lineHeight: 1.4, flex: 1 }}>{preview}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9A8E7C", whiteSpace: "nowrap", marginLeft: 12, marginTop: 2 }}>{formatDate(idea.createdAt)}</div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {idea.tags.map(t => <TagChip key={t} tag={t} small />)}
      </div>
    </div>
  );
}

// ─── Quick Capture ───────────────────────────────────────────────
// Like pulling out a Post-it. One field. Write, hit save, done.
function QuickCapture({ onSave, onBack }) {
  const [text, setText] = useState("");
  const ref = useRef(null);
  const tags = text.length > 15 ? generateTags(text) : [];

  useEffect(() => { setTimeout(() => ref.current?.focus(), 50); }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [text]);

  const save = () => {
    if (!text.trim()) return;
    const finalTags = tags.length > 0 ? tags : ["idea"];
    onSave({ content: text.trim(), tags: finalTags });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFCF5" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid #E8E0D4",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7E6A", display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          <BackIcon /> Cancel
        </button>
        <button onClick={save} style={{
          background: text.trim() ? "#2C2416" : "#D4C9B8", color: "#FFFCF5", border: "none", borderRadius: 10,
          padding: "7px 18px", cursor: text.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, fontWeight: 500, transition: "background 0.2s",
        }}>Save</button>
      </div>

      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column" }}>
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Jot it down..."
          style={{
            width: "100%", border: "none", outline: "none", background: "transparent",
            fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 19, color: "#2C2416",
            lineHeight: 1.65, resize: "none", padding: 0, minHeight: 80, overflow: "hidden",
          }}
        />
        {tags.length > 0 && (
          <div style={{
            display: "flex", gap: 5, flexWrap: "wrap", marginTop: 16, alignItems: "center",
            opacity: 0.7, transition: "opacity 0.3s",
          }}>
            <span style={{ color: "#9A8E7C", display: "flex" }}><SparkleIcon /></span>
            {tags.map(t => <TagChip key={t} tag={t} small />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Editor (for existing ideas) ──────────────────────────
function IdeaDetail({ idea, onSave, onBack, onDelete }) {
  const [content, setContent] = useState(idea.content);
  const [tags, setTags] = useState(idea.tags);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (content.length > 15) {
      const auto = generateTags(content);
      setTags(prev => {
        const manual = prev.filter(t => !Object.keys(TAG_CATEGORIES).includes(t) && t !== "idea");
        return [...new Set([...auto, ...manual])];
      });
    }
  }, [content]);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [content]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({ content: content.trim(), tags: tags.length > 0 ? tags : ["idea"] });
  };

  const addCustomTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag("");
    setShowTagInput(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFCF5" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid #E8E0D4",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7E6A", display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          <BackIcon /> Back
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDelete} style={{ background: "none", border: "1px solid #E07A5F40", borderRadius: 8, cursor: "pointer", color: "#E07A5F", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            <TrashIcon />
          </button>
          <button onClick={handleSave} style={{
            background: "#2C2416", color: "#FFFCF5", border: "none", borderRadius: 10,
            padding: "7px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 500,
          }}>Update</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "20px 18px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9A8E7C", marginBottom: 12, letterSpacing: "0.04em" }}>
          {formatFullDate(idea.createdAt)}
        </div>
        <textarea
          ref={ref}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            width: "100%", border: "none", outline: "none", background: "transparent",
            fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, color: "#2C2416",
            lineHeight: 1.7, resize: "none", padding: 0, minHeight: 120, overflow: "hidden",
          }}
        />
      </div>

      <div style={{ padding: "12px 18px", borderTop: "1px solid #E8E0D4", background: "#FAF5EC" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#9A8E7C", display: "flex", marginRight: 2 }}><SparkleIcon /></span>
          {tags.map(t => (
            <TagChip key={t} tag={t} onRemove={() => setTags(tags.filter(x => x !== t))} />
          ))}
          {showTagInput ? (
            <input
              autoFocus value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addCustomTag(); if (e.key === "Escape") setShowTagInput(false); }}
              onBlur={addCustomTag}
              placeholder="tag"
              style={{ border: "1px dashed #C4B9A8", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontFamily: "'DM Mono', monospace", background: "transparent", outline: "none", color: "#4A3F31", width: 70 }}
            />
          ) : (
            <span onClick={() => setShowTagInput(true)} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#9A8E7C", border: "1px dashed #C4B9A8", cursor: "pointer" }}>+</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Panel ───────────────────────────────────────────────
function AIChat({ ideas, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `I've read all ${ideas.length} of your ideas. Ask me anything — "what patterns do you see?", "which ideas are about social?", or "what should I build first?"` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    const ideasContext = ideas.map((idea, i) =>
      `Idea ${i + 1}: [tags: ${idea.tags.join(", ")}] — ${idea.content.slice(0, 300)}`
    ).join("\n\n");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are IdeaBook AI — a smart, encouraging product thinking partner. The user is a product designer and solo entrepreneur in the tech space. You have access to their entire idea notebook below. Be concise, insightful, and actionable. When analyzing ideas, look for patterns, synergies, and gaps. If asked what to build, consider market size, feasibility for a solo founder, and uniqueness.\n\nIDEA NOTEBOOK:\n${ideasContext}`,
          messages: [{ role: "user", content: userMsg }],
        })
      });
      const data = await response.json();
      const reply = data.content?.map(c => c.text || "").join("") || "Hmm, I couldn't process that. Try again?";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong connecting to AI. Check your connection and try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFCF5" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid #E8E0D4",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ChatIcon />
          <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, fontWeight: 600, color: "#2C2416" }}>Ask IdeaBook</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7E6A" }}><CloseIcon /></button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user" ? "#2C2416" : "#F0E9DD",
              color: msg.role === "user" ? "#FFFCF5" : "#2C2416",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
            <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#F0E9DD", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9A8E7C" }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #E8E0D4", background: "#FAF5EC", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask about your ideas..."
          style={{
            flex: 1, border: "1px solid #D4C9B8", borderRadius: 12, padding: "10px 14px",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#FFFCF5",
            outline: "none", color: "#2C2416",
          }}
        />
        <button onClick={handleSend} disabled={loading} style={{
          background: "#2C2416", border: "none", borderRadius: 12, padding: "10px 14px",
          cursor: "pointer", color: "#FFFCF5", opacity: loading ? 0.5 : 1,
          display: "flex", alignItems: "center",
        }}><SendIcon /></button>
      </div>
    </div>
  );
}

// ─── Timeline View ───────────────────────────────────────────────
function TimelineView({ ideas, onSelect, onBack }) {
  const grouped = groupByMonth(ideas);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid #E8E0D4" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7E6A", display: "flex" }}><BackIcon /></button>
        <CalendarIcon />
        <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, fontWeight: 600, color: "#2C2416" }}>Timeline</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9A8E7C", marginLeft: "auto" }}>{ideas.length} ideas</span>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {grouped.map(([key, group]) => (
          <div key={key}>
            <div style={{
              padding: "12px 18px 6px", fontFamily: "'DM Mono', monospace", fontSize: 12,
              color: "#9A8E7C", letterSpacing: "0.06em", textTransform: "uppercase",
              borderBottom: "1px solid #E8E0D440", background: "#FAF5EC",
              position: "sticky", top: 0, zIndex: 1,
            }}>
              {group.label} &middot; {group.ideas.length} idea{group.ideas.length !== 1 ? "s" : ""}
            </div>
            {group.ideas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onClick={() => onSelect(idea)} />
            ))}
          </div>
        ))}
        {ideas.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", fontFamily: "'DM Sans', sans-serif", color: "#9A8E7C" }}>No ideas yet. Start writing!</div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function IdeaBook() {
  const [ideas, setIdeas] = useState([]);
  const [view, setView] = useState("home"); // home | new | edit | chat | timeline | detail
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { setIdeas(loadIdeas()); }, []);
  useEffect(() => { saveIdeas(ideas); }, [ideas]);

  const exportBackup = (currentIdeas) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentIdeas, null, 2));
    const dt = new Date();
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ideabook-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedIdeas = JSON.parse(e.target.result);
        if (Array.isArray(importedIdeas)) {
          const existingIds = new Set(ideas.map(i => i.id));
          const newIdeas = importedIdeas.filter(i => !existingIds.has(i.id));
          setIdeas([...newIdeas, ...ideas].sort((a,b) => b.createdAt - a.createdAt));
          alert(`Successfully imported ${newIdeas.length} new ideas.`);
        }
      } catch (err) {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const allTags = [...new Set(ideas.flatMap(i => i.tags))].sort();

  const filteredIdeas = ideas.filter(idea => {
    const matchSearch = !search || idea.content.toLowerCase().includes(search.toLowerCase()) || idea.tags.some(t => t.includes(search.toLowerCase()));
    const matchTag = !activeTag || idea.tags.includes(activeTag);
    return matchSearch && matchTag;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const handleSaveNew = (data) => {
    const newIdea = { id: Date.now().toString(), ...data, createdAt: Date.now(), updatedAt: Date.now() };
    const newIdeas = [newIdea, ...ideas];
    setIdeas(newIdeas);
    setView("home");
    exportBackup(newIdeas); // Trigger automatic backup
  };

  const handleUpdate = (data) => {
    setIdeas(ideas.map(i => i.id === selectedIdea.id ? { ...i, ...data, updatedAt: Date.now() } : i));
    setView("home");
    setSelectedIdea(null);
  };

  const handleDelete = () => {
    setIdeas(ideas.filter(i => i.id !== selectedIdea.id));
    setView("home");
    setSelectedIdea(null);
  };

  const openIdea = (idea) => {
    setSelectedIdea(idea);
    setView("edit");
  };

  // ─── Render ──────────────────────────────────────
  if (view === "new") return <QuickCapture onSave={handleSaveNew} onBack={() => setView("home")} />;
  if (view === "edit" && selectedIdea) return <IdeaDetail idea={selectedIdea} onSave={handleUpdate} onBack={() => { setView("home"); setSelectedIdea(null); }} onDelete={handleDelete} />;
  if (view === "chat") return <AIChat ideas={ideas} onClose={() => setView("home")} />;
  if (view === "timeline") return <TimelineView ideas={ideas} onSelect={openIdea} onBack={() => setView("home")} />;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100%",
      background: "#FFFCF5", fontFamily: "'DM Sans', sans-serif",
      maxWidth: 480, margin: "0 auto",
      borderLeft: "1px solid #E8E0D4", borderRight: "1px solid #E8E0D4",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        input::placeholder, textarea::placeholder { color: #C4B9A8; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4C9B8; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 18px 0", background: "#FFFCF5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700,
              color: "#2C2416", letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>IdeaBook</h1>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9A8E7C", marginTop: 3, letterSpacing: "0.04em" }}>
              {ideas.length} idea{ideas.length !== 1 ? "s" : ""} captured
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="file" accept=".json" ref={fileInputRef} style={{ display: "none" }} onChange={importBackup} />
            <button onClick={() => fileInputRef.current?.click()} style={{
              background: "#F0E9DD", border: "none", borderRadius: 10,
              width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B5E4E",
            }} title="Import Backup"><UploadIcon /></button>
            <button onClick={() => exportBackup(ideas)} style={{
              background: "#F0E9DD", border: "none", borderRadius: 10,
              width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B5E4E",
            }} title="Export Backup"><DownloadIcon /></button>
            <button onClick={() => setShowSearch(!showSearch)} style={{
              background: showSearch ? "#2C2416" : "#F0E9DD", border: "none", borderRadius: 10,
              width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: showSearch ? "#FFFCF5" : "#6B5E4E", transition: "all 0.2s",
            }}><SearchIcon /></button>
            <button onClick={() => setView("timeline")} style={{
              background: "#F0E9DD", border: "none", borderRadius: 10,
              width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B5E4E",
            }}><CalendarIcon /></button>
            <button onClick={() => setView("chat")} style={{
              background: "#F0E9DD", border: "none", borderRadius: 10,
              width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B5E4E",
            }}><ChatIcon /></button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div style={{ marginBottom: 10, position: "relative" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas, tags, keywords..."
              style={{
                width: "100%", border: "1px solid #D4C9B8", borderRadius: 12, padding: "10px 14px 10px 38px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#FAF5EC",
                outline: "none", color: "#2C2416",
              }}
            />
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9A8E7C" }}><SearchIcon /></div>
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9A8E7C" }}><CloseIcon /></button>
            )}
          </div>
        )}

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div style={{
            display: "flex", gap: 5, overflowX: "auto", paddingBottom: 12,
            scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          }}>
            <TagChip tag="all" active={!activeTag} onClick={() => setActiveTag(null)} small />
            {allTags.map(t => (
              <TagChip key={t} tag={t} active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)} small />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "#E8E0D4" }} />

      {/* Ideas list */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onClick={() => openIdea(idea)} />
          ))
        ) : (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, color: "#2C2416", marginBottom: 6 }}>
              {search || activeTag ? "No matching ideas" : "Your notebook is empty"}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9A8E7C", lineHeight: 1.5 }}>
              {search || activeTag ? "Try different keywords or clear filters" : "Tap the + button to capture your first idea"}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setView("new")} style={{
        position: "fixed", bottom: 24, right: "50%", transform: "translateX(calc(50% + 160px))",
        width: 52, height: 52, borderRadius: 16, border: "none",
        background: "#2C2416", color: "#FFFCF5", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(44,36,22,0.3), 0 1px 4px rgba(44,36,22,0.2)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        zIndex: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateX(calc(50% + 160px)) scale(1.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateX(calc(50% + 160px))"; }}
      ><PlusIcon /></button>
    </div>
  );
}
