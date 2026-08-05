import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private socket?: Server;

  constructor() {
    // Prefer an already-initialized Socket.IO server exposed by the consolidated bootstrap
    // This allows immediate compatibility while the Gateway migration completes.
    // Accessing global is intentional and transient; once a proper Nest Gateway is added
    // this provider can be refactored to inject the Gateway instead.
    const g = (global as any).__CEREFY_SOCKET_SERVER;
    if (g) this.socket = g as Server;
  }

  getServer(): Server | undefined {
    return this.socket;
  }

  emit(event: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit(event, payload);
  }
}
