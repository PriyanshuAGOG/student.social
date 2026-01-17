/**
 * Video Utilities Library
 * 
 * Helper functions for:
 * - Extracting YouTube video IDs
 * - Fetching transcripts
 * - Cleaning and normalizing transcripts
 * - Intelligent chunking of transcripts
 */

import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch transcript from YouTube video using youtube-transcript
 */
export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      console.warn(`No transcript found for video ${videoId}`);
      return null;
    }

    // Combine all text items
    const transcript = transcriptItems
      .map(item => decodeHtmlEntities(item.text))
      .join(' ');

    // Clean up
    return cleanTranscript(transcript);
  } catch (error) {
    console.warn('Error fetching transcript:', error);
    // Fallback or just return null
    return null;
  }
}

/**
 * Decode HTML entities in transcript text
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  return result;
}

/**
 * Clean and normalize transcript
 * - Remove timestamps
 * - Remove duplicates
 * - Fix spacing
 * - Capitalize sentences
 */
export function cleanTranscript(transcript: string): string {
  let cleaned = transcript
    // Remove timestamps (MM:SS format) if any remain
    .replace(/\d{1,2}:\d{2}(?::\d{2})?\s*/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove HTML tags if any remain
    .replace(/<[^>]*>/g, '')
    // Trim
    .trim();

  return cleaned;
}

/**
 * Estimate token count (simplified)
 * Rough estimate: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunk transcript intelligently
 * - Respects sentence boundaries
 * - Creates chunks of target token size
 * - Never breaks mid-word
 */
export function chunkTranscript(
  transcript: string,
  options: {
    targetTokens?: number;
    minTokens?: number;
    maxTokens?: number;
  } = {}
): Array<{ content: string; tokenCount: number; startIndex: number; endIndex: number }> {
  const { maxTokens = 800 } = options;

  // Split by sentence endings, keeping the punctuation
  const sentences = transcript.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [transcript];

  const chunks: Array<{
    content: string;
    tokenCount: number;
    startIndex: number;
    endIndex: number;
  }> = [];

  let currentChunk = '';
  let chunkTokens = 0;
  let startIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    const sentenceTokens = estimateTokens(sentence);
    const potentialTokens = chunkTokens + sentenceTokens; // Simplified calculation

    if (potentialTokens <= maxTokens) {
      // Add sentence to current chunk
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      chunkTokens = potentialTokens;
    } else {
      // Current chunk is full, save it if it meets minimum or if it's forced
      if (chunkTokens > 0) {
        chunks.push({
          content: currentChunk,
          tokenCount: chunkTokens,
          startIndex,
          endIndex: i - 1,
        });
        startIndex = i;
      }

      // Start new chunk
      currentChunk = sentence;
      chunkTokens = sentenceTokens;
    }
  }

  // Add final chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk,
      tokenCount: chunkTokens,
      startIndex,
      endIndex: sentences.length - 1,
    });
  }

  return chunks;
}

/**
 * Calculate video timestamp from chunk position
 * Assumes roughly uniform video duration
 */
export function calculateTimestamp(
  chunkIndex: number,
  totalChunks: number,
  videoDuration: number // in seconds
): number {
  if (totalChunks <= 0) return 0;
  return Math.floor((chunkIndex / totalChunks) * videoDuration);
}

/**
 * Detect language from transcript (simplified)
 * In production, would use language detection library
 */
export function detectLanguage(text: string): string {
  // Simple heuristic - check for common words
  const englishWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  ];
  const lowerText = text.toLowerCase();
  const englishMatches = englishWords.filter((word) =>
    new RegExp(`\\b${word}\\b`).test(lowerText)
  ).length;

  return englishMatches > 3 ? 'en' : 'unknown';
}

/**
 * Extract key phrases from transcript
 */
export function extractKeyPhrases(transcript: string, count = 10): string[] {
  // Split into words and filter out common words
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'be', 'are', 'was', 'were', 'been', 'this', 'that', 'these', 'those', 'have', 'has', 'had', 'what', 'when', 'where', 'who', 'why', 'how', 'which', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'just', 'like', 'than', 'into', 'very', 'really', 'about', 'some', 'other', 'time', 'more', 'only', 'your', 'they', 'them', 'their'
  ]);

  const words = transcript
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !commonWords.has(w));

  // Simple frequency count
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}
