// ⚠️ DEPRECATED: This component is being replaced by AssistantChatWidget with variant="embedded"
// Will be removed in a future update
'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[]; // Reference memory sources
  timestamp: string; // ISO date string
  isStreaming?: boolean;
}

interface Props {
  reportId?: string;
  reportType?: string;
  reportTitle?: string;
}

const CHAT_TEXT: Record<Locale, {
  ariaLabel: string;
  headerTitle: string;
  headerSubtitle: string;
  headerReading: string;
  greeting: string;
  inputPlaceholder: string;
  sendButton: string;
  errorConnection: string;
  errorNoResponse: string;
  errorGeneric: string;
  quickActions: { label: string; icon: string; prompt: string }[];
  referenceMemory: string;
  sources: string;
}> = {
  ar: {
    ariaLabel: 'مساعد AI',
    headerTitle: 'مساعد رؤى الذكي',
    headerSubtitle: 'اسأل عن الأسواق والتقارير',
    headerReading: 'يقرأ:',
    greeting: 'كيف يمكنني مساعدتك؟',
    inputPlaceholder: 'اكتب سؤالك...',
    sendButton: 'إرسال',
    errorConnection: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.',
    errorNoResponse: 'عذراً، لم أتمكن من الرد',
    errorGeneric: 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.',
    quickActions: [
      { label: 'لخص التقرير', icon: '📋', prompt: 'لخص هذا التقرير في نقاط رئيسية' },
      { label: 'ما التوصيات؟', icon: '💡', prompt: 'ما هي أهم التوصيات في هذا التقرير؟' },
      { label: 'اشرح المؤشرات', icon: '📊', prompt: 'اشرح المؤشرات الرئيسية المذكورة في التقرير' },
      { label: 'تحليل المخاطر', icon: '⚠️', prompt: 'ما هي أبرز المخاطر المذكورة في التقرير؟' },
      { label: 'قارن الأرباح', icon: '💰', prompt: 'قارن أرباح هذا الربع بالربع السابق' },
      { label: 'السيناريو المتشائم', icon: '📉', prompt: 'اشرح السيناريو المتشائم وما المخاطر المحتملة' },
    ],
    referenceMemory: 'الذاكرة المرجعية',
    sources: 'المصادر',
  },
  en: {
    ariaLabel: 'AI Assistant',
    headerTitle: "Rouaa AI Assistant",
    headerSubtitle: 'Ask about markets & reports',
    headerReading: 'Reading:',
    greeting: 'How can I help you?',
    inputPlaceholder: 'Type your question...',
    sendButton: 'Send',
    errorConnection: 'Sorry, a connection error occurred. Please try again.',
    errorNoResponse: 'Sorry, I could not generate a response.',
    errorGeneric: 'Sorry, I could not process your request. Please try again.',
    quickActions: [
      { label: 'Summarize', icon: '📋', prompt: 'Summarize this report in key points' },
      { label: 'Recommendations?', icon: '💡', prompt: 'What are the key recommendations in this report?' },
      { label: 'Explain indicators', icon: '📊', prompt: 'Explain the key indicators mentioned in the report' },
      { label: 'Risk analysis', icon: '⚠️', prompt: 'What are the main risks mentioned in the report?' },
      { label: 'Compare earnings', icon: '💰', prompt: 'Compare this quarter earnings vs last quarter' },
      { label: 'Pessimistic scenario', icon: '📉', prompt: 'Explain the pessimistic scenario and potential risks' },
    ],
    referenceMemory: 'Reference Memory',
    sources: 'Sources',
  },
  fr: {
    ariaLabel: 'Assistant IA',
    headerTitle: "Assistant IA Rouaa",
    headerSubtitle: "Posez des questions sur les marchés et les rapports",
    headerReading: 'Lecture :',
    greeting: 'Comment puis-je vous aider ?',
    inputPlaceholder: 'Tapez votre question...',
    sendButton: 'Envoyer',
    errorConnection: "Désolé, une erreur de connexion s'est produite. Veuillez réessayer.",
    errorNoResponse: "Désolé, je n'ai pas pu générer de réponse.",
    errorGeneric: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
    quickActions: [
      { label: 'Résumer', icon: '📋', prompt: 'Résume ce rapport en points clés' },
      { label: 'Recommandations ?', icon: '💡', prompt: 'Quelles sont les principales recommandations de ce rapport ?' },
      { label: 'Expliquer les indicateurs', icon: '📊', prompt: 'Explique les indicateurs clés mentionnés dans le rapport' },
      { label: 'Analyse des risques', icon: '⚠️', prompt: 'Quels sont les principaux risques mentionnés dans le rapport ?' },
    ],
    referenceMemory: 'Mémoire de référence',
    sources: 'Sources',
  },
  tr: {
    ariaLabel: 'AI Asistan',
    headerTitle: "Rouaa AI Asistan",
    headerSubtitle: 'Piyasalar ve raporlar hakkında sorular sorun',
    headerReading: 'Okunuyor:',
    greeting: 'Size nasıl yardımcı olabilirim?',
    inputPlaceholder: 'Sorunuzu yazın...',
    sendButton: 'Gönder',
    errorConnection: 'Üzgünüz, bir bağlantı hatası oluştu. Lütfen tekrar deneyin.',
    errorNoResponse: 'Üzgünüz, bir yanıt oluşturamadım.',
    errorGeneric: 'Üzgünüm, talebinizi işleyemedim. Lütfen tekrar deneyin.',
    quickActions: [
      { label: 'Özetle', icon: '📋', prompt: 'Bu raporu ana hatlarıyla özetle' },
      { label: 'Tavsiyeler?', icon: '💡', prompt: 'Bu rapordaki ana tavsiyeler nelerdir?' },
      { label: 'Göstergeleri açıkla', icon: '📊', prompt: 'Raporda belirtilen ana göstergeleri açıkla' },
      { label: 'Risk analizi', icon: '⚠️', prompt: 'Raporda belirtilen ana riskler nelerdir?' },
    ],
    referenceMemory: 'Referans Belleği',
    sources: 'Kaynaklar',
  },
  es: {
    ariaLabel: 'Asistente IA',
    headerTitle: "Asistente IA de Rouaa",
    headerSubtitle: 'Pregunta sobre mercados e informes',
    headerReading: 'Leyendo:',
    greeting: '¿Cómo puedo ayudarte?',
    inputPlaceholder: 'Escribe tu pregunta...',
    sendButton: 'Enviar',
    errorConnection: 'Lo siento, ocurrió un error de conexión. Por favor, inténtalo de nuevo.',
    errorNoResponse: 'Lo siento, no pude generar una respuesta.',
    errorGeneric: 'Lo siento, no pude procesar tu solicitud. Por favor, inténtalo de nuevo.',
    quickActions: [
      { label: 'Resumir', icon: '📋', prompt: 'Resume este informe en puntos clave' },
      { label: '¿Recomendaciones?', icon: '💡', prompt: '¿Cuáles son las principales recomendaciones de este informe?' },
      { label: 'Explicar indicadores', icon: '📊', prompt: 'Explica los indicadores clave mencionados en el informe' },
      { label: 'Análisis de riesgos', icon: '⚠️', prompt: '¿Cuáles son los principales riesgos mencionados en el informe?' },
    ],
    referenceMemory: 'Memoria de referencia',
    sources: 'Fuentes',
  },
};

