"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ContactMessage } from "@/types";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function load() {
    api
      .get<ContactMessage[]>("/admin/messages")
      .then(setMessages)
      .catch((err) => setError((err as Error).message));
  }

  useEffect(load, []);

  async function setRead(message: ContactMessage, isRead: boolean) {
    setPendingId(message.id);
    try {
      await api.patch(`/admin/messages/${message.id}`, { isRead });
      setMessages((prev) =>
        prev ? prev.map((m) => (m.id === message.id ? { ...m, isRead } : m)) : prev,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  async function handleToggleExpand(message: ContactMessage) {
    const opening = expandedId !== message.id;
    setExpandedId(opening ? message.id : null);
    if (opening && !message.isRead) {
      await setRead(message, true);
    }
  }

  async function handleDelete(message: ContactMessage) {
    if (!window.confirm(`Delete the message from "${message.name}"?`)) return;
    setPendingId(message.id);
    try {
      await api.delete(`/admin/messages/${message.id}`);
      setMessages((prev) => (prev ? prev.filter((m) => m.id !== message.id) : prev));
      if (expandedId === message.id) setExpandedId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Messages
        </h1>
        {messages && (
          <p className="mt-2 font-mono text-xs text-foreground-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} · {messages.length} total
          </p>
        )}
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      {!messages ? (
        <p className="font-mono text-sm text-foreground-muted">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="font-mono text-sm text-foreground-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => {
            const expanded = expandedId === message.id;
            return (
              <li
                key={message.id}
                className={`rounded-[var(--radius-card)] border px-5 py-4 ${
                  message.isRead ? "border-border" : "border-accent/40 bg-accent-soft"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleExpand(message)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-3">
                    {!message.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                    )}
                    <div>
                      <p className="text-sm text-foreground">{message.name}</p>
                      <p className="font-mono text-[10px] text-foreground-muted">
                        {message.email} · {message.phone}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-foreground-muted">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </button>

                {!expanded && (
                  <p className="mt-2 truncate text-sm text-foreground-muted">{message.comment}</p>
                )}

                {expanded && (
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    <p className="text-sm whitespace-pre-wrap text-foreground">
                      {message.comment}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setRead(message, !message.isRead)}
                        disabled={pendingId === message.id}
                        className="font-mono text-[10px] tracking-widest text-accent uppercase hover:underline disabled:opacity-50"
                      >
                        Mark as {message.isRead ? "unread" : "read"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(message)}
                        disabled={pendingId === message.id}
                        className="font-mono text-[10px] tracking-widest text-foreground-muted uppercase hover:text-danger disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
