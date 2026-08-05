import { Annotation } from '@langchain/langgraph';

export interface CerefyExecutionInput {
  type: string;
  tenantId: string;
  userId: string;
  projectId?: string;
  documentId?: string;
  prompt?: string;
  documents?: Array<Record<string, unknown>>;
  requirements?: Array<Record<string, unknown>>;
  decisions?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface CerefyExecutionState {
  executionId: string;
  tenantId: string;
  projectId: string;
  documentId: string;
  type: string;
  documents: Array<Record<string, unknown>>;
  requirements: Array<Record<string, unknown>>;
  decisions: Array<Record<string, unknown>>;
  confidence: number;
  nextAgent: string;
  history: Array<Record<string, unknown>>;
  memoryComplete: boolean;
  discoveryComplete: boolean;
  analystComplete: boolean;
  governanceComplete: boolean;
  summary: string;
  output: Record<string, unknown>;
  errors: string[];
  input: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export const CerefyStateAnnotation = Annotation.Root({
  executionId: Annotation<string>(),
  tenantId: Annotation<string>(),
  projectId: Annotation<string>(),
  documentId: Annotation<string>(),
  type: Annotation<string>(),
  documents: Annotation<Array<Record<string, unknown>>>(),
  requirements: Annotation<Array<Record<string, unknown>>>(),
  decisions: Annotation<Array<Record<string, unknown>>>(),
  confidence: Annotation<number>(),
  nextAgent: Annotation<string>(),
  history: Annotation<Array<Record<string, unknown>>>(),
  memoryComplete: Annotation<boolean>(),
  discoveryComplete: Annotation<boolean>(),
  analystComplete: Annotation<boolean>(),
  governanceComplete: Annotation<boolean>(),
  summary: Annotation<string>(),
  output: Annotation<Record<string, unknown>>(),
  errors: Annotation<string[]>(),
  input: Annotation<Record<string, unknown>>(),
  metadata: Annotation<Record<string, unknown>>(),
});

export type CerefyGraphState = typeof CerefyStateAnnotation.State;
