// src/components/notifications/NotificationCenter.tsx
// Real-time notification feed (Plan Part 4: build once, apply everywhere).
//
// Subscribes to the existing socket service. Every item that arrives is real
// backend data; before the first event arrives the center shows an honest
// EmptyState — it never fabricates alerts. Categorized per the plan: AI,
// Workflow, Security, Approvals, System.

import React, { useEffect, useMemo, useState } from 'react';
import socketService, { SocketEvent, ActivityEvent } from '../../api/socket';
import { EmptyState } from '../design-system';
import { FadeUpIn } from '../../lib/motion';

type Category = 'ai' | 'workflow' | 'security' | 'approval' | 'system';

const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  ai: { label: 'AI Alerts', icon: 'psychology' },
  workflow: { label: 'Workflow Alerts', icon: 'account_tree' },
  security: { label: 'Security Alerts', icon: 'shield_lock' },
  approval: { label: 'Approvals', icon: 'task_alt' },
  system: { label: 'System Events', icon: 'monitor_heart' },
};

function categorize(event: string): Category {
  if (event.startsWith('agent.') || event === 'notification.new') return 'ai';
  if (event.startsWith('workflow.')) return 'workflow';
  if (event.startsWith('security.')) return 'security';
  if (event === 'decision.pending' || event === 'approval.completed') return 'approval';
  return 'system';
}

interface FeedItem {
  id: string;
  category: Category;
  title: string;
  description?: string;
  timestamp: string;
  severity: string;
}

function toItem(activity: ActivityEvent): FeedItem {
  return {
    id: activity.id,
    category: activity.type === 'user' ? 'system' : (activity.type as Category) || 'system',
    title: activity.title,
    description: activity.description,
    timestamp: activity.timestamp,
    severity: activity.severity,
  };
}

const SUBSCRIBED_EVENTS: SocketEvent[] = [
  'agent.started',
  'agent.completed',
  'agent.failed',
  'agent.error',
  'workflow.updated',
  'decision.pending',
  'approval.completed',
  'notification.new',
  'activity.new',
];

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketService.connect();
    setConnected(socketService.isConnected);
    const unsubs = SUBSCRIBED_EVENTS.map((event) =>
      socketService.on<ActivityEvent>(event, (data) => {
        setItems((prev) => [toItem(data), ...prev].slice(0, 50));
      }),
    );
    const onConnected = () => setConnected(true);
    const onDisconnected = () => setConnected(false);
    const unsubConnect = socketService.on('connect', onConnected);
    const unsubDisconnect = socketService.on('disconnect', onDisconnected);
    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  const groups = useMemo(() => {
    const cats: Category[] = ['ai', 'workflow', 'security', 'approval', 'system'];
    return cats
      .map((cat) => ({ cat, items: items.filter((i) => i.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="text-on-surface-variant hover:text-on-surface transition-colors relative"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
          notifications
        </span>
        {items.length > 0 && (
          <span className="absolute top-0 end-0 min-w-4 h-4 px-1 rounded-full bg-error text-on-error text-[9px] font-label flex items-center justify-center border border-surface-container-lowest">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-9 w-80 z-50 bento-card rounded-xl shadow-float border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
              <span className="font-headline text-sm font-semibold text-on-surface">Notifications</span>
              <span className={`font-label text-[10px] uppercase tracking-wider ${connected ? 'text-emerald-signal' : 'text-on-surface-variant'}`}>
                {connected ? 'live' : 'offline'}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 space-y-4">
              {groups.length === 0 ? (
                <EmptyState
                  icon="notifications_none"
                  title="No notifications yet"
                  description={
                    connected
                      ? 'Real-time alerts from AI runs, workflows, approvals, and system events will appear here as they arrive.'
                      : 'The real-time feed is offline in this environment. Events will stream here once connected.'
                  }
                />
              ) : (
                groups.map(({ cat, items: catItems }) => (
                  <div key={cat}>
                    <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
                        {CATEGORY_META[cat].icon}
                      </span>
                      {CATEGORY_META[cat].label}
                    </div>
                    <ul className="space-y-1.5">
                      {catItems.map((item) => (
                        <FadeUpIn key={item.id}>
                          <li className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2">
                            <p className="text-xs font-medium text-on-surface">{item.title}</p>
                            {item.description && (
                              <p className="text-[11px] text-on-surface-variant mt-0.5">{item.description}</p>
                            )}
                            <p className="text-[10px] font-label text-on-surface-variant mt-1 uppercase tracking-wider">
                              {item.timestamp}
                            </p>
                          </li>
                        </FadeUpIn>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};