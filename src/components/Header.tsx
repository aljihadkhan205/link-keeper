import React from 'react';
import { Bookmark, Plus, Search, X, Download, ShieldCheck, ShieldAlert, LogOut } from 'lucide-react';

interface HeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  totalLinks: number;
  favoritesCount: number;
  onAddClick: () => void;
  onExportClick: () => void;
  isAuthenticated: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  search,
  onSearchChange,
  totalLinks,
  favoritesCount,
  onAddClick,
  onExportClick,
  isAuthenticated,
  onAuthClick,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0B0D0F]/90 backdrop-blur-md border-b border-[#22282C] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand Identity & Quick Stats */}
        <div className="flex items-center justify-between md:justify-start gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D7FF64] flex items-center justify-center text-[#0B0D0F] shadow-sm">
              <Bookmark className="w-4 h-4 fill-[#0B0D0F]" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#F5F7F4] whitespace-nowrap">
                Link Keeper
              </span>
            </div>
          </div>

          {/* Quick Counter (Zero-pill text styling) */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-[#929A96] font-mono border-l border-[#22282C] pl-4">
            <span>
              <strong className="text-[#F5F7F4] tabular-nums font-semibold">{totalLinks}</strong> links
            </span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>
              <strong className="text-[#D7FF64] tabular-nums font-semibold">{favoritesCount}</strong> favorites
            </span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929A96]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search links, URLs, notes, categories..."
            className="w-full bg-[#15191C] text-sm text-[#F5F7F4] placeholder-[#929A96]/60 pl-10 pr-10 py-2 rounded-lg border border-[#22282C] focus:outline-none focus:border-[#D7FF64] focus:ring-1 focus:ring-[#D7FF64] transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929A96] hover:text-[#F5F7F4] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={onExportClick}
            title="Export links as JSON / Backup options"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#F5F7F4] bg-[#15191C] hover:bg-[#1B2023] border border-[#22282C] hover:border-[#323A40] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#929A96]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Security status / Lock toggle */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onLogout}
              title="Session unlocked (Click to lock Link Keeper)"
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[#929A96] hover:text-red-400 bg-[#15191C] hover:bg-[#1B2023] border border-[#22282C] rounded-lg transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF64]" />
              <LogOut className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onAuthClick}
              title="Locked (Click to enter personal access PIN)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg hover:bg-amber-400/20 transition-colors whitespace-nowrap"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Unlock</span>
            </button>
          )}

          {/* Primary Add Link CTA */}
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] active:scale-[0.98] rounded-lg transition-all shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Link</span>
          </button>
        </div>
      </div>
    </header>
  );
};
