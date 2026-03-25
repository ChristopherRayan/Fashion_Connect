import crypto from 'crypto';

/**
 * Embedding Service for generating vector embeddings from text
 * This is a simplified implementation that creates consistent embeddings
 * for similar text content. In production, you'd use a proper ML model.
 */

class EmbeddingService {
  constructor() {
    this.dimension = 384; // Standard embedding dimension
    this.cache = new Map(); // Cache embeddings to avoid recomputation
  }

  /**
   * Generate a simple but effective text embedding
   * This creates a consistent vector representation of text
   */
  generateSimpleEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.dimension).fill(0);
    }

    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(normalizedText)) {
      return this.cache.get(normalizedText);
    }

    // Create embedding based on text characteristics
    const embedding = new Array(this.dimension).fill(0);
    
    // Use text features to create meaningful embeddings
    const words = normalizedText.split(/\s+/);
    const chars = normalizedText.split('');
    
    // Feature 1: Word-based features
    words.forEach((word, index) => {
      const wordHash = this.hashString(word);
      const position = Math.abs(wordHash) % this.dimension;
      embedding[position] += 1 / (index + 1); // Weight by position
    });
    
    // Feature 2: Character n-grams
    for (let i = 0; i < chars.length - 2; i++) {
      const trigram = chars.slice(i, i + 3).join('');
      const trigramHash = this.hashString(trigram);
      const position = Math.abs(trigramHash) % this.dimension;
      embedding[position] += 0.5;
    }
    
    // Feature 3: Text length and structure
    const lengthFeature = Math.log(normalizedText.length + 1) / 10;
    for (let i = 0; i < 10; i++) {
      embedding[i] += lengthFeature;
    }
    
    // Normalize the embedding vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    // Cache the result
    this.cache.set(normalizedText, embedding);
    
    return embedding;
  }

  /**
   * Generate embedding for a product based on its attributes
   */
  generateProductEmbedding(product) {
    // Combine relevant product text fields
    const textParts = [
      product.name || '',
      product.description || '',
      product.category || '',
      product.subcategory || '',
      ...(product.tags || []),
      ...(product.colors || []),
      ...(product.materials || [])
    ];
    
    const combinedText = textParts.filter(Boolean).join(' ');
    return this.generateSimpleEmbedding(combinedText);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find similar products based on embedding similarity
   */
  findSimilarProducts(targetEmbedding, products, limit = 5) {
    if (!targetEmbedding || !Array.isArray(products)) {
      return [];
    }

    const similarities = products
      .filter(product => product.textEmbedding && product.textEmbedding.length > 0)
      .map(product => ({
        product,
        similarity: this.cosineSimilarity(targetEmbedding, product.textEmbedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }

  /**
   * Simple hash function for consistent string hashing
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Clear the embedding cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      dimension: this.dimension
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;
