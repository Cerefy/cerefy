import type { CerefyGraphState } from './state';

export function supervisorAgent(state: CerefyGraphState): string {
  if (!state.discoveryComplete) {
    return 'discovery';
  }

  if (!state.analystComplete) {
    return 'analyst';
  }

  if (!state.governanceComplete) {
    return 'governance';
  }

  return 'complete';
}

export function shouldRunDiscovery(state: CerefyGraphState): boolean {
  return !state.discoveryComplete && (state.documents.length > 0 || state.type === 'document_analysis' || state.type === 'discovery');
}

export function shouldRunAnalyst(state: CerefyGraphState): boolean {
  return state.discoveryComplete && !state.analystComplete;
}

export function shouldRunGovernance(state: CerefyGraphState): boolean {
  return state.analystComplete && !state.governanceComplete;
}
