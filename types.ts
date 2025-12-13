export enum Category {
  TRADING = '数据交易',
  TENDER = '招标信息',
  BID_WIN = '中标信息',
  DEMAND = '市场需求',
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// Structured Item for Database and Display
export interface MarketItem {
  id?: number; // DB ID
  category: Category;
  date: string; // YYYY-MM-DD
  title: string;
  region: string;
  entity: string; // Subject (e.g., Company, Gov body)
  amount: string;
  summary: string; // Contains [n] citation markers
  sourceIndices: number[]; // Array of indices mapping to GroundingSource
  sources?: GroundingSource[]; // The actual source objects (Title/URI) for persistence
}

export interface SearchResult {
  items: MarketItem[];
  sources: GroundingSource[];
  timestamp: string;
}

export interface IntelligenceState {
  [Category.TRADING]: SearchResult | null;
  [Category.TENDER]: SearchResult | null;
  [Category.BID_WIN]: SearchResult | null;
  [Category.DEMAND]: SearchResult | null;
}

export interface FetchStatus {
  loading: boolean;
  error: string | null;
}

export type ViewMode = 'dashboard' | 'search';