function detectLocale(pathname: string): Locale {
  if (pathname.startsWith('/en')) return 'en';
  if (pathname.startsWith('/fr')) return 'fr';
  if (pathname.startsWith('/tr')) return 'tr';
  if (pathname.startsWith('/es')) return 'es';
  return 'ar';
}

// Maximum conversation history to send (keeps last N messages for context)
const MAX_HISTORY = 10;

export default function AIChatWidget({ reportId, reportType, reportTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const locale = detectLocale(pathname);
  const text = CHAT_TEXT[locale];
  const isRtl = locale === 'ar';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userTimestamp = new Date().toISOString();
    const userMsg: Message = { role: 'user', content: promptText.trim(), timestamp: userTimestamp };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStatusMessage(isRtl ? 'يفكر...' : 'Thinking...');

    // Add streaming placeholder
    const streamingMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, streamingMsg]);

    try {
      // FIX: Send conversation history for multi-turn memory
      // Send the last MAX_HISTORY messages so AI remembers the conversation
      const history = messages.slice(-MAX_HISTORY).map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Try streaming endpoint first
      const res = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText.trim(),
          reportId,
          reportType,
          locale,
          history,
        }),
      });

      if (!res.ok) throw new Error('Stream failed, trying fallback');

      // Parse SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantSources: string[] | undefined;
      let assistantTimestamp = new Date().toISOString();
      let msgIndex = -1;
      setMessages(prev => {
        const next = [...prev];
        msgIndex = next.length - 1;
        return next;
      });

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message && !data.content) {
                setStatusMessage(data.message);
                setMessages(prev => {
                  const next = [...prev];
                  if (msgIndex >= 0 && msgIndex < next.length && next[msgIndex].isStreaming) {
                    next[msgIndex] = { ...next[msgIndex], content: '' };
                  }
                  return next;
                });
              } else if (data.content !== undefined) {
                assistantContent += data.content;
                setMessages(prev => {
                  const next = [...prev];
                  if (msgIndex >= 0 && msgIndex < next.length) {
                    next[msgIndex] = { ...next[msgIndex], content: assistantContent, isStreaming: true };
                  }
                  return next;
                });
              } else if (data.timestamp || data.isHtml !== undefined) {
                assistantSources = data.sources;
                if (data.timestamp) assistantTimestamp = data.timestamp;
                setMessages(prev => {
                  const next = [...prev];
                  if (msgIndex >= 0 && msgIndex < next.length) {
                    next[msgIndex] = {
                      ...next[msgIndex],
                      content: assistantContent,
                      sources: assistantSources,
                      timestamp: assistantTimestamp,
                      isStreaming: false,
                    };
                  }
                  return next;
                });
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      // Fallback to non-streaming
      try {
        const history = messages.slice(-MAX_HISTORY).map(m => ({
          role: m.role,
          content: m.content,
        }));
        const fallbackRes = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: promptText.trim(),
            reportId,
            reportType,
            context: reportTitle,
            locale,
            history,
          }),
        });
        if (!fallbackRes.ok) throw new Error('Connection failed');
        const data = await fallbackRes.json();
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.isStreaming) {
            next[next.length - 1] = {
              role: 'assistant',
              content: data.response || text.errorNoResponse,
              sources: data.sources || undefined,
              timestamp: new Date().toISOString(),
              isStreaming: false,
            };
          }
          return next;
        });
      } catch {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.isStreaming) {
            next[next.length - 1] = {
              role: 'assistant',
              content: text.errorConnection,
              timestamp: new Date().toISOString(),
              isStreaming: false,
            };
          }
          return next;
        });
      }
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .status-pulse {
          animation: statusPulse 1.5s ease-in-out infinite;
        }
        .streaming-cursor-legacy::after {
          content: '▊';
          animation: cursorBlinkLegacy 0.8s ease-in-out infinite;
          color: #60A5FA;
          font-size: 12px;
          margin-left: 2px;
        }
        @keyframes cursorBlinkLegacy {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[1000] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isRtl ? 'left-6' : 'right-6'}`}
        style={{ background: 'var(--gold)', color: '#0A0F1C', bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label={text.ariaLabel}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-[1000] w-[360px] max-h-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${isRtl ? 'left-6' : 'right-6'}`}
          style={{ background: '#111827', borderColor: '#1F2937', bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: '#1F2937' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--gold)', color: '#0A0F1C' }}>
              🤖
            </div>
            <div>
              <p className="text-sm font-bold text-white">{text.headerTitle}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {reportTitle ? `${text.headerReading} ${reportTitle.slice(0, 30)}...` : text.headerSubtitle}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '340px' }}>
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>{text.greeting}</p>
                <div className="grid grid-cols-2 gap-2">
                  {text.quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/10"
                      style={{ background: '#1F2937', color: '#D1D5DB' }}
                    >
                      <span className="ml-1">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[88%]`}>
                  {/* Assistant icon */}
                  {msg.role === 'assistant' && (
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-lg"
                      style={{
                        width: 24,
                        height: 24,
                        background: 'linear-gradient(135deg, rgba(30,64,175,0.4), rgba(59,130,246,0.2))',
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 100 100" fill="none">
                        <path d="M50 8 C42 6, 28 10, 20 20 C12 30, 10 42, 12 52 C14 62, 18 70, 24 76 C30 82, 36 86, 42 88 C46 89, 49 90, 50 90" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                        <path d="M50 8 C58 6, 72 10, 80 20 C88 30, 90 42, 88 52 C86 62, 82 70, 76 76 C70 82, 64 86, 58 88 C54 89, 51 90, 50 90" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                        <circle cx="50" cy="40" r="4" fill="#93C5FD" opacity="0.9">
                          {msg.isStreaming && <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />}
                          {msg.isStreaming && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />}
                        </circle>
                      </svg>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 text-sm leading-relaxed ${msg.isStreaming && msg.content ? 'streaming-cursor-legacy' : ''}`}
                    style={{
                      background: msg.role === 'user' ? 'var(--gold)' : '#1F2937',
                      color: msg.role === 'user' ? '#0A0F1C' : '#E5E7EB',
                      borderRadius: msg.role === 'user'
                        ? (isRtl ? '16px 4px 16px 16px' : '4px 16px 16px 16px')
                        : (isRtl ? '4px 16px 16px 16px' : '16px 4px 16px 16px'),
                      minWidth: msg.isStreaming && !msg.content ? '120px' : undefined,
                    }}
                  >
                    {msg.isStreaming && !msg.content ? (
                      <span className="status-pulse text-xs" style={{ color: '#93C5FD' }}>
                        {statusMessage || (isRtl ? 'يفكر...' : 'Thinking...')}
                      </span>
                    ) : msg.content}
                  </div>
                </div>
                {/* Timestamp */}
                {msg.timestamp && !msg.isStreaming && (
                  <span
                    className={`mt-0.5 text-[9px] px-1 ${msg.role === 'user' ? '' : isRtl ? 'mr-8' : 'ml-8'}`}
                    style={{ color: '#475569', direction: isRtl ? 'rtl' : 'ltr' }}
                  >
                    {(() => {
                      try {
                        const date = new Date(msg.timestamp);
                        return date.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: isRtl });
                      } catch { return ''; }
                    })()}
                  </span>
                )}
                {/* Reference Memory Sources — show linked articles below assistant messages */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
                  <div className={`mt-1 max-w-[80%] px-2 py-1 rounded-lg ${isRtl ? 'mr-8' : 'ml-8'}`} style={{ background: 'rgba(0,201,167,0.08)' }}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13,2 13,9 20,9" />
                      </svg>
                      <span className="text-[9px] font-medium" style={{ color: 'var(--cyan)' }}>{text.referenceMemory}</span>
                    </div>
                    {msg.sources.map((source, si) => (
                      <div key={si} className="text-[9px] leading-relaxed" style={{ color: '#9CA3AF' }}>
                        📄 {source}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Loading indicator replaced with brain icon + status */}
            {isLoading && !messages.some(m => m.isStreaming) && (
              <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-lg"
                  style={{
                    width: 24,
                    height: 24,
                    background: 'linear-gradient(135deg, rgba(30,64,175,0.5), rgba(59,130,246,0.3))',
                    border: '1px solid rgba(59,130,246,0.3)',
                    boxShadow: '0 0 10px rgba(59,130,246,0.2)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 100 100" fill="none">
                    <path d="M50 8 C42 6, 28 10, 20 20 C12 30, 10 42, 12 52 C14 62, 18 70, 24 76 C30 82, 36 86, 42 88 C46 89, 49 90, 50 90" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                    <path d="M50 8 C58 6, 72 10, 80 20 C88 30, 90 42, 88 52 C86 62, 82 70, 76 76 C70 82, 64 86, 58 88 C54 89, 51 90, 50 90" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                    <circle cx="50" cy="40" r="4" fill="#93C5FD" opacity="0.9">
                      <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
                <div
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ background: '#1F2937', color: '#93C5FD', borderRadius: isRtl ? '4px 16px 16px 16px' : '16px 4px 16px 16px' }}
                >
                  <span className="status-pulse text-xs font-medium">
                    {statusMessage || (isRtl ? 'يفكر...' : 'Thinking...')}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2" style={{ borderColor: '#1F2937' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={text.inputPlaceholder}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1F2937', color: '#E5E7EB', border: '1px solid #374151' }}
              disabled={isLoading}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: 'var(--gold)', color: '#0A0F1C' }}
            >
              {text.sendButton}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
