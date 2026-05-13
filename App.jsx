import { useState, useRef, useEffect } from "react";

const ONBOARDING_STEPS = [
  {
    id: "name", emoji: "👋",
    question: "First, what's your name?",
    subtitle: "Let's make this personal.",
    type: "text", placeholder: "Just your first name is fine", field: "name",
  },
  {
    id: "kids", emoji: "👧🧒",
    question: "Tell me about your kids",
    subtitle: "Ages, names (optional), and anything I should know.",
    type: "text", multiline: true,
    placeholder: "e.g. Mia, 5 — loves dinosaurs. Jake, 8 — picky eater, soccer on Tuesdays",
    field: "kids",
  },
  {
    id: "household", emoji: "🏠",
    question: "What does your household look like?",
    subtitle: "Help me understand your home base.",
    type: "chips_plus_text",
    chips: [
      { label: "Partner / spouse", value: "partner" },
      { label: "Single mom", value: "single" },
      { label: "Co-parenting", value: "coparenting" },
      { label: "Extended family at home", value: "extended" },
    ],
    placeholder: "Anything else? (nanny, au pair, grandparents help out, etc.)",
    field: "household",
  },
  {
    id: "pets", emoji: "🐾",
    question: "Any pets in the mix?",
    subtitle: "They count as family too.",
    type: "chips_plus_text", optional: true,
    chips: [
      { label: "No pets", value: "none" },
      { label: "Dog 🐕", value: "dog" },
      { label: "Cat 🐈", value: "cat" },
      { label: "Other", value: "other" },
    ],
    placeholder: "Breed, name, any special needs?",
    field: "pets",
  },
  {
    id: "diet", emoji: "🍽",
    question: "Any dietary needs or preferences?",
    subtitle: "So meal plans actually work for your family.",
    type: "chips_plus_text", optional: true,
    chips: [
      { label: "No restrictions", value: "none" },
      { label: "Gluten-free", value: "gluten-free" },
      { label: "Dairy-free", value: "dairy-free" },
      { label: "Vegetarian", value: "vegetarian" },
      { label: "Vegan", value: "vegan" },
      { label: "Nut allergy", value: "nut-allergy" },
      { label: "Picky kids 😅", value: "picky" },
      { label: "Kosher / Halal", value: "kosher-halal" },
    ],
    placeholder: "Anything else about food at your house?",
    field: "diet",
  },
  {
    id: "work", emoji: "💼",
    question: "What's your work situation?",
    subtitle: "So I can give advice that fits your actual schedule.",
    type: "chips_plus_text",
    chips: [
      { label: "Full-time employed", value: "fulltime" },
      { label: "Part-time", value: "parttime" },
      { label: "Self-employed", value: "selfemployed" },
      { label: "Stay-at-home mom", value: "sahm" },
      { label: "Job searching", value: "searching" },
      { label: "Side hustle + main job", value: "sidehustle" },
    ],
    placeholder: "Your role or industry? (e.g. tech consultant, teacher, nurse, entrepreneur)",
    field: "work",
  },
  {
    id: "schedule", emoji: "⏰",
    question: "How does your typical week flow?",
    subtitle: "The more I know, the more useful I'll be.",
    type: "chips_plus_text", optional: true,
    chips: [
      { label: "School pickup daily", value: "pickup" },
      { label: "After-school activities", value: "activities" },
      { label: "Weekend sports / events", value: "weekend-sports" },
      { label: "Work from home", value: "wfh" },
      { label: "Frequent travel", value: "travel" },
      { label: "Mornings are chaos 😅", value: "mornings" },
    ],
    placeholder: "Anything else about your weekly rhythm?",
    field: "schedule",
  },
  {
    id: "goals", emoji: "✨",
    question: "What do you most want help with?",
    subtitle: "Pick everything that resonates.",
    type: "chips_plus_text",
    chips: [
      { label: "🧠 Mental load & planning", value: "planning" },
      { label: "🍽 Meal planning", value: "meals" },
      { label: "💼 Career growth", value: "career" },
      { label: "💰 Side income", value: "income" },
      { label: "🌿 More time for myself", value: "self" },
      { label: "✍️ Drafting & communication", value: "drafting" },
      { label: "🎉 Events & celebrations", value: "events" },
      { label: "💡 Parenting support", value: "parenting" },
    ],
    placeholder: "Anything else you'd love help with?",
    field: "goals",
  },
  {
    id: "vibe", emoji: "💬",
    question: "How do you want me to talk to you?",
    subtitle: "I'll match your energy.",
    type: "chips",
    chips: [
      { label: "Warm & supportive 🤗", value: "warm" },
      { label: "Direct & efficient ⚡", value: "direct" },
      { label: "Like a best friend 👯", value: "bestfriend" },
      { label: "Mix it up", value: "flexible" },
    ],
    field: "vibe",
  },
];

