import React from 'react';
import { WorkflowAutomationView } from './WorkflowAutomationView';

/**
 * Historical entry route for the former Agent Studio / Workflow screen.
 * Agent configuration and deployment have no real backend contract yet, so this
 * route deliberately exposes only the live, API-backed workflow capability.
 */
export const AIStudioWorkflowView: React.FC = () => <WorkflowAutomationView />;
