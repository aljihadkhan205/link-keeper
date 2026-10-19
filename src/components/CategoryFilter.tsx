import React, { useState } from 'react';
import { Plus, Check, X, FolderPlus } from 'lucide-react';
import { CategoryItem } from '../types.js';

interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (catName: string) => void;
  onAddCategory: (newCategoryName: string) => Promise<void>;
  totalLinks: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  totalLinks,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      await onAddCategory(trimmed);
      setNewCatName('');
      setIsAdding(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {/* All Links Option */}
        <button
          type="button"
          onClick={() => onSelectCategory('All Links')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedCategory === 'All Links' || !selectedCategory
              ? 'bg-[#D7FF64] text-[#0B0D0F] font-semibold'
              : 'text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#15191C] border border-[#22282C]'
          }`}
        >
          <span>All Links</span>
          <span className="font-mono text-[11px] opacity-80 tabular-nums">({totalLinks})</span>
        </button>

        {/* Existing Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#D7FF64] text-[#0B0D0F] font-semibold'
                  : 'text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#15191C] border border-[#22282C]'
              }`}
            >
              <span>{cat.name}</span>
              <span className="font-mono text-[11px] opacity-80 tabular-nums">({cat.count})</span>
            </button>
          );
        })}

        {/* Inline Create Category Form or Button */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              disabled={loading}
              className="bg-[#15191C] text-xs text-[#F5F7F4] border border-[#D7FF64] px-2.5 py-1.5 rounded-lg focus:outline-none w-32"
            />
            <button
              type="submit"
              disabled={loading || !newCatName.trim()}
              className="p-1.5 bg-[#D7FF64] text-[#0B0D0F] rounded-lg disabled:opacity-50 hover:bg-[#c4f34d]"
              title="Save Category"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewCatName('');
                setError(null);
              }}
              className="p-1.5 text-[#929A96] hover:text-[#F5F7F4] rounded-lg"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#929A96] hover:text-[#D7FF64] hover:bg-[#15191C] border border-dashed border-[#22282C] rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Create custom category"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Category</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};
