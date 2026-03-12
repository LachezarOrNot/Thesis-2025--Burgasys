import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import type { Event } from '../types';
import { askAssistant, AssistantMessage } from '../services/aiAssistant';
import { useTranslation } from 'react-i18next';

const MAX_EVENTS_IN_CONTEXT = 12;

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Load a slice of upcoming events once the widget is opened
  useEffect(() => {
    if (!isOpen || eventsLoaded) return;

    let cancelled = false;

    const loadEvents = async () => {
      try {
        const all = await databaseService.getEvents({ status: 'published' });
        if (cancelled) return;

        const upcoming = all
          .filter((e) => {
            try {
              const start = new Date(e.start_datetime as any);
              return !isNaN(start.getTime()) && start.getTime() >= Date.now() - 24 * 60 * 60 * 1000;
            } catch {
              return true;
            }
          })
          .slice(0, MAX_EVENTS_IN_CONTEXT);

        setEvents(upcoming);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load events for AI assistant:', err);
      } finally {
        if (!cancelled) {
          setEventsLoaded(true);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [isOpen, eventsLoaded]);

  const eventsContext = useMemo(() => {
    if (!events || events.length === 0) return '';

    const lines = events.map((e) => {
      const date = (() => {
        try {
          const d = new Date(e.start_datetime as any);
          if (!isNaN(d.getTime())) {
            return d.toLocaleString('bg-BG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
          }
        } catch {
          // ignore
        }
        return 'unknown date';
      })();

      const tags = (e.tags || []).join(', ');
      return `- "${e.name}" on ${date} at ${e.location || 'unknown location'} (tags: ${
        tags || 'none'
      }) [id: ${e.id}]`;
    });

    return lines.join('\n');
  }, [events]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleQuickRecommend = async () => {
    await handleSend(t('aiAssistant.quickRecommendPrompt'));
  };

  const handleSend = async (overrideInput?: string) => {
    const trimmed = (overrideInput ?? input).trim();
    if (!trimmed || loading) return;

    const newUserMessage: AssistantMessage = {
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    if (!overrideInput) {
      setInput('');
    }

    setLoading(true);
    try {
      const reply = await askAssistant(trimmed, {
        eventsContext,
        history: [...messages, newUserMessage],
      });

      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        content: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Errors are already surfaced via toast in askAssistant
    } finally {
      setLoading(false);
    }
  };

  const title = user
    ? t('aiAssistant.greetingWithName', {
        name: user.displayName || user.email || 'there',
      })
    : t('aiAssistant.greetingGeneric');

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end space-y-3 pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto mb-3 transform origin-bottom-right animate-[fadeInUp_0.22s_ease-out]">
          <div className="w-80 sm:w-96 max-h-[70vh] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-100/80 dark:border-gray-800/80 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.38)] flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-primary-500 via-primary-500/90 to-primary-600 text-white flex items-center justify-between border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-sm font-semibold tracking-tight">
                    {t('aiAssistant.title')}
                  </h2>
                </div>
                <p className="text-[11px] text-white/80 mt-1 line-clamp-2">{title}</p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="p-1.5 rounded-full hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2.5 border-b border-gray-100/80 dark:border-gray-800/80 bg-gradient-to-r from-gray-50/90 via-white/90 to-gray-50/90 dark:from-gray-900/90 dark:via-gray-950/90 dark:to-gray-900/90 text-[11px] text-gray-600 dark:text-gray-300 flex items-center justify-between gap-3">
              <span className="leading-snug">
                {t('aiAssistant.helperText')}
              </span>
              <button
                type="button"
                onClick={handleQuickRecommend}
                disabled={loading}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                {t('aiAssistant.picksButton')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm bg-gradient-to-b from-white/95 via-white/98 to-gray-50/95 dark:from-gray-950/95 dark:via-gray-950/98 dark:to-gray-900/95">
              {messages.length === 0 && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-900/70 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 leading-relaxed">
                  {t('aiAssistant.emptyState')}
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    m.role === 'user'
                      ? 'ml-auto max-w-[85%] rounded-2xl bg-primary-500 text-white px-3 py-2.5 text-xs shadow-md shadow-primary-500/30'
                      : 'mr-auto max-w-[85%] rounded-2xl bg-gray-100/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-50 px-3 py-2.5 text-xs shadow-sm border border-gray-100/70 dark:border-gray-700/70'
                  }
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="mr-auto inline-flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400/80 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400/80 animate-bounce [animation-delay:0s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400/80 animate-bounce [animation-delay:0.1s]" />
                  </span>
                  {t('aiAssistant.thinking')}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="border-t border-gray-100/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-950/95 px-3 py-2.5 flex items-end gap-2.5"
            >
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('aiAssistant.inputPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="flex-1 resize-none text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 px-3 py-2 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent max-h-24"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-primary-500 hover:bg-primary-600 text-white p-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary-500/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 via-primary-500 to-primary-600 hover:from-primary-500 hover:via-primary-600 hover:to-primary-700 text-white shadow-[0_14px_30px_rgba(15,23,42,0.45)] w-12 h-12 focus:outline-none focus:ring-2 focus:ring-primary-400/80 focus:ring-offset-2 focus:ring-offset-transparent transition-transform hover:-translate-y-0.5 active:translate-y-0"
        aria-label={t('aiAssistant.openAssistant')}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

export default AIAssistant;

