export interface HumanFeedbackRecord {
  answerId: string;
  tenantId: string;
  modelVersion: string;
  promptVersion: string;
  originalOutput: Record<string, unknown>;
  revisedOutput: Record<string, unknown>;
  action: 'edited' | 'rejected' | 'approved';
  reviewerId: string;
  reviewedAt: string;
}

export interface TrainingExample {
  kind: 'prompt_response_pair' | 'ranking_pair';
  exampleId: string;
  answerId: string;
  prompt: string;
  chosen: string;
  rejected?: string;
}

export function structureTrainingExample(feedback: HumanFeedbackRecord): TrainingExample | null {
  const prompt = typeof feedback.originalOutput.prompt === 'string' ? feedback.originalOutput.prompt : '';
  const chosen = typeof feedback.revisedOutput.answer === 'string' ? feedback.revisedOutput.answer : '';
  const rejected = typeof feedback.originalOutput.answer === 'string' ? feedback.originalOutput.answer : undefined;

  if (feedback.action === 'rejected') {
    return { kind: 'ranking_pair', exampleId: feedback.answerId, answerId: feedback.answerId, prompt, chosen, rejected };
  }
  if (feedback.action === 'edited' && chosen) {
    return { kind: 'prompt_response_pair', exampleId: feedback.answerId, answerId: feedback.answerId, prompt, chosen };
  }
  return null;
}

export class FeedbackPipeline {
  private examples: TrainingExample[] = [];

  ingest(feedback: HumanFeedbackRecord): TrainingExample | null {
    const example = structureTrainingExample(feedback);
    if (example) this.examples.push(example);
    return example;
  }

  drain(): TrainingExample[] {
    const out = [...this.examples];
    this.examples = [];
    return out;
  }

  count(): number {
    return this.examples.length;
  }
}