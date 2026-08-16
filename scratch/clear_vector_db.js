import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChromaClient } from 'chromadb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../frugalforge.db');

const db = new Database(dbPath);

// 1. Wipe SQLite artefact_embeddings
try {
  db.exec('DELETE FROM artefact_embeddings;');
  console.log('✅ SQLite artefact_embeddings table wiped clean.');
} catch (e) {
  console.error('Error clearing SQLite embeddings table:', e.message);
}

// 2. Wipe ChromaDB collection if online
try {
  const chromaClient = new ChromaClient({ path: 'http://localhost:8000' });
  const heartbeat = await chromaClient.heartbeat();
  if (heartbeat) {
    try {
      await chromaClient.deleteCollection({ name: 'frugalforge_artifacts' });
      await chromaClient.createCollection({ name: 'frugalforge_artifacts' });
      console.log('✅ ChromaDB frugalforge_artifacts collection wiped clean.');
    } catch (colErr) {
      console.log('ChromaDB collection reset status:', colErr.message);
    }
  }
} catch (chromaErr) {
  console.log('ChromaDB server check:', chromaErr.message);
}

console.log('🎉 Vector Database completely reset & ready for a fresh start!');
