export interface DocumentInput {
  id?: string;
  title?: string;
  mimeType?: string;
  content?: string;
}

export interface DiscoveryOutput {
  entities: string[];
  processes: string[];
  stakeholders: string[];
  assumptions: string[];
}

export function extractDocumentSignals(document: DocumentInput | null | undefined): DiscoveryOutput {
  const text = `${document?.title ?? ''}\n${document?.content ?? ''}`.trim();

  const entityMatches = text.match(/\b(Customer|Order|Invoice|Project|Tenant|User|Role|Policy|Approval|Payment|Contract|Workflow)\b/gi) ?? [];
  const processMatches = text.match(/\b(Approval|Validation|Onboarding|Billing|Order Management|Invoice Processing|Governance|Reporting|Escalation)\b/gi) ?? [];
  const stakeholderMatches = text.match(/\b(Sales|Finance|Operations|Legal|Engineering|Procurement|Compliance|Support|Admin)\b/gi) ?? [];

  return {
    entities: uniqueNormalized(entityMatches),
    processes: uniqueNormalized(processMatches),
    stakeholders: uniqueNormalized(stakeholderMatches),
    assumptions: text ? ['Document requires human review for ambiguous business rules.'] : ['No document content supplied.'],
  };
}

export function uniqueNormalized(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean).map((value) => value.replace(/\s+/g, ' ')))];
}

export function summarizeRequirements(title: string, details: string[]): string {
  return [title, ...details].filter(Boolean).join(': ');
}
