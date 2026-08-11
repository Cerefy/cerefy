// src/components/ActivityFeedView.tsx
// Real-time enterprise activity feed using Socket.IO hooks
// Uses existing Cerefy Obsidian/Cyan identity

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRealtimeActivity } from '../hooks/useRealtime';
import {
  Activity,
  Bot,
  Workflow,
  Scale,
  Settings,
  User,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Trash2,
  RefreshCcw,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const getIcon = (type: string) => {
  switch (type) {
    case 'agent': return Bot;
    case 'workflow': return Workflow;
    case 'decision': return Scale;
    case 'user': return User;
    case 'system': return Settings;
    default: return Activity;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'error': return 'text-rose-signal-strong bg-rose-signal/10 border-rose-signal/20';
    case 'warning': return 'text-amber-signal-strong bg-amber-signal/10 border-amber-signal/20';
    case 'success': return 'text-emerald-signal-strong bg-emerald-signal/10 border-emerald-signal/20';
    case 'info': default: return 'text-cyan-signal-strong bg-cyan-signal/10 border-cyan-signal/20';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'error': return <AlertTriangle size={14} className="text-rose-signal-strong" />;
    case 'warning': return <AlertTriangle size={14} className="text-amber-signal-strong" />;
    case 'success': return <CheckCircle2 size={14} className="text-emerald-signal-strong" />;
    case 'info': default: return <Info size={14} className="text-cyan-signal-strong" />;
  }
};

// No fabricated fallback data. If the realtime backend has not emitted events
// yet, the feed renders its honest empty state below.
export const ActivityFeedView: React.FC = () => {
  const { activities, clearActivities } = useRealtimeActivity();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark-text-bright flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-signal-strong" />
            Live Activity Feed
          </h1>
          <p className="text-dark-muted text-xs font-mono mt-1">
            REAL-TIME SYSTEM EVENTS · AGENT ACTIVITY · AUDIT LOG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCcw size={14} />}>Reconnect</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={clearActivities}>Clear Logs</Button>
        </div>
      </div>

      {/* Feed Container */}
      <div className="bg-dark-panel/40 border border-dark-panel-raised/60 rounded-2xl p-4 overflow-hidden min-h-[60vh] relative">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-signal/5 blur-[100px] pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <AnimatePresence>
            {activities.map((act, index) => {
              const TypeIcon = getIcon(act.type);
              const severityClass = getSeverityStyles(act.severity);

              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-dark-panel/80 backdrop-blur-sm border border-dark-panel-raised/80 rounded-xl p-4 flex gap-4 items-start group hover:border-dark-panel-soft transition-colors"
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 ${severityClass}`}>
                    <TypeIcon size={18} />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-sm font-medium text-dark-text-bright group-hover:text-cyan-signal-soft transition-colors">
                        {act.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-dark-muted shrink-0">
                        <Clock size={12} />
                        <span>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-dark-muted-strong mb-2 leading-relaxed">
                      {act.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="neutral" size="xs" className="uppercase tracking-widest text-[9px]">
                        {act.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] font-mono font-medium">
                        {getSeverityIcon(act.severity)}
                        <span className={act.severity === 'error' ? 'text-rose-signal-strong' : act.severity === 'warning' ? 'text-amber-signal-strong' : act.severity === 'success' ? 'text-emerald-signal-strong' : 'text-cyan-signal-strong'}>
                          {act.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-dark-muted">
              <Activity size={32} className="mb-3 opacity-20" />
              <p className="text-sm">No activity recorded yet.</p>
              <p className="text-xs font-mono mt-1">Listening for events...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
