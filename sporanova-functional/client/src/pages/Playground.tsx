import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Bot, Send, RotateCcw, Sparkles, Zap, Clock, Coins, ChevronDown, Settings } from "lucide-react";
import { FormEvent, useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model?: string;
  latencyMs?: number;
  tokens?: number;
  traceId?: string;
}

export default function Playground() {
  const { workspaceId } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("You are SOPRANOVA, an enterprise AI assistant. Answer accurately and helpfully.");
  const [showSettings, setShowSettings] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models = trpc.playground.models.useQuery(undefined, { enabled: Boolean(workspaceId) });
  const routeModel = trpc.playground.routeModel.useQuery({ capabilities: ["chat"], language: "en" }, { enabled: false });
  const [chatParams, setChatParams] = useState<{ workspaceId: number; message: string; model?: string; temperature: number; systemPrompt: string } | null>(null);
  const chatQuery = trpc.playground.chat.useQuery(
    chatParams ?? { workspaceId: 0, message: "", temperature: 0.7, systemPrompt: "" },
    { enabled: Boolean(chatParams) }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatQuery.data) {
      const result = chatQuery.data;
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.response || "No response",
        model: result.model,
        latencyMs: result.latencyMs,
        tokens: result.tokens?.total,
        traceId: result.traceId,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(false);
      setChatParams(null);
    }
  }, [chatQuery.data]);

  useEffect(() => {
    if (chatQuery.error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not get response." }]);
      setIsStreaming(false);
      setChatParams(null);
    }
  }, [chatQuery.error]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !workspaceId) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    setChatParams({
      workspaceId,
      message: input,
      model: selectedModel || undefined,
      temperature,
      systemPrompt,
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sn-label mb-1">Agent Playground</p>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Test Your Agent</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMessages([])} className="inline-flex items-center gap-2 rounded-xl bg-[#FAFAF8] px-3 py-2 text-xs font-medium text-[#6B6660] ring-1 ring-[#E8E6E2] hover:bg-[#F4F3F0]">
            <RotateCcw size={14} />Clear
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-2 rounded-xl bg-[#FAFAF8] px-3 py-2 text-xs font-medium text-[#6B6660] ring-1 ring-[#E8E6E2] hover:bg-[#F4F3F0]">
            <Settings size={14} />Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="sn-label mb-2 block">Model</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full rounded-xl bg-[#F4F3F0] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]">
                <option value="">Auto (Route best model)</option>
                {models.data?.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
              </select>
            </div>
            <div>
              <label className="sn-label mb-2 block">Temperature: {temperature}</label>
              <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="sn-label mb-2 block">System Prompt</label>
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="h-20 w-full rounded-xl bg-[#F4F3F0] p-3 text-sm outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]" />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8]">
        <div className="h-[500px] overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <Sparkles className="mx-auto mb-3 text-[#6B7FBF]" size={32} />
                <p className="text-sm font-medium">Start a conversation</p>
                <p className="mt-1 max-w-xs text-xs text-[#8C887F]">Test your agent with different prompts and settings. Each response includes latency, token usage, and trace ID.</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#1A1F3C] text-xs font-semibold text-[#F8F6F2]">
                  <Bot size={14} />
                </span>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-[#1A1F3C] text-[#F8F6F2]" : "bg-[#F4F3F0] text-[#1A1F3C]"}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                {msg.role === "assistant" && msg.model && (
                  <div className="mt-2 flex flex-wrap gap-3 border-t border-[#E8E6E2] pt-2 text-[11px] text-[#8C887F]">
                    <span className="flex items-center gap-1"><Zap size={10} />{msg.model}</span>
                    {msg.latencyMs && <span className="flex items-center gap-1"><Clock size={10} />{msg.latencyMs}ms</span>}
                    {msg.tokens && <span className="flex items-center gap-1"><Coins size={10} />{msg.tokens} tokens</span>}
                    {msg.traceId && <span className="flex items-center gap-1 text-[#6B7FBF]">trace: {msg.traceId.slice(0, 16)}…</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#1A1F3C] text-xs font-semibold text-[#F8F6F2]"><Bot size={14} /></span>
              <div className="rounded-2xl bg-[#F4F3F0] px-4 py-3"><div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-[#8C887F]" style={{ animationDelay: "0ms" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-[#8C887F]" style={{ animationDelay: "150ms" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-[#8C887F]" style={{ animationDelay: "300ms" }} /></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-[#E8E6E2] p-4">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message to test your agent…" className="flex-1 rounded-xl bg-[#F4F3F0] px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]" disabled={isStreaming} />
            <button type="submit" disabled={!input.trim() || isStreaming} className="rounded-xl bg-[#1A1F3C] px-4 py-3 text-sm font-medium text-[#F8F6F2] hover:bg-[#252B4A] disabled:bg-[#D4D1CB]">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
