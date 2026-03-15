import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SessionLogEntry } from '../../domain/collaboration';
import { collaborationService } from '../../services/supabase/collaborationService';

interface SessionLogPanelProps {
  gameId: string;
  authorUserId: string;
  isGm: boolean;
}

const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export const SessionLogPanel = ({ gameId, authorUserId, isGm }: SessionLogPanelProps) => {
  const [entries, setEntries] = useState<SessionLogEntry[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial entries and subscribe to realtime updates
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const initial = await collaborationService.listSessionLogEntries(gameId, isGm);
        if (!cancelled) setEntries(initial);
      } catch {
        // Non-fatal — panel will populate via realtime
      }
    };

    void load();

    channelRef.current = collaborationService.subscribeToSessionLog(
      gameId,
      isGm,
      (entry) => {
        if (!cancelled) {
          setEntries((prev) => [...prev, entry]);
        }
      }
    );

    return () => {
      cancelled = true;
      if (channelRef.current) {
        collaborationService.unsubscribeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameId, isGm]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = noteInput.trim();
    if (!body) return;

    setSubmitting(true);
    setError(null);
    try {
      await collaborationService.addSessionLogEntry(gameId, authorUserId, 'gm-note', body, false);
      setNoteInput('');
    } catch {
      setError('Failed to post note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-card">
      <h2>Session Log</h2>
      <div
        className="session-log__entries"
        role="log"
        aria-live="polite"
        aria-label="Session log entries"
      >
        {entries.length === 0 ? (
          <p className="empty-state">No entries yet.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`session-log__entry session-log__entry--${entry.entryType}`}
            >
              <span className="session-log__time">{formatTime(entry.createdAt)}</span>
              <span className="session-log__body">{entry.body}</span>
              {entry.isGmOnly ? (
                <span className="status-pill status-pill--warn">GM only</span>
              ) : null}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {isGm ? (
        <form className="session-log__form" onSubmit={(e) => void handleSubmit(e)}>
          <input
            type="text"
            className="input"
            placeholder="Add a GM note…"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            disabled={submitting}
            aria-label="GM note input"
          />
          <button
            type="submit"
            className="button button--small"
            disabled={submitting || !noteInput.trim()}
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
};