const SUGGESTIONS = [
  { icon: "🧠", label: "Brain dump my week", prompt: "I need to brain dump everything on my plate this week and get it organized." },
  { icon: "🗓", label: "Plan my week", prompt: "Help me plan out my week — schedule, meals, kids, everything." },
  { icon: "🍽", label: "Meal plan 5 days", prompt: "Give me a 5-day meal plan that works for my family." },
  { icon: "✍️", label: "Draft an email", prompt: "Help me draft a professional but warm email." },
  { icon: "🎉", label: "Plan a party", prompt: "Help me plan a birthday party — walk me through everything." },
  { icon: "💼", label: "Career help", prompt: "I want to talk through my career goals and what's next for me." },
  { icon: "💰", label: "Side income ideas", prompt: "Help me brainstorm realistic passive income I can build without leaving my job." },
  { icon: "🌿", label: "I'm overwhelmed", prompt: "I'm overwhelmed right now. Help me slow down and figure out what actually matters." },
];

function fmtProfileField(v) {
  if (!v) return null;
  if (typeof v === "object") {
    const chips = (v.chips || []).filter(c => c !== "none").join(", ");
    const text = (v.text || "").trim();
    return [chips, text].filter(Boolean).join(" · ") || null;
  }
  return String(v);
}

function buildSystemPrompt(profile) {
  const vibeMap = {
    warm: "Be warm, nurturing, and emotionally supportive. Acknowledge feelings before jumping to solutions.",
    direct: "Be direct and efficient. Skip pleasantries. Give her what she needs immediately.",
    bestfriend: "Talk like her brilliant best friend — casual, real, funny when appropriate, zero corporate speak.",
    flexible: "Read her energy from each message and match it — sometimes warmth, sometimes speed.",
  };
  const vibeVal = typeof profile.vibe === "object" ? profile.vibe.chips?.[0] : profile.vibe;
  const vibeInstruction = vibeMap[vibeVal] || "Be warm but direct.";

  const fields = {
    kids: fmtProfileField(profile.kids),
    household: fmtProfileField(profile.household),
    pets: fmtProfileField(profile.pets),
    diet: fmtProfileField(profile.diet),
    work: fmtProfileField(profile.work),
    schedule: fmtProfileField(profile.schedule),
    goals: fmtProfileField(profile.goals),
  };

  return `You are MomOS — a warm, intelligent AI agent built exclusively for ${profile.name || "this mom"}.

## HER PROFILE — reference this in every response:
- Name: ${profile.name || "Mom"}
- Kids: ${fields.kids || "not specified"}
- Household: ${fields.household || "not specified"}
- Pets: ${fields.pets || "none"}
- Diet / Food: ${fields.diet || "no restrictions"}
- Work: ${fields.work || "not specified"}
- Weekly schedule: ${fields.schedule || "not specified"}
- What she wants most help with: ${fields.goals || "general support"}

## COMMUNICATION STYLE:
${vibeInstruction}

## YOUR RULES — never break these:
1. Use her name occasionally — makes it feel personal
2. Never give generic advice — every response must account for HER specific situation
3. Meal plans must respect her dietary profile and her kids' preferences
4. Schedule suggestions must work around her actual weekly rhythm
5. Be concrete — action steps, lists, scripts, templates. Not vague suggestions.
6. Keep responses organized with clear emoji headers and sections
7. Make her feel like someone finally has her back

## YOUR CAPABILITIES:
🗓 PLANNING — schedules, meal plans, activity planning, school prep
🧠 MENTAL LOAD — brain dumps, prioritization, decision-making, lists
✍️ DRAFTING — school emails, texts, work emails, party invites, difficult conversations
💡 KIDS — activity ideas, homework help, age-appropriate explanations, discipline scripts
💼 CAREER — resumes, cover letters, career pivots, salary negotiation, side income
💰 FINANCES — budgeting, side income ideas, expense tracking
🌿 SELF — self-care planning, boundaries, personal goals, mental health
🎉 EVENTS — parties, holiday prep, travel with kids, gift ideas

When she talks to you:
1. Acknowledge briefly and warmly (1 sentence max — skip if she's being direct)
2. Jump straight into personalized, concrete help
3. Offer to go deeper on any area`;
}

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: "4px", marginBottom: "36px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: "3px", borderRadius: "99px",
          background: i <= step ? "linear-gradient(90deg,#d4548a,#9b59b6)" : "rgba(212,84,138,0.15)",
          transition: "background 0.4s",
        }} />
      ))}
    </div>
  );
}

