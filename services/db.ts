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

export const saveDailyData = async (items: MarketItem[]) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const item of items) {
    await store.add(item);
  }
  await tx.done;
};

export interface QueryParams {
  startDate?: string;
  endDate?: string;
  region?: string;
  entityKeyword?: string;
  category?: Category;
}

export const queryMarketData = async (params: QueryParams): Promise<MarketItem[]> => {
  const db = await initDB();
  const allItems = await db.getAll(STORE_NAME);

  return allItems.filter(item => {
    let match = true;
    if (params.startDate && item.date < params.startDate) match = false;
    if (params.endDate && item.date > params.endDate) match = false;
    if (params.category && item.category !== params.category) match = false;
    if (params.region && !item.region.includes(params.region)) match = false;
    if (params.entityKeyword) {
      const keyword = params.entityKeyword.toLowerCase();
      const entity = (item.entity || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      if (!entity.includes(keyword) && !title.includes(keyword)) match = false;
    }
    return match;
  }).sort((a, b) => b.date.localeCompare(a.date));
};

export const getMissingCategoriesForDate = async (date: string): Promise<Category[]> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.store.index('by-date');
  const items = await index.getAll(date);
  
  const categoriesPresent = new Set(items.map(i => i.category));
  return Object.values(Category).filter(cat => !categoriesPresent.has(cat));
};
