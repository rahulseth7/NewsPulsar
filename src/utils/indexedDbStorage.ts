import { NewsArticle, ViralVideo } from '../types';

const DB_NAME = 'NewsPulse_ScrapedDatabase';
const DB_VERSION = 2;
const STORE_NAME = 'scraped_articles';
const VIDEO_STORE_NAME = 'scraped_viral_videos';

/**
 * Opens or initializes the IndexedDB database for NewsPulse articles & viral videos.
 */
function openNewsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('pubDate', 'pubDate', { unique: false });
      }

      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        const vStore = db.createObjectStore(VIDEO_STORE_NAME, { keyPath: 'id' });
        vStore.createIndex('category', 'category', { unique: false });
        vStore.createIndex('platform', 'platform', { unique: false });
        vStore.createIndex('pubDate', 'pubDate', { unique: false });
        vStore.createIndex('viralScore', 'viralScore', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Saves or updates articles in IndexedDB in a single transaction.
 * Never deletes existing articles; merges cumulatively.
 */
export async function saveArticlesToIndexedDb(articles: NewsArticle[]): Promise<void> {
  if (!Array.isArray(articles) || articles.length === 0) return;
  try {
    const db = await openNewsDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      articles.forEach((art) => {
        if (art && art.id) {
          store.put(art);
        }
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save articles to IndexedDB:', err);
  }
}

/**
 * Loads all accumulated scraped articles from IndexedDB.
 */
export async function loadArticlesFromIndexedDb(): Promise<NewsArticle[]> {
  try {
    const db = await openNewsDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as NewsArticle[];
        if (Array.isArray(results)) {
          // Sort by pubDate descending
          results.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          resolve(results);
        } else {
          resolve([]);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to load articles from IndexedDB:', err);
    return [];
  }
}

/**
 * Gets total article count from IndexedDB.
 */
export async function getArticleCountFromIndexedDb(): Promise<number> {
  try {
    const db = await openNewsDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result || 0);
      };

      request.onerror = () => {
        resolve(0);
      };
    });
  } catch {
    return 0;
  }
}

/**
 * Saves viral videos in IndexedDB.
 */
export async function saveViralVideosToIndexedDb(videos: ViralVideo[]): Promise<void> {
  if (!Array.isArray(videos) || videos.length === 0) return;
  try {
    const db = await openNewsDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE_NAME);

      videos.forEach((vid) => {
        if (vid && vid.id) {
          store.put(vid);
        }
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save viral videos to IndexedDB:', err);
  }
}

/**
 * Loads all viral videos from IndexedDB.
 */
export async function loadViralVideosFromIndexedDb(): Promise<ViralVideo[]> {
  try {
    const db = await openNewsDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as ViralVideo[];
        if (Array.isArray(results)) {
          results.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
          resolve(results);
        } else {
          resolve([]);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to load viral videos from IndexedDB:', err);
    return [];
  }
}

/**
 * Gets total viral videos count from IndexedDB.
 */
export async function getViralVideosCountFromIndexedDb(): Promise<number> {
  try {
    const db = await openNewsDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result || 0);
      };

      request.onerror = () => {
        resolve(0);
      };
    });
  } catch {
    return 0;
  }
}
