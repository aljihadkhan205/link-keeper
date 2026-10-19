export interface LinkItem {
  id: string;
  name: string;
  url: string;
  note?: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

export type SortOption = 'recent_viewed' | 'recent_added' | 'oldest_added' | 'alphabetical';

export type ViewMode = 'grid' | 'list';

export type MainTab = 'all' | 'recent_viewed' | 'recent_added' | 'favorites';

export interface FilterState {
  search: string;
  category: string;
  favoriteOnly: boolean;
  sort: SortOption;
  viewMode: ViewMode;
  mainTab: MainTab;
}
