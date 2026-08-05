// src/hooks/useRealtime.ts
// Hook for subscribing to Socket.IO real-time events with automatic cleanup

import { useEffect, useState, useCallback, useRef } from 'react';
import socketService, { ActivityEvent, AgentProgressEvent, WorkflowUpdateEvent } from '../api/socket';

export function useRealtimeActivity(maxItems = 50) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const unsub = socketService.on<ActivityEvent>('activity.new', (event) => {
      setActivities((prev) => [event, ...prev].slice(0, maxItems));
    });
    return unsub;
  }, [maxItems]);

  const clearActivities = useCallback(() => setActivities([]), []);

  return { activities, clearActivities };
}

export function useAgentProgress() {
  const [progress, setProgress] = useState<AgentProgressEvent | null>(null);
  const [history, setHistory] = useState<AgentProgressEvent[]>([]);

  useEffect(() => {
    const unsubStart = socketService.on<AgentProgressEvent>('agent.started', (event) => {
      setProgress(event);
      setHistory([event]);
    });

    const unsubProgress = socketService.on<AgentProgressEvent>('agent.progress', (event) => {
      setProgress(event);
      setHistory((prev) => [...prev, event]);
    });

    const unsubComplete = socketService.on<AgentProgressEvent>('agent.completed', (event) => {
      setProgress(event);
      setHistory((prev) => [...prev, event]);
    });

    const unsubFailed = socketService.on<AgentProgressEvent>('agent.failed', (event) => {
      setProgress(event);
      setHistory((prev) => [...prev, event]);
    });

    const unsubError = socketService.on<AgentProgressEvent>('agent.error', (event) => {
      setProgress(event);
      setHistory((prev) => [...prev, event]);
    });

    return () => {
      unsubStart();
      unsubProgress();
      unsubComplete();
      unsubFailed();
      unsubError();
    };
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setHistory([]);
  }, []);

  return { progress, history, reset };
}

export function useWorkflowUpdates() {
  const [workflow, setWorkflow] = useState<WorkflowUpdateEvent | null>(null);

  useEffect(() => {
    const unsub = socketService.on<WorkflowUpdateEvent>('workflow.updated', (event) => {
      setWorkflow(event);
    });
    return unsub;
  }, []);

  return workflow;
}

export function useDecisionNotifications() {
  const [pending, setPending] = useState<string[]>([]);

  useEffect(() => {
    const unsubPending = socketService.on<{ decisionId: string }>('decision.pending', (event) => {
      setPending((prev) => [...new Set([...prev, event.decisionId])]);
    });

    const unsubApproved = socketService.on<{ decisionId: string }>('approval.completed', (event) => {
      setPending((prev) => prev.filter((id) => id !== event.decisionId));
    });

    return () => {
      unsubPending();
      unsubApproved();
    };
  }, []);

  return { pendingDecisions: pending };
}

export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsConnected(socketService.isConnected);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return isConnected;
}
