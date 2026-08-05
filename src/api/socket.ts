// src/api/socket.ts
// Socket.IO real-time client for agent execution updates, workflow status, and activity feed

import { io, Socket } from 'socket.io-client';

export type SocketEvent =
  | 'agent.started'
  | 'agent.progress'
  | 'agent.completed'
  | 'agent.failed'
  | 'agent.error'
  | 'workflow.updated'
  | 'decision.pending'
  | 'approval.completed'
  | 'activity.new'
  | 'notification.new';

export interface AgentProgressEvent {
  agentId: string;
  agentName: string;
  stepIndex: number;
  totalSteps: number;
  status: string;
  output?: string;
  durationMs?: number;
  timestamp: string;
}

export interface WorkflowUpdateEvent {
  workflowId: string;
  status: string;
  currentNode: string;
  progress: number;
  timestamp: string;
}

export interface ActivityEvent {
  id: string;
  type: 'agent' | 'workflow' | 'decision' | 'system' | 'user';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('cerefy_access_token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[Cerefy Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Cerefy Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`[Cerefy Socket] Connection error (attempt ${this.reconnectAttempts}):`, error.message);
    });

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb as (...args: unknown[]) => void);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on<T = unknown>(event: SocketEvent | string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (...args: unknown[]) => void);
    this.socket?.on(event, callback as (...args: unknown[]) => void);

    return () => {
      this.listeners.get(event)?.delete(callback as (...args: unknown[]) => void);
      this.socket?.off(event, callback as (...args: unknown[]) => void);
    };
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  joinRoom(room: string): void {
    this.socket?.emit('join', { room });
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave', { room });
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;
