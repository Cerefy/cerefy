import { db, withTenantContext } from '../db';
import { documents, documentChunks } from '../db/schema';
import { getNeo4jDriver } from './neo4j';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export async function processDocument(
  tenantId: string, 
  title: string, 
  content: string, 
  aiClient: any,
  chunkSize: number = 500,
  chunkOverlap: number = 50
) {
  // 1. Chunking
  const chunks: string[] = [];
  let start = 0;
  while (start < content.length) {
    let end = start + chunkSize;
    if (end < content.length) {
      const lastSpace = content.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(content.slice(start, end).trim());
    start = end - chunkOverlap;
  }
  const cleanChunks = chunks.filter((c) => c.length > 0);
  logger.info(`🛠️ Chunking completed: ${cleanChunks.length} chunks generated for document '${title}'.`);

  // 2. Generate Embeddings & Save to PostgreSQL
  const documentId = await withTenantContext(tenantId, async (tx) => {
    // Insert document
    const [doc] = await tx.insert(documents).values({
      tenantId,
      title,
      mimeType: 'text/plain',
      rawContent: content,
      status: 'processed'
    }).returning({ id: documents.id });

    // Generate embeddings and insert chunks
    for (let i = 0; i < cleanChunks.length; i++) {
      const chunkText = cleanChunks[i];
      let embedding: number[] = [];
      
      try {
        const response = await aiClient.models.embedContent({
          model: 'text-embedding-004',
          contents: chunkText,
        });
        // @google/genai returns embeddings[0].values
        embedding = response.embeddings?.[0]?.values || [];
      } catch (e) {
        logger.error('Embedding failed for chunk', i, e);
      }

      await tx.insert(documentChunks).values({
        tenantId,
        documentId: doc.id,
        chunkIndex: i,
        content: chunkText,
        embedding: embedding.length > 0 ? embedding : null
      });
    }

    logger.info(`🔗 Document ID ${doc.id} created and ${cleanChunks.length} chunks saved.`);
    return doc.id;
  });

  // 3. Extract Entities & Insert into Neo4j
  try {
    const extractionPrompt = `Extract key entities from the following text and return them as a JSON list of objects with "name" and "label". Keep it strictly to the 5 most important entities.
Text: "${content.substring(0, 3000)}"`;
    
    const entityRes = await aiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: extractionPrompt
    });
    
    const jsonMatch = entityRes.text?.match(/\[.*\]/s);
    if (jsonMatch) {
      const entities = JSON.parse(jsonMatch[0]);
      const neo4jDriver = getNeo4jDriver();
      const session = neo4jDriver.session();
      
      try {
        for (const entity of entities) {
          if (entity.name && entity.label) {
             try {
               await session.run(
                 `MERGE (t:Tenant {id: $tenantId})
                  MERGE (e:Entity {name: $name, tenantId: $tenantId})
                  SET e.label = $label
                  MERGE (d:Document {id: $documentId, tenantId: $tenantId})
                  MERGE (d)-[:CONTAINS]->(e)
                  MERGE (e)-[:BELONGS_TO]->(t)`,
                 { tenantId, name: entity.name, label: entity.label, documentId }
               );
               logger.info(`✅ Inserted entity '${entity.name}' with label '${entity.label}' into Neo4j.`);
             } catch (e) {
               logger.error(`❌ Failed to insert entity '${entity.name}':`, e);
             }
          }
        }
      } finally {
        await session.close();
      }
    }
  } catch (e) {
    logger.error('Entity extraction or Neo4j insertion failed:', e);
  }

  logger.info(`📦 Processed document ID ${documentId} with ${cleanChunks.length} chunks.`);
  return { documentId, chunkCount: cleanChunks.length };
}
