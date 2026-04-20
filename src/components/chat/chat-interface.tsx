"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, RotateCcw, Zap } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { DataCards } from "./data-cards";
import type { DataCard } from "@/app/api/chat/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: DataCard[];
  streaming?: boolean;
}

const QUICK_SUGGESTIONS = [
  { label: "Resumen de hoy",        prompt: "Dame un resumen del desempeño de producción de hoy" },
  { label: "OEE esta semana",       prompt: "¿Cuál ha sido el OEE de esta semana por prensa?" },
  { label: "Prensa con más scrap",  prompt: "¿Qué prensa tiene el mayor scrap rate esta semana?" },
  { label: "Paros frecuentes",      prompt: "¿Cuáles son las causas de paro más frecuentes este mes?" },
  { label: "Comparar turnos",       prompt: "Compara el desempeño por turno en los últimos 7 días" },
  { label: "Mejor prensa",          prompt: "¿Cuál es la prensa con mejor OEE este mes?" },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex items-end gap-2.5 justify-end">
        <div className="max-w-[75%] bg-brand-yellow text-brand-black rounded-2xl rounded-br-sm px-4 py-2.5">
          <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mb-0.5">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Bot className="w-4 h-4 text-brand-yellow" />
      </div>
      <div className="max-w-[85%] flex flex-col gap-1">
        {/* Data cards */}
        {msg.cards && msg.cards.length > 0 && (
          <DataCards cards={msg.cards} />
        )}

        {/* Text content */}
        <div className="bg-white border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {msg.streaming && msg.content === "" ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-sm">Analizando datos…</span>
            </div>
          ) : (
            <MarkdownRenderer content={msg.content} streaming={msg.streaming} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatInterface() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [isStreaming, setIsStreaming]= useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textareaRef = useRef<HTMLTextAreaElement>(null) as React.RefObject<HTMLTextAreaElement>;
  const abortRef                    = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { id: uid(), role: "user", content: text.trim() };

    const assistantId = uid();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      cards: [],
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Error en la respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, streaming: false } : m
              )
            );
            continue;
          }

          try {
            const event = JSON.parse(raw);
            if (event.type === "cards") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, cards: event.cards } : m
                )
              );
            } else if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Ocurrió un error al procesar tu pregunta. Intenta de nuevo.",
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  };

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Welcome */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-black flex items-center justify-center shadow-lg">
              <Bot className="w-8 h-8 text-brand-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Asistente de Producción</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Pregúntame sobre OEE, scrap, paros o cualquier métrica de producción. Tengo acceso a todos los datos del MES.
              </p>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="w-full max-w-2xl">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">
              Sugerencias rápidas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl border border-surface-border text-left hover:border-brand-yellow hover:bg-brand-yellow-5 transition-colors group"
                >
                  <Zap className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-surface-border bg-white p-4">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            isStreaming={isStreaming}
            textareaRef={textareaRef}
          />
        </div>
      </div>
    );
  }

  // ─── Chat view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      <div className="border-t border-surface-border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">{messages.length} mensajes en esta sesión</p>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Nueva conversación
          </button>
        </div>
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          isStreaming={isStreaming}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
}

// ─── Input component ──────────────────────────────────────────────────────────

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isStreaming: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

function ChatInput({ input, setInput, onSubmit, onKeyDown, isStreaming, textareaRef }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Pregunta sobre producción, OEE, paros… (Enter para enviar)"
          disabled={isStreaming}
          className="w-full resize-none rounded-xl border border-surface-border bg-surface-input px-4 py-3 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 focus:border-brand-yellow disabled:opacity-60 transition-colors"
          style={{ maxHeight: 160 }}
        />
      </div>
      <button
        type="submit"
        disabled={!input.trim() || isStreaming}
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-yellow hover:bg-brand-yellow-h disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
        aria-label="Enviar"
      >
        {isStreaming
          ? <Loader2 className="w-4 h-4 text-brand-black animate-spin" />
          : <Send className="w-4 h-4 text-brand-black" />
        }
      </button>
    </form>
  );
}
