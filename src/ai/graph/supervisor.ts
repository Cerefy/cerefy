import type { CerefyGraphState } from './state';

export function supervisorAgent(state: CerefyGraphState): string {
  if (state.documents.length > 0 || state.type === 'document_analysis' || state.type === 'discovery') {
    return 'discovery';
  }

  if (state.type === 'requirements_analysis' || state.type === 'requirement_analysis' || state.requirements.length > 0) {
    return 'requirement';
  }

  if (state.type === 'process_analysis' || state.type === 'workflow_analysis') {
    return 'process';
  }

  if (state.type === 'data_analysis' || state.type === 'analytics') {
    return 'data';
  }

  if (state.type === 'code_generation' || state.type === 'implementation') {
    return 'code';
  }

  if (state.type === 'validation' || state.type === 'validation_review') {
    return 'validation';
  }

  if (state.type === 'requirements_analysis' || state.requirements.length > 0) {
    return 'analyst';
  }

  return 'governance';
}
