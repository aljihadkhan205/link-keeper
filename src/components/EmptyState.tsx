import React from 'react';
import { Bookmark, SearchX, Star, Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'search' | 'favorites' | 'category' | 'empty';
  searchQuery?: string;
  categoryName?: string;
  onClearSearch?: () => void;
  onAddClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  categoryName,
  onClearSearch,
  onAddClick,
}) => {
  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#15191C] border border-[#22282C] rounded-2xl my-6">
        <div className="w-12 h-12 rounded-xl bg-[#1B2023] border border-[#22282C] flex items-center justify-center text-[#929A96] mb-4">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#F5F7F4]">No links found</h3>
        <p className="text-xs text-[#929A96] mt-1 max-w-sm">
          No saved links matched your search for &quot;<span className="text-[#F5F7F4]">{searchQuery}</span>&quot;. Try checking for typos or searching by domain.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-4 px-3.5 py-1.5 text-xs font-medium text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] rounded-lg transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  if (type === 'favorites') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#15191C] border border-[#22282C] rounded-2xl my-6">
        <div className="w-12 h-12 rounded-xl bg-[#1B2023] border border-[#22282C] flex items-center justify-center text-[#D7FF64] mb-4">
          <Star className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#F5F7F4]">No favorites yet</h3>
        <p className="text-xs text-[#929A96] mt-1 max-w-sm">
          Click the star icon on any link card to pin your most frequently visited bookmarks here.
        </p>
      </div>
    );
  }

  if (type === 'category') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#15191C] border border-[#22282C] rounded-2xl my-6">
        <div className="w-12 h-12 rounded-xl bg-[#1B2023] border border-[#22282C] flex items-center justify-center text-[#929A96] mb-4">
          <Bookmark className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#F5F7F4]">No links in {categoryName}</h3>
        <p className="text-xs text-[#929A96] mt-1 max-w-sm">
          Add your first bookmark to this category to keep your collection organized.
        </p>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#15191C] border border-[#22282C] rounded-2xl my-6">
      <div className="w-12 h-12 rounded-xl bg-[#D7FF64]/10 border border-[#D7FF64]/20 flex items-center justify-center text-[#D7FF64] mb-4">
        <Bookmark className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#F5F7F4]">Welcome to Link Keeper</h3>
      <p className="text-xs text-[#929A96] mt-1 max-w-md leading-relaxed">
        Your personal library for saving website URLs, developer docs, AI tools, and references with instant search and recently viewed tracking.
      </p>
      {onAddClick && (
        <button
          type="button"
          onClick={onAddClick}
          className="mt-5 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] active:scale-[0.98] rounded-lg transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Save Your First Link</span>
        </button>
      )}
    </div>
  );
};
