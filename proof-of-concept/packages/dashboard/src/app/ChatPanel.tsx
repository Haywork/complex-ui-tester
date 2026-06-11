/**
 * LLM-native chat panel, docked on the right side of the dashboard.
 *
 * Passes user questions through the chat module (src/chat.ts) which calls the
 * Azure OpenAI Responses API with tool use over the live data layer.
 *
 * When AZURE_OPENAI_API_KEY is not configured the panel renders a clear
 * setup prompt rather than throwing.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { chat, CONFIGURE_KEY_MESSAGE } from '../chat.js';
import type { DashboardData } from '../data.js';
import type { ToolName } from '../chat.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolName[];
  ok?: boolean;
}

const SUGGESTIONS = [
  'What is the overall pass rate?',
  'Which specs are flaky?',
  'Show me the last 5 runs',
  'How many turns does it take on average to go green?',
];

function TypingDots(): ReactElement {
  return (
    <div className="chat-loading" aria-label="Assistant is thinking">
      <div className="chat-dot" />
      <div className="chat-dot" />
      <div className="chat-dot" />
    </div>
  );
}

let idCounter = 0;
function uid(): string {
  return `msg-${Date.now()}-${++idCounter}`;
}

export interface ChatPanelProps {
  data: DashboardData;
}

export function ChatPanel({ data }: ChatPanelProps): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content: 'Ask me anything about your test runs, specs, or loop health. I answer using live data tools.',
      ok: true,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const submit = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setBusy(true);

    try {
      const result = await chat(q, data);

      if (!result.ok && result.answer === CONFIGURE_KEY_MESSAGE) {
        setApiKeyMissing(true);
      }

      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: result.answer,
        toolCalls: result.toolCalls,
        ok: result.ok,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        ok: false,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setBusy(false);
    }
  }, [busy, data]);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    void submit(draft);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit(draft);
    }
  }

  return (
    <aside className="chat-panel" aria-label="LLM-native chat">
      {/* Header */}
      <div className="chat-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect width="16" height="16" rx="4" fill="var(--teal-bg)" />
          <path d="M4 8h8M8 4v8" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="chat-title">Ask CUIT</span>
        <span className="chat-model-pill">gpt-5.5</span>
      </div>

      {/* API key missing notice */}
      {apiKeyMissing && (
        <div className="chat-no-key" role="alert">
          <strong>Chat requires a key.</strong> Set{' '}
          <code style={{ fontSize: 11 }}>AZURE_OPENAI_API_KEY</code> in your
          environment to enable live answers. Data browsing still works above.
        </div>
      )}

      {/* Messages */}
      <div
        className="chat-messages"
        ref={scrollRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <article key={msg.id} className={`chat-message ${msg.role}`}>
            <span className={`chat-message-role ${msg.role}`}>
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </span>
            <div className="chat-message-body">{msg.content}</div>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="chat-tools-used" aria-label="Tools used">
                {msg.toolCalls.map((tool, i) => (
                  <span key={i} className="chat-tool-chip">{tool}</span>
                ))}
              </div>
            )}
          </article>
        ))}

        {busy && <TypingDots />}

        {/* Suggestions — shown only when no user message yet */}
        {messages.length === 1 && !busy && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s1)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 'var(--s1)' }}>
              Try a question:
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void submit(s)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r2)',
                  padding: 'var(--s2) var(--s3)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 120ms, color 120ms',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--teal-dim)';
                  el.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--border)';
                  el.style.color = 'var(--text-secondary)';
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input form */}
      <form className="chat-form" onSubmit={handleSubmit}>
        <label htmlFor="chat-input" className="sr-only">Ask a question about your data</label>
        <textarea
          id="chat-input"
          className="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your runs, specs…"
          rows={1}
          disabled={busy}
          aria-label="Chat input"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={busy || draft.trim().length === 0}
          aria-label="Send message"
        >
          {busy ? '…' : 'Send'}
        </button>
      </form>

      {/* SR-only utility */}
      <style>{`.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }`}</style>
    </aside>
  );
}
