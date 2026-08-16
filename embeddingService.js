/**
 * Embedded Vectorization Engine & Cosine Similarity Service for FrugalForge
 * Generates normalized dense vector embeddings for text artifacts & calculates semantic similarity scores.
 */

// Vocabulary dimension size for local feature embeddings
const VECTOR_DIMENSION = 384;

/**
 * Hash string into reproducible feature index
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generate 384-dimensional dense vector embedding from text content
 * Uses word n-grams, subword character frequencies, and term position weights
 */
export function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Array(VECTOR_DIMENSION).fill(0);
  }

  const vector = new Array(VECTOR_DIMENSION).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return vector;
  }

  // 1. Word token frequency and position weights
  words.forEach((word, idx) => {
    const wordHash = hashString(word) % VECTOR_DIMENSION;
    const weight = 1.0 + (1.0 / (idx + 1)); // Front-loaded title/heading importance
    vector[wordHash] += weight;

    // 2. Character n-gram subword hashing for semantic prefix/suffix matching
    if (word.length > 3) {
      const tri1 = word.substring(0, 3);
      const tri2 = word.substring(word.length - 3);
      const hash1 = hashString(tri1) % VECTOR_DIMENSION;
      const hash2 = hashString(tri2) % VECTOR_DIMENSION;
      vector[hash1] += 0.5;
      vector[hash2] += 0.5;
    }
  });

  // 3. Word bi-gram contextual coupling
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + '_' + words[i + 1];
    const bigramHash = hashString(bigram) % VECTOR_DIMENSION;
    vector[bigramHash] += 1.5;
  }

  // 4. L2 Vector Normalization (Unit Vector for Cosine Similarity calculation)
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}

/**
 * Calculate Cosine Similarity between two normalized vector arrays
 * Returns score in range [0.00, 1.00]
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const score = dotProduct / denominator;
  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

export const embeddingService = {
  generateEmbedding,
  cosineSimilarity,
  dimension: VECTOR_DIMENSION
};

export default embeddingService;
