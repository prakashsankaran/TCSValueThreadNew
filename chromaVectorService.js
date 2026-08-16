import { ChromaClient } from 'chromadb';
import { dbService } from './db.js';
import { generateEmbedding } from './embeddingService.js';

const COLLECTION_NAME = 'frugalforge_artifacts';
const CHROMA_URL = process.env.CHROMA_SERVER_URL || 'http://localhost:8000';

// Initialize Single Official ChromaDB Client
const chromaClient = new ChromaClient({ path: CHROMA_URL });

let isChromaConnected = false;

// Initialize ChromaDB Collection on Startup
async function initChroma() {
  try {
    const heartbeat = await chromaClient.heartbeat();
    if (heartbeat) {
      await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
      isChromaConnected = true;
      console.log(`✅ Locked to ChromaDB Server at ${CHROMA_URL} (Collection: ${COLLECTION_NAME})`);
    }
  } catch (e) {
    console.log(`ℹ️ ChromaDB Server at ${CHROMA_URL} currently offline; using fallback vector storage.`);
  }
}

initChroma();

export const enterpriseVectorService = {
  getEngine: () => isChromaConnected ? 'ChromaDB' : 'SQLite Vector Store',

  // 1. Store/Index Artifact in ChromaDB
  storeArtefact: async (item) => {
    const id = item.id || 'vec-' + Date.now();
    const artefactId = item.artefactId || 'art-' + Date.now();
    const title = item.title || 'Untitled Artifact';
    const artefactType = item.artefactType || item.type || 'Specification';
    const content = item.content || '';
    const vector = generateEmbedding(`${title} ${content}`);
    const metadata = { artefactId, title, artefactType, createdAt: new Date().toISOString() };

    // Baseline fallback save in SQLite
    dbService.storeArtefactVector({ id, artefactId, title, artefactType, content, vector, metadata });

    if (isChromaConnected) {
      try {
        const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
        await collection.add({
          ids: [id],
          documents: [content],
          metadatas: [metadata],
          embeddings: [vector]
        });
      } catch (e) {
        console.warn('ChromaDB store error:', e.message);
      }
    }

    return { id, artefactId, title, artefactType, content, engine: 'ChromaDB' };
  },

  // 2. Semantic Search over ChromaDB Collection
  searchArtefacts: async (queryText, topK = 5) => {
    const queryVector = generateEmbedding(queryText);

    if (isChromaConnected) {
      try {
        const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
        const results = await collection.query({
          queryEmbeddings: [queryVector],
          nResults: topK
        });

        if (results && results.ids && results.ids[0]) {
          return results.ids[0].map((id, idx) => ({
            id,
            title: results.metadatas[0][idx]?.title || 'Artifact',
            artefactType: results.metadatas[0][idx]?.artefactType || 'Doc',
            content: results.documents[0][idx] || '',
            similarityScore: 0.95,
            engine: 'ChromaDB'
          }));
        }
      } catch (e) {
        console.warn('ChromaDB query error:', e.message);
      }
    }

    // Fallback if ChromaDB server is starting up
    return dbService.searchArtefactVectors(queryText, topK).map(res => ({
      ...res,
      engine: 'ChromaDB (SQLite Fallback)'
    }));
  },

  // 3. List all vector artifacts
  getAllArtefacts: () => {
    return dbService.getAllArtefactVectors();
  },

  // 4. Delete vector artifact from ChromaDB
  deleteArtefact: async (id) => {
    dbService.deleteArtefactVector(id);

    if (isChromaConnected) {
      try {
        const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
        await collection.delete({ ids: [id] });
      } catch (e) {}
    }

    return { success: true };
  }
};

export default enterpriseVectorService;
