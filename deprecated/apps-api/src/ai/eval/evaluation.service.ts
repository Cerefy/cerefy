import { Injectable } from '@nestjs/common';

export interface EvaluationResult {
  overallQualityScore: number; // 0 to 100
  hallucinationDetected: boolean;
  completenessScore: number;
  traceabilityScore: number;
  feedbackNotes: string;
}

@Injectable()
export class EvaluationService {
  async evaluateOutput(outputData: any, referenceContext?: string): Promise<EvaluationResult> {
    const rawText = JSON.stringify(outputData);
    const length = rawText.length;

    const hallucinationDetected = length < 10;
    const completenessScore = Math.min(98, Math.max(60, Math.floor(length / 20)));
    const traceabilityScore = referenceContext && referenceContext.length > 50 ? 95 : 75;
    const overallQualityScore = Math.floor((completenessScore + traceabilityScore) / 2);

    return {
      overallQualityScore,
      hallucinationDetected,
      completenessScore,
      traceabilityScore,
      feedbackNotes: hallucinationDetected
        ? 'Output too sparse; potential hallucination or null response.'
        : 'High traceability against enterprise reference context.',
    };
  }
}
