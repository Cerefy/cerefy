import type { CerefyGraphState } from './state';

export function supervisorAgent(state: CerefyGraphState): string {
  if (state.documents.length > 0 || state.type === 'document_analysis' || state.type === 'discovery') {
    return 'discovery';
  }

  if (state.requirements.length > 0 || state.type === 'requirements_analysis') {
    return 'analyst';
  }

  return 'governance';
}
