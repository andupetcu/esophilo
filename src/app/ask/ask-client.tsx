"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2 } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What is the nature of reality?",
  "How do I find inner peace?",
  "What did Plato think about justice?",
  "Explain the Hermetic principle 'as above, so below'",
  "What is enlightenment in Buddhist philosophy?",
];

function formatContent(content: string) {
  // Parse citations in [Author, "Title", Chapter] format into styled spans
  const parts = content.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (/^\[.+\]$/.test(part)) {
      return (
        <span
          key={i}
          className="inline-block text-primary font-medium text-sm bg-primary/5 border border-primary/20 rounded px-1.5 py-0.5 mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  async function handleSubmit(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: updatedMessages,
        }),
      });

      if (response.status === 429) {
        setRateLimited(true);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || data.error || "No response received.",
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content:
          "I encountered an issue connecting to the wisdom library. Please try again.",
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-36">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-semibold text-gold-gradient mb-2">
                Ask the Sages
              </h1>
              <p className="text-muted-foreground max-w-md">
                Explore humanity&apos;s ancient wisdom traditions. Ask about
                Hermetic philosophy, Buddhist teachings, Stoic principles, and
                120+ sacred texts.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSubmit(question)}
                  className="text-sm text-left px-4 py-2.5 rounded-lg border border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/40 transition-colors text-foreground/80"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary/10 border border-primary/20 rounded-lg p-4"
                      : "bg-card border rounded-lg p-4"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-full bg-primary/10">
                        <Sparkles className="size-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-primary">
                        The Sages
                      </span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.role === "assistant"
                      ? formatContent(message.content)
                      : message.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-full bg-primary/10">
                      <Sparkles className="size-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-primary">
                      The Sages
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Consulting the library</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              </div>
            )}

            {rateLimited && (
              <div className="flex justify-center">
                <div className="bg-card border border-primary/30 rounded-lg p-4 text-center max-w-md">
                  <p className="text-sm text-foreground/80 mb-2">
                    You&apos;ve used your 3 free questions today. Sign up for
                    Pro for unlimited access.
                  </p>
                  <Link href="/pricing">
                    <Button variant="default" size="sm">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the sages a question..."
              disabled={loading || rateLimited}
              rows={1}
              className="flex-1 resize-none rounded-lg border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading || rateLimited}
              size="icon"
              className="shrink-0 h-[46px] w-[46px]"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI responses draw from the EsoPhilo library but may not always be
            perfectly accurate. Verify important claims against source texts.
          </p>
        </div>
      </div>
    </div>
  );
}
