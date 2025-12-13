import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { MarketItem, Category } from '../types';

interface MarketDB extends DBSchema {
  market_items: {
    key: number;
    value: MarketItem;
    indexes: { 'by-date': string; 'by-category': string; 'by-region': string };
  };
}

const DB_NAME = 'DataNexusDB';
const STORE_NAME = 'market_items';

// Initialize DB
const initDB = async (): Promise<IDBPDatabase<MarketDB>> => {
  return openDB<MarketDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
        store.createIndex('by-category', 'category');
        store.createIndex('by-region', 'region');
      }
    },
  });
};

// Save a batch of items for a specific day
// This effectively acts as "writing to that day's table"
export const saveDailyData = async (items: MarketItem[]) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  // Strategy: We don't overwrite blindly, we append. 
  // In a real app, we might want to deduplicate based on Title + Date.
  for (const item of items) {
    // Simple check to avoid exact duplicates on the same day if re-fetched
    const index = store.index('by-date');
    let exists = false;
    
    // Performance note: In a real backend, we'd do a count query or unique constraint.
    // For client-side simulation, we just add them.
    await store.add(item);
  }
  await tx.done;
};

// Query Filters
export interface QueryParams {
  startDate?: string;
  endDate?: string;
  region?: string;
  entityKeyword?: string; // Fuzzy match for "Subject"
  category?: Category;
}

export const queryMarketData = async (params: QueryParams): Promise<MarketItem[]> => {
  const db = await initDB();
  const allItems = await db.getAll(STORE_NAME); // Get all and filter in memory (IndexedDB complex queries are verbose)

  return allItems.filter(item => {
    let match = true;

    // Date Range
    if (params.startDate && item.date < params.startDate) match = false;
    if (params.endDate && item.date > params.endDate) match = false;

    // Category
    if (params.category && item.category !== params.category) match = false;

    // Region (Exact or Partial)
    if (params.region && !item.region.includes(params.region)) match = false;

    // Entity (Fuzzy)
    if (params.entityKeyword) {
      const keyword = params.entityKeyword.toLowerCase();
      const entity = (item.entity || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      if (!entity.includes(keyword) && !title.includes(keyword)) {
        match = false;
      }
    }

    return match;
  }).sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first
};

// Helper to check if we already have data for a specific date/category locally
// to avoid API calls (optional optimization)
export const hasDataForDate = async (date: string, category: Category): Promise<boolean> => {
  const db = await initDB();
  const index = db.transaction(STORE_NAME).store.index('by-date');
  const items = await index.getAll(date);
  return items.some(i => i.category === category);
};