// ── ONBOARDING STEP ──────────────────────────────────────────────────────────
function OnboardingStep({ step, value, onChange, onNext, onBack, stepIndex, totalSteps }) {
  const initChips = Array.isArray(value?.chips) ? value.chips : [];
  const initText = value?.text || (typeof value === "string" ? value : "");
  const [selected, setSelected] = useState(initChips);
  const [text, setText] = useState(initText);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  function toggleChip(val) {
    if (step.id === "vibe") {
      setSelected([val]);
      const result = { chips: [val], text: "" };
      onChange(result);
      setTimeout(() => onNext(result), 180);
      return;
    }
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function handleNext() {
    const result = step.type === "text" ? text : { chips: selected, text };
    onChange(result);
    onNext(result);
  }

  function canProceed() {
    if (step.optional) return true;
    if (step.type === "text") return text.trim().length > 0;
    if (step.type === "chips") return selected.length > 0;
    return selected.length > 0 || text.trim().length > 0;
  }

  return (
    <div style={{ animation: "slideIn 0.32s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{step.emoji}</div>
      <h2 style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
        {step.question}
      </h2>
      <p style={{ fontSize: "15px", color: "#9b8fa8", fontFamily: "sans-serif", marginBottom: "26px", lineHeight: 1.5 }}>
        {step.subtitle}
      </p>

      {step.chips && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: step.type === "chips_plus_text" ? "16px" : "28px" }}>
          {step.chips.map(chip => {
            const active = selected.includes(chip.value);
            return (
              <button key={chip.value} onClick={() => toggleChip(chip.value)} style={{
                padding: "8px 16px", borderRadius: "99px", fontSize: "13px",
                fontFamily: "sans-serif", fontWeight: 500, cursor: "pointer",
                border: active ? "2px solid #d4548a" : "1.5px solid rgba(212,84,138,0.22)",
                background: active ? "rgba(212,84,138,0.1)" : "rgba(255,255,255,0.85)",
                color: active ? "#c2347a" : "#6b5f7a",
                transform: active ? "scale(1.03)" : "scale(1)",
                transition: "all 0.14s",
                boxShadow: active ? "0 2px 8px rgba(212,84,138,0.18)" : "none",
              }}>{chip.label}</button>
            );
          })}
        </div>
      )}

      {(step.type === "text" || step.type === "chips_plus_text") && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={step.placeholder}
          rows={step.multiline ? 3 : 2}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && !step.multiline) {
              e.preventDefault();
              if (canProceed()) handleNext();
            }
          }}
          style={{
            width: "100%", border: "1.5px solid rgba(212,84,138,0.2)", borderRadius: "14px",
            padding: "13px 16px", fontSize: "14px", fontFamily: "Georgia,serif",
            color: "#2d2040", background: "rgba(255,255,255,0.95)",
            resize: "none", outline: "none", lineHeight: 1.6,
            boxSizing: "border-box", marginBottom: "22px",
            boxShadow: "0 2px 8px rgba(212,84,138,0.05)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(212,84,138,0.5)"; e.target.style.boxShadow = "0 4px 16px rgba(212,84,138,0.12)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(212,84,138,0.2)"; e.target.style.boxShadow = "0 2px 8px rgba(212,84,138,0.05)"; }}
        />
      )}

      {step.type !== "chips" && (
        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
          {!isFirst
            ? <button onClick={onBack} style={{ padding: "11px 20px", borderRadius: "12px", fontSize: "14px", fontFamily: "sans-serif", cursor: "pointer", border: "1.5px solid rgba(212,84,138,0.2)", background: "transparent", color: "#9b8fa8" }}>← Back</button>
            : <div />}
          <button onClick={handleNext} disabled={!canProceed()} style={{
            padding: "12px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
            fontFamily: "sans-serif", cursor: canProceed() ? "pointer" : "not-allowed", border: "none",
            background: canProceed() ? "linear-gradient(135deg,#d4548a,#9b59b6)" : "rgba(212,84,138,0.2)",
            color: canProceed() ? "#fff" : "rgba(212,84,138,0.4)",
            boxShadow: canProceed() ? "0 4px 14px rgba(212,84,138,0.3)" : "none",
            transition: "all 0.2s",
          }}>
            {isLast ? "Let's go ✨" : step.optional ? "Next →" : "Continue →"}
          </button>
        </div>
      )}

      {step.optional && step.type !== "chips" && (
        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <button onClick={() => { onChange(null); onNext(null); }} style={{ fontSize: "13px", color: "#c4b8cc", background: "none", border: "none", cursor: "pointer", fontFamily: "sans-serif" }}>
            Skip this one
          </button>
        </div>
      )}
    </div>
  );
}

