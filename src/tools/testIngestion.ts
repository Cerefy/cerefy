import { processDocument } from '../lib/ingestionService';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../lib/logger';
import 'dotenv/config';

(async () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : new (class {
  models = {
    embedContent: async () => ({ embeddings: [{ values: new Array(768).fill(0) }] }),
    generateContent: async () => ({ text: JSON.stringify([{ name: 'MockEntity', label: 'MockLabel' }]) })
  };
})();
    const tenantId = 'demo-tenant';
    const title = 'Demo document';
    const content = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;

    logger.info('🚀 Starting test ingestion...');
    const result = await processDocument(tenantId, title, content, ai);
    logger.info('✅ Ingestion completed – result: %o', result);
  } catch (err) {
    logger.error('❌ Test ingestion failed:', err);
    process.exit(1);
  }
})();
