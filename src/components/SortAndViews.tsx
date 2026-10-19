import React from 'react';
import { LayoutGrid, List, ArrowUpDown, Clock, Calendar, Star, Sparkles } from 'lucide-react';
import { SortOption, ViewMode, MainTab } from '../types.js';

interface SortAndViewsProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  favoritesCount: number;
}

export const SortAndViews: React.FC<SortAndViewsProps> = ({
  activeTab,
  onTabChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  favoritesCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
      {/* Main Navigation Segmented Buttons */}
      <div className="flex items-center gap-1 p-1 bg-[#15191C] border border-[#22282C] rounded-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-[#1B2023] text-[#F5F7F4] border border-[#323A40] shadow-sm'
              : 'text-[#929A96] hover:text-[#F5F7F4]'
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => onTabChange('recent_viewed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'recent_viewed'
              ? 'bg-[#1B2023] text-[#D7FF64] border border-[#323A40] shadow-sm'
              : 'text-[#929A96] hover:text-[#F5F7F4]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Recently Viewed</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('recent_added')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'recent_added'
              ? 'bg-[#1B2023] text-[#F5F7F4] border border-[#323A40] shadow-sm'
              : 'text-[#929A96] hover:text-[#F5F7F4]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Recently Added</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('favorites')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'favorites'
              ? 'bg-[#1B2023] text-[#D7FF64] border border-[#323A40] shadow-sm'
              : 'text-[#929A96] hover:text-[#F5F7F4]'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Favorites</span>
          {favoritesCount > 0 && (
            <span className="font-mono text-[10px] opacity-80 tabular-nums">
              ({favoritesCount})
            </span>
          )}
        </button>
      </div>

      {/* Right controls: Sort Dropdown and View Toggle */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {/* Sort selector */}
        <div className="flex items-center gap-1.5 bg-[#15191C] border border-[#22282C] px-2.5 py-1.5 rounded-lg text-xs text-[#929A96]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#929A96]" />
          <span className="hidden md:inline text-[11px]">Sort:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-xs text-[#F5F7F4] focus:outline-none cursor-pointer pr-1"
          >
            <option value="recent_viewed" className="bg-[#15191C] text-[#F5F7F4]">
              Recently Viewed
            </option>
            <option value="recent_added" className="bg-[#15191C] text-[#F5F7F4]">
              Recently Added
            </option>
            <option value="oldest_added" className="bg-[#15191C] text-[#F5F7F4]">
              Oldest Added
            </option>
            <option value="alphabetical" className="bg-[#15191C] text-[#F5F7F4]">
              Alphabetical (A-Z)
            </option>
          </select>
        </div>

        {/* View Mode Toggle: Grid vs List */}
        <div className="flex items-center p-1 bg-[#15191C] border border-[#22282C] rounded-lg">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Grid card view"
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#1B2023] text-[#D7FF64]'
                : 'text-[#929A96] hover:text-[#F5F7F4]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="Compact list row view"
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-[#1B2023] text-[#D7FF64]'
                : 'text-[#929A96] hover:text-[#F5F7F4]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
