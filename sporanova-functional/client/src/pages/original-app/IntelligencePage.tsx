import { useState, useRef, useEffect } from "react";

type MsgType = "question" | "understanding" | "insight" | "recommendation" | "action";

interface Message {
  id: number;
  type: MsgType;
  content: string;
  sources?: string[];
}

const sampleConvos = [
  { label: "Q3 Revenue Analysis", active: true },
  { label: "Churn Risk Assessment", active: false },
  { label: "Supply Chain Forecast", active: false },
  { label: "Customer Segmentation", active: false },
];

const msgStyles: Record<MsgType, { bg: string; label: string; labelColor: string; border: string }> = {
  question:       { bg: "#1A1F3C",  label: "You",            labelColor: "#F8F6F2",            border: "none" },
  understanding:  { bg: "#F4F3F0",  label: "Understanding",  labelColor: "#8C887F",            border: "1px solid #E8E6E2" },
  insight:        { bg: "#F0EFF8",  label: "Insight",        labelColor: "#5B6FA8",            border: "1px solid #D8D6ED" },
  recommendation: { bg: "#EEF6F6",  label: "Recommendation", labelColor: "#4A8B8C",            border: "1px solid #C8E0E0" },
  action:         { bg: "#FDF4EE",  label: "Action",         labelColor: "#C5974A",            border: "1px solid #EDD8B8" },
};

const initialMessages: Message[] = [
  { id: 1, type: "question", content: "What's driving the revenue dip in Segment B this quarter?" },
  { id: 2, type: "understanding", content: "Analyzing Segment B performance across CRM, billing, and usage data for Q3 2026. Comparing against Q2 2026 baseline and same-period prior year.", sources: ["Salesforce CRM", "Stripe Billing", "Product Analytics"] },
  { id: 3, type: "insight", content: "Segment B revenue declined 14.2% ($1.2M) in Q3. The primary driver is a 28% drop in expansion revenue, concentrated in 5 accounts. These accounts show a 40% reduction in feature utilization starting 8 weeks ago — preceding the revenue impact by 6 weeks.", sources: ["Usage Analytics", "Expansion Revenue Report"] },
  { id: 4, type: "recommendation", content: "Initiate executive business reviews with the 5 at-risk accounts within 10 days. The utilization drop pattern matches pre-churn behavior observed in 3 similar accounts that churned in Q1. Prioritize the 2 largest accounts (combined ARR: $680K)." },
  { id: 5, type: "action", content: "Create account risk briefings for the 5 identified accounts, assign to their respective Account Executives, and schedule EBR meetings?" },
];

const responses: Record<string, Message[]> = {
  default: [
    { id: 0, type: "understanding", content: "Processing your query across connected enterprise data sources..." },
    { id: 0, type: "insight", content: "Based on current data patterns, I've identified relevant signals across your enterprise data. The analysis draws from 4 connected sources with 98.2% data freshness." },
  ],
};

let msgIdCounter = 10;

export default function IntelligencePage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || thinking) return;
    const q = input.trim();
    setInput("");
    const userMsg: Message = { id: ++msgIdCounter, type: "question", content: q };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);
    await new Promise((r) => setTimeout(r, 1200));
    const reply: Message = {
      id: ++msgIdCounter,
      type: "insight",
      content: `Based on your query "${q}", I've analyzed the relevant data across your enterprise. The analysis reveals several patterns worth investigating. Your connected data sources show consistent signals that align with this inquiry.`,
      sources: ["Enterprise Data", "Analytics Engine"],
    };
    setMessages((m) => [...m, reply]);
    setThinking(false);
  }

  return (
    <div className="sn-page-enter flex gap-4 h-[calc(100vh-112px)]">
      {/* Conversation list */}
      <div className="hidden md:flex flex-col w-56 shrink-0 rounded-2xl overflow-hidden" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
        <div className="p-4 border-b border-sn-100">
          <div className="sn-label mb-3">Conversations</div>
          <button className="w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2 transition-all"
            style={{ background: "#1A1F3C", color: "#F8F6F2" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sampleConvos.map((c, i) => (
            <button key={i} className="w-full text-left px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all"
              style={{ background: c.active ? "#F0EFF8" : "transparent", color: c.active ? "#5B6FA8" : "#8C887F", fontWeight: c.active ? 500 : 400 }}
              onMouseEnter={(e) => { if (!c.active) e.currentTarget.style.background = "#F4F3F0"; }}
              onMouseLeave={(e) => { if (!c.active) e.currentTarget.style.background = "transparent"; }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sn-100">
          <div>
            <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>Q3 Revenue Analysis</div>
            <div className="sn-label mt-0.5">Salesforce · Stripe · Analytics — 3 sources active</div>
          </div>
          <div className="flex gap-2">
            {["Export", "Share"].map((btn) => (
              <button key={btn} className="px-3 py-1.5 text-xs rounded-lg transition-all" style={{ background: "#F4F3F0", color: "#6B6660" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E8E6E2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F4F3F0"; }}>
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg) => {
            const style = msgStyles[msg.type];
            const isQuestion = msg.type === "question";
            return (
              <div key={msg.id} className={`flex ${isQuestion ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-2xl rounded-2xl px-5 py-4 transition-all duration-200"
                  style={{ background: style.bg, border: style.border }}
                  onMouseEnter={(e) => { if (!isQuestion) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
                >
                  {!isQuestion && (
                    <div className="sn-label mb-2" style={{ color: style.labelColor }}>{style.label}</div>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: isQuestion ? "#F8F6F2" : "#1A1F3C" }}>
                    {msg.content}
                  </p>
                  {msg.sources && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.sources.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(26,31,60,0.06)", color: "#6B6660" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.type === "action" && (
                    <div className="flex gap-2 mt-4">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "#1A1F3C", color: "#F8F6F2" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; }}>
                        Execute
                      </button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border" style={{ borderColor: "#E8E6E2", color: "#6B6660" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4D1CB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E6E2"; }}>
                        Modify
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-5 py-4" style={{ background: "#F4F3F0", border: "1px solid #E8E6E2" }}>
                <div className="sn-label mb-2">Thinking</div>
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#B8B4AC", animation: `sn-pulse-soft 1.2s ease-in-out ${i * 200}ms infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 pb-6">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SOPRANOVA anything about your enterprise..."
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: "#F4F3F0", border: "1.5px solid transparent", color: "#1A1F3C" }}
              onFocus={(e) => { e.currentTarget.style.border = "1.5px solid #6B7FBF"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,127,191,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.border = "1.5px solid transparent"; e.currentTarget.style.boxShadow = ""; }}
            />
            <button type="submit" disabled={thinking || !input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: input.trim() ? "#1A1F3C" : "#E8E6E2", color: input.trim() ? "#F8F6F2" : "#B8B4AC" }}
              onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.background = "#252B4A"; }}
              onMouseLeave={(e) => { if (input.trim()) e.currentTarget.style.background = "#1A1F3C"; }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
