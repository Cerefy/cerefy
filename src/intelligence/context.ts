// src/intelligence/context.ts
// Context composition for Arabic Intelligence.
//
// Combines:
//   User Context + Organization Context + Country Context + Industry Context +
//   Language Context + Dialect Context + Enterprise Memory + Retrieved
//   Documents + Current Task
// into a single structured object that the agent pipeline consumes.
//
// This module is provider-agnostic: it never calls a model directly.

import { detectLanguage } from './detect';
import { getMarketById, Market } from './markets/catalog';
import { getIndustryById, Industry } from './industries';

export interface OrganizationIntelligenceProfile {
  tenantId: string;
  country?: string;
  marketId?: string;
  industryId?: string;
  language?: 'ar' | 'en' | 'both';
  dialect?: string;
  responseStyle?: 'formal' | 'concise' | 'detailed';
  terminology?: string[];
  policies?: string[];
  dataResidency?: string;
  updatedAt?: string;
}

export interface ContextInput {
  tenantId: string;
  userId?: string;
  query: string;
  organization?: OrganizationIntelligenceProfile | null;
  market?: Market | null;
  industry?: Industry | null;
  memory?: unknown[];
  documents?: unknown[];
  taskType?: string;
}

export interface ComposedContext {
  tenantId: string;
  userId?: string;
  query: string;
  detectedLanguage: ReturnType<typeof detectLanguage>;
  dialect: string;
  organization: OrganizationIntelligenceProfile | null;
  market: Market | null;
  industry: Industry | null;
  contextBlocks: Array<{ source: string; content: string }>;
  contextPreview: string;
  contextHint: string;
  compositionVersion: string;
}

export function composeContext(input: ContextInput): ComposedContext {
  const blocks: Array<{ source: string; content: string }> = [];
  const documentRefs: string[] = [];

  // 1. Language + dialect detection (query text)
  const detectedLanguage = input.query ? detectLanguage(input.query) : ({} as ReturnType<typeof detectLanguage>);
  const detectedDialect = detectedLanguage?.dialect?.dialect || 'msa';

  // 2. Organization profile
  const org = input.organization || null;
  if (org && org.tenantId) {
    blocks.push({
      source: 'organization',
      content: [
        `Organization: ${org.tenantId}`,
        org.industryId ? `Industry: ${org.industryId}` : null,
        org.marketId ? `Market: ${org.marketId}` : null,
        org.language ? `Language: ${org.language}` : null,
        org.dialect ? `Dialect: ${org.dialect}` : null,
        org.dataResidency ? `Data residency: ${org.dataResidency}` : null,
        org.policies?.length ? `Policies: ${org.policies.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
    });
  }

  // 3. Market context
  const market = input.market || (org?.marketId ? getMarketById(org.marketId) : null) || null;
  if (market) {
    blocks.push({
      source: 'market',
      content: [
        `Country: ${market.country} (${market.id})`,
        `Currency: ${market.currency.code}`,
        `Dialects: ${market.dialects.join(', ') || 'msa'}`,
        `Residency: ${market.dataResidency}`,
        `Regulatory: ${market.regulatorySources.join(', ') || 'not specified'}`,
      ].join('\n'),
    });
  }

  // 4. Industry context
  const industry = input.industry || (org?.industryId ? getIndustryById(org.industryId) : null) || null;
  if (industry) {
    blocks.push({
      source: 'industry',
      content: [
        `Industry: ${industry.name}`,
        industry.terminology.length ? `Terminology: ${industry.terminology.join(', ')}` : null,
        industry.regulatoryDomains.length ? `Regulatory domains: ${industry.regulatoryDomains.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  // 5. Reference counts for memory/documents (never raw content in the hint)
  if (input.memory && input.memory.length > 0) documentRefs.push(`memory:${input.memory.length}`);
  if (input.documents && input.documents.length > 0) documentRefs.push(`documents:${input.documents.length}`);

  if (input.taskType) blocks.push({ source: 'task', content: `Task type: ${input.taskType}` });

  const compositionVersion = 'arabic-intel-v1';
  const contextBlocks = blocks;
  const contextPreview = contextBlocks.map((b) => `[${b.source}] ${b.content}`).join('\n');

  return {
    tenantId: input.tenantId,
    userId: input.userId,
    query: input.query,
    detectedLanguage,
    dialect: org?.dialect || market?.dialects?.[0] || detectedDialect,
    organization: org,
    market,
    industry,
    contextBlocks,
    contextPreview,
    contextHint: `Language: ${detectedLanguage?.language}; Dialect: ${org?.dialect || market?.dialects?.[0] || detectedDialect}; References: ${documentRefs.join(', ') || 'none'}`,
    compositionVersion,
  };
}