// ── PROFILE SUMMARY ───────────────────────────────────────────────────────────
function ProfileSummary({ profile, onConfirm, onEdit }) {
  const rows = [
    { e: "👧", l: "Kids", v: fmtProfileField(profile.kids) },
    { e: "🏠", l: "Household", v: fmtProfileField(profile.household) },
    { e: "🐾", l: "Pets", v: fmtProfileField(profile.pets) },
    { e: "🍽", l: "Diet", v: fmtProfileField(profile.diet) },
    { e: "💼", l: "Work", v: fmtProfileField(profile.work) },
    { e: "⏰", l: "Schedule", v: fmtProfileField(profile.schedule) },
    { e: "✨", l: "Goals", v: fmtProfileField(profile.goals) },
    { e: "💬", l: "Vibe", v: fmtProfileField(profile.vibe) },
  ].filter(r => r.v && r.v !== "none");

  return (
    <div style={{ animation: "slideIn 0.32s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
      <h2 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px", letterSpacing: "-0.5px" }}>
        Your MomOS is ready, {profile.name || "mama"}
      </h2>
      <p style={{ fontSize: "15px", color: "#9b8fa8", fontFamily: "sans-serif", marginBottom: "22px", lineHeight: 1.5 }}>
        Everything I say from here is built around your real life. Here's what I know:
      </p>

      <div style={{ background: "rgba(255,255,255,0.88)", borderRadius: "16px", padding: "4px 16px", marginBottom: "22px", border: "1px solid rgba(212,84,138,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "11px 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(212,84,138,0.07)" : "none", alignItems: "flex-start" }}>
            <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{r.e}</span>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#c4b8cc", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1px" }}>{r.l}</div>
              <div style={{ fontSize: "13px", color: "#4a3f5c", fontFamily: "sans-serif", lineHeight: 1.5 }}>{r.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onEdit} style={{ flex: 1, padding: "12px", borderRadius: "12px", fontSize: "14px", fontFamily: "sans-serif", cursor: "pointer", border: "1.5px solid rgba(212,84,138,0.2)", background: "transparent", color: "#9b8fa8" }}>
          Edit
        </button>
        <button onClick={onConfirm} style={{ flex: 2, padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, fontFamily: "sans-serif", cursor: "pointer", border: "none", background: "linear-gradient(135deg,#d4548a,#9b59b6)", color: "#fff", boxShadow: "0 4px 14px rgba(212,84,138,0.32)" }}>
          This is me — let's start ✨
        </button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function MomOS() {
  const [phase, setPhase] = useState("onboarding");
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  function handleStepChange(value) {
    const field = ONBOARDING_STEPS[stepIndex].field;
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (stepIndex < ONBOARDING_STEPS.length - 1) setStepIndex(s => s + 1);
    else setPhase("summary");
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex(s => s - 1);
  }

  async function sendMessage(content) {
    if (!content.trim() || loading) return;
    setStarted(true);
    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(profile),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "Something went wrong. Try again.";
      let i = 0;
      const iv = setInterval(() => {
        i += 8;
        if (i >= text.length) {
          clearInterval(iv);
          setStreamingText("");
          setMessages(prev => [...prev, { role: "assistant", content: text }]);
          setLoading(false);
        } else setStreamingText(text.slice(0, i));
      }, 10);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
      setLoading(false);
    }
  }

  function fmt(text) {
    return text.split("\n").map((line, i) => {
      if (line.match(/^#+\s/)) return <div key={i} style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a2e", marginTop: "14px", marginBottom: "5px", fontFamily: "sans-serif" }}>{line.replace(/^#+\s/, "")}</div>;
      if (line.match(/^[-•]\s/)) return <div key={i} style={{ paddingLeft: "16px", position: "relative", marginBottom: "4px", lineHeight: "1.65" }}><span style={{ position: "absolute", left: 0, color: "#d4548a", fontWeight: 700 }}>›</span>{line.replace(/^[-•]\s/, "")}</div>;
      if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft: "22px", position: "relative", marginBottom: "4px", lineHeight: "1.65" }}><span style={{ position: "absolute", left: 0, color: "#d4548a", fontWeight: 700 }}>{line.match(/^\d+/)[0]}.</span>{line.replace(/^\d+\.\s/, "")}</div>;
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <div key={i} style={{ marginBottom: "3px", lineHeight: "1.65" }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#1a1a2e" }}>{p}</strong> : p)}</div>;
      }
      if (line === "") return <div key={i} style={{ height: "7px" }} />;
      return <div key={i} style={{ lineHeight: "1.65", marginBottom: "2px" }}>{line}</div>;
    });
  }

  const name = profile.name || "mama";

  const Blob = ({ top, left, right, bottom, size, color, opacity }) => (
    <div style={{ position: "fixed", top, left, right, bottom, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle,${color} 0%,transparent 70%)`, opacity, pointerEvents: "none", zIndex: 0 }} />
  );

  const Header = () => (
    <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(212,84,138,0.1)", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#d4548a,#9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 3px 10px rgba(212,84,138,0.3)" }}>✨</div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.4px" }}>MomOS</div>
          <div style={{ fontSize: "10px", color: "#c4b8cc", fontFamily: "sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {phase === "onboarding" ? `Step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}` : phase === "summary" ? "Almost ready" : `Hey ${name} 👋`}
          </div>
        </div>
      </div>
      {phase === "chat" && (
        <div style={{ display: "flex", gap: "7px" }}>
          <button onClick={() => { setPhase("onboarding"); setStepIndex(0); setMessages([]); setStarted(false); }} style={{ fontSize: "12px", color: "#9b8fa8", background: "none", border: "1px solid rgba(155,143,168,0.3)", borderRadius: "20px", padding: "4px 11px", cursor: "pointer", fontFamily: "sans-serif" }}>Edit profile</button>
          <button onClick={() => { setMessages([]); setStarted(false); }} style={{ fontSize: "12px", color: "#9b8fa8", background: "none", border: "1px solid rgba(155,143,168,0.3)", borderRadius: "20px", padding: "4px 11px", cursor: "pointer", fontFamily: "sans-serif" }}>New chat</button>
        </div>
      )}
    </div>
  );

  const MsgBubble = ({ role, children }) => (
    <div style={{ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start", marginBottom: "20px", animation: "fadeUp 0.3s ease" }}>
      {role === "assistant" && <div style={{ width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0, background: "linear-gradient(135deg,#d4548a,#9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", marginRight: "10px", marginTop: "2px", boxShadow: "0 3px 8px rgba(212,84,138,0.25)" }}>✨</div>}
      <div style={{ maxWidth: "85%", background: role === "user" ? "linear-gradient(135deg,#d4548a,#c2448a)" : "rgba(255,255,255,0.92)", color: role === "user" ? "#fff" : "#2d2040", borderRadius: role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", padding: "13px 17px", fontSize: "14px", lineHeight: "1.65", fontFamily: role === "user" ? "sans-serif" : "Georgia,serif", boxShadow: role === "user" ? "0 4px 14px rgba(212,84,138,0.3)" : "0 2px 12px rgba(0,0,0,0.06)", border: role === "assistant" ? "1px solid rgba(212,84,138,0.1)" : "none" }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#fdf4f8 0%,#f8f0ff 45%,#f0f4ff 100%)", fontFamily: "Georgia,'Times New Roman',serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <Blob top="-100px" right="-60px" size="380px" color="rgba(212,84,138,0.1)" opacity={1} />
      <Blob bottom="-80px" left="-40px" size="300px" color="rgba(120,80,200,0.07)" opacity={1} />

      <Header />

      {/* ── ONBOARDING ── */}
      {phase === "onboarding" && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 24px 60px", overflowY: "auto", position: "relative", zIndex: 1 }}>
          <div style={{ width: "100%", maxWidth: "500px" }}>
            <ProgressBar step={stepIndex} total={ONBOARDING_STEPS.length} />
            <OnboardingStep
              step={ONBOARDING_STEPS[stepIndex]}
              value={profile[ONBOARDING_STEPS[stepIndex].field]}
              onChange={handleStepChange}
              onNext={handleNext}
              onBack={handleBack}
              stepIndex={stepIndex}
              totalSteps={ONBOARDING_STEPS.length}
            />
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {phase === "summary" && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 24px 60px", overflowY: "auto", position: "relative", zIndex: 1 }}>
          <div style={{ width: "100%", maxWidth: "500px" }}>
            <ProfileSummary profile={profile} onConfirm={() => setPhase("chat")} onEdit={() => { setPhase("onboarding"); setStepIndex(0); }} />
          </div>
        </div>
      )}

      {/* ── CHAT ── */}
      {phase === "chat" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0 165px", position: "relative", zIndex: 1 }}>
            {!started && (
              <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 24px 24px" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <div style={{ fontSize: "13px", fontFamily: "sans-serif", color: "#d4548a", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Your profile is set ✨</div>
                  <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2, marginBottom: "12px", letterSpacing: "-0.8px" }}>Ready when you are, {name}.</h1>
                  <p style={{ fontSize: "15px", color: "#6b5f7a", lineHeight: 1.65, fontFamily: "sans-serif", maxWidth: "420px", margin: "0 auto" }}>
                    Everything I say is built around your real life — your kids, your schedule, your goals.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.prompt)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(212,84,138,0.15)", borderRadius: "14px", padding: "14px 16px", cursor: "pointer", textAlign: "left", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.18s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,84,138,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(212,84,138,0.12)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,84,138,0.15)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.icon}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e", fontFamily: "sans-serif" }}>{s.label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: "center", fontSize: "12px", color: "#c4b8cc", fontFamily: "sans-serif", fontStyle: "italic" }}>Powered by Claude · Personalized for {name}</div>
              </div>
            )}

            {started && (
              <div style={{ maxWidth: "680px", margin: "0 auto", padding: "28px 20px 0" }}>
                {messages.map((msg, i) => (
                  <MsgBubble key={i} role={msg.role}>
                    {msg.role === "assistant" ? fmt(msg.content) : msg.content}
                  </MsgBubble>
                ))}
                {streamingText && (
                  <MsgBubble role="assistant">
                    {fmt(streamingText)}
                    <span style={{ display: "inline-block", width: "2px", height: "13px", background: "#d4548a", marginLeft: "2px", verticalAlign: "middle", animation: "blink 1s infinite" }} />
                  </MsgBubble>
                )}
                {loading && !streamingText && (
                  <MsgBubble role="assistant">
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {[0,1,2].map(j => <div key={j} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#d4548a", opacity: 0.6, animation: `bounce 1.2s infinite ${j*0.2}s` }} />)}
                    </div>
                  </MsgBubble>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 18px", background: "rgba(253,244,248,0.9)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(212,84,138,0.1)", zIndex: 10 }}>
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              {started && (
                <div style={{ display: "flex", gap: "7px", marginBottom: "9px", overflowX: "auto", paddingBottom: "2px" }}>
                  {SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.prompt)} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(212,84,138,0.2)", borderRadius: "20px", padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap", fontSize: "12px", color: "#6b5f7a", fontFamily: "sans-serif", flexShrink: 0 }}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "9px", alignItems: "flex-end" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder={`What's on your plate, ${name}?`}
                  rows={1}
                  style={{ flex: 1, border: "1.5px solid rgba(212,84,138,0.2)", borderRadius: "16px", padding: "12px 17px", fontSize: "14px", fontFamily: "Georgia,serif", color: "#2d2040", background: "rgba(255,255,255,0.95)", resize: "none", outline: "none", lineHeight: "1.5", boxShadow: "0 2px 10px rgba(212,84,138,0.07)", maxHeight: "130px", overflowY: "auto", transition: "border-color 0.2s,box-shadow 0.2s" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(212,84,138,0.5)"; e.target.style.boxShadow = "0 4px 18px rgba(212,84,138,0.13)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(212,84,138,0.2)"; e.target.style.boxShadow = "0 2px 10px rgba(212,84,138,0.07)"; }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 130) + "px"; }}
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} style={{ width: "44px", height: "44px", borderRadius: "13px", border: "none", background: input.trim() && !loading ? "linear-gradient(135deg,#d4548a,#9b59b6)" : "rgba(212,84,138,0.18)", color: input.trim() && !loading ? "#fff" : "rgba(212,84,138,0.4)", fontSize: "19px", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0, boxShadow: input.trim() && !loading ? "0 4px 12px rgba(212,84,138,0.32)" : "none" }}>↑</button>
              </div>
              <div style={{ textAlign: "center", marginTop: "7px", fontSize: "11px", color: "#c4b8cc", fontFamily: "sans-serif" }}>Enter to send · Shift+Enter for new line</div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} 60%{transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(212,84,138,0.2);border-radius:4px}
        textarea::placeholder{color:#c4b8cc}
      `}</style>
    </div>
  );
}
