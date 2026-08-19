import { NewsArticle } from '../types';

/**
 * Average adult reading speed in words per minute.
 */
const WORDS_PER_MINUTE = 200;

/**
 * Calculates estimated reading time in minutes for a given text or article object.
 * Uses standard average reading speed of 200 words per minute.
 */
export function calculateReadingTime(article: NewsArticle): number {
  if (article.readTimeMinutes && article.readTimeMinutes > 0) {
    return article.readTimeMinutes;
  }

  let textToMeasure = `${article.title || ''} ${article.description || ''} ${article.contentSnippet || ''}`;
  if (article.aiSummary?.whyItMatters) {
    textToMeasure += ` ${article.aiSummary.whyItMatters}`;
  }
  if (article.aiSummary?.bulletPoints) {
    textToMeasure += ` ${article.aiSummary.bulletPoints.join(' ')}`;
  }

  const wordCount = textToMeasure.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/**
 * Formats estimated reading time as a user-friendly string (e.g. "2 min read", "1 min read").
 */
export function formatReadingTime(article: NewsArticle): string {
  const minutes = calculateReadingTime(article);
  return `${minutes} min read`;
}
