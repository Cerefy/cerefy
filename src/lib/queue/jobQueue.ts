// src/lib/queue/jobQueue.ts
// ─────────────────────────────────────────────────────────────────────────────
// §6.3 background job processing on a real queue, not an in-process cron. The
// interface is the queue contract; the default in-memory implementation is for
// dev/tests and single-instance deploys. Production swaps in a durable
// implementation (e.g. Redis Streams / SQS / Google Cloud Tasks) behind the
// same interface — the job workers don't change, only the transport does.
// ─────────────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: string;
}

export interface JobWorker {
  (job: Job): Promise<void>;
}

export interface JobQueue {
  enqueue(type: string, payload: Record<string, unknown>): Promise<Job>;
  /** Register a worker to process jobs. Jobs enqueued before registration are still drained. */
  register(worker: JobWorker): void;
  workerCount(): number;
  pendingCount(): number;
  completedCount(): number;
  failedCount(): number;
  /** Drain everything in-flight and stop accepting work (graceful shutdown). */
  close(): Promise<void>;
}

interface QueuedJob extends Job {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
}

let jobSeq = 0;

export class InMemoryJobQueue implements JobQueue {
  private readonly jobs = new Map<string, QueuedJob>();
  private readonly pending: string[] = [];
  private readonly workers: JobWorker[] = [];
  private processing = false;
  private closed = false;

  constructor(
    private readonly options: {
      concurrency?: number;
      maxRetries?: number;
      backoffMs?: number;
      onFailure?: (job: QueuedJob, err: unknown) => void;
    } = {},
  ) {}

  async enqueue(type: string, payload: Record<string, unknown>): Promise<Job> {
    if (this.closed) throw new Error('queue closed');
    const job: QueuedJob = {
      id: `job_${++jobSeq}`,
      type,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.jobs.set(job.id, job);
    this.pending.push(job.id);
    this.drain();
    return job;
  }

  register(worker: JobWorker): void {
    this.workers.push(worker);
    this.drain();
  }

  workerCount(): number {
    return this.workers.length;
  }

  pendingCount(): number {
    return this.pending.length;
  }

  completedCount(): number {
    return [...this.jobs.values()].filter((j) => j.status === 'completed').length;
  }

  failedCount(): number {
    return [...this.jobs.values()].filter((j) => j.status === 'failed').length;
  }

  async close(): Promise<void> {
    this.closed = true;
    while (this.processing) {
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  private drain(): void {
    if (this.processing || this.workers.length === 0 || this.pending.length === 0) return;
    this.processing = true;
    const concurrency = this.options.concurrency ?? 1;
    let running = 0;

    const pump = (): void => {
      while (running < concurrency && this.pending.length > 0) {
        const id = this.pending.shift()!;
        const job = this.jobs.get(id);
        if (!job || job.status !== 'pending') continue;
        running++;
        job.status = 'running';
        job.attempts++;
        job.startedAt = new Date().toISOString();
        void this.run(job).finally(() => {
          running--;
          if (this.pending.length === 0 && running === 0) {
            this.processing = false;
          } else if (this.pending.length > 0) {
            pump();
          }
        });
      }
    };

    pump();
  }

  private async run(job: QueuedJob): Promise<void> {
    const worker = this.workers[0];
    try {
      if (!worker) throw new Error('no worker registered for job');
      await worker(job);
      job.status = 'completed';
    } catch (err) {
      const maxRetries = this.options.maxRetries ?? 2;
      if (job.attempts < maxRetries) {
        const backoff = (this.options.backoffMs ?? 100) * job.attempts;
        setTimeout(() => {
          job.status = 'pending';
          this.pending.push(job.id);
          this.drain();
        }, backoff);
        return;
      }
      job.status = 'failed';
      this.options.onFailure?.(job, err);
    }
  }
}

export function createJobQueue(options?: { concurrency?: number; maxRetries?: number; backoffMs?: number }): JobQueue {
  return new InMemoryJobQueue(options);
}