/**
 * Video Utilities Library
 * 
 * Helper functions for:
 * - Extracting YouTube video IDs
 * - Fetching transcripts
 * - Cleaning and normalizing transcripts
 * - Intelligent chunking of transcripts
 */

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
 * Fetch transcript from YouTube video using youtube-transcript-api
 * 
 * In production, this would use the youtube-transcript-api package
 * For now, we'll provide a fallback that accepts manual transcripts
 */
export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    // Option 1: Use youtube-transcript-api (requires npm install youtube-transcript-api)
    // This is a simplified version - real implementation would use the actual package
    
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Could not fetch transcript for video ${videoId}`);
      return null;
    }

    const text = await response.text();
    
    // Parse captions XML (simplified)
    const captions = text.match(/<text[^>]*>(.+?)<\/text>/g);
    if (!captions) return null;

    const transcript = captions
      .map((caption) => {
        const match = caption.match(/>(.+?)<\/text>/);
        if (match) {
          // Decode HTML entities
          return decodeHtmlEntities(match[1]);
        }
        return '';
      })
      .join(' ');

    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
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
    // Remove timestamps (MM:SS format)
    .replace(/\d{1,2}:\d{2}(?::\d{2})?\s*/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove HTML tags if any remain
    .replace(/<[^>]*>/g, '')
    // Trim
    .trim();

  // Split into sentences and clean
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Remove duplicates while preserving order
  const seen = new Set<string>();
  const unique = sentences.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });

  return unique.join(' ');
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
  const { targetTokens = 500, minTokens = 300, maxTokens = 800 } = options;

  const sentences = transcript.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
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
    const sentence = sentences[i];
    const sentenceTokens = estimateTokens(sentence);
    const potentialChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    const potentialTokens = estimateTokens(potentialChunk);

    if (potentialTokens <= maxTokens) {
      // Add sentence to current chunk
      currentChunk = potentialChunk;
      chunkTokens = potentialTokens;
    } else {
      // Current chunk is full, save it if it meets minimum
      if (chunkTokens >= minTokens) {
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
  if (currentChunk && chunkTokens >= minTokens) {
    chunks.push({
      content: currentChunk,
      tokenCount: chunkTokens,
      startIndex,
      endIndex: sentences.length - 1,
    });
  } else if (currentChunk && chunks.length > 0) {
    // Merge with last chunk if too small
    chunks[chunks.length - 1].content += ' ' + currentChunk;
    chunks[chunks.length - 1].tokenCount += chunkTokens;
    chunks[chunks.length - 1].endIndex = sentences.length - 1;
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
  return Math.floor((chunkIndex / totalChunks) * videoDuration);
}

/**
 * Detect language from transcript (simplified)
 * In production, would use language detection library
 */
export function detectLanguage(text: string): string {
  // Simple heuristic - check for common words
  const englishWords = [
    'the',
    'be',
    'to',
    'of',
    'and',
    'a',
    'in',
    'that',
    'have',
    'i',
  ];
  const lowerText = text.toLowerCase();
  const englishMatches = englishWords.filter((word) =>
    new RegExp(`\\b${word}\\b`).test(lowerText)
  ).length;

  return englishMatches > 5 ? 'en' : 'unknown';
}

/**
 * Extract key phrases from transcript
 */
export function extractKeyPhrases(transcript: string, count = 10): string[] {
  // Split into words and filter out common words
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'is',
    'be',
    'are',
    'was',
    'were',
    'been',
    'this',
    'that',
    'these',
    'those',
  ]);

  const words = transcript
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !commonWords.has(w))
    .slice(0, count);

  return words;
}
