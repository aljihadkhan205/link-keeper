import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.js';
import { CategoryFilter } from './components/CategoryFilter.js';
import { SortAndViews } from './components/SortAndViews.js';
import { LinkCard } from './components/LinkCard.js';
import { AddLinkModal } from './components/AddLinkModal.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';
import { ExportModal } from './components/ExportModal.js';
import { AccessModal } from './components/AccessModal.js';
import { EmptyState } from './components/EmptyState.js';
import {
  LinkItem,
  CategoryItem,
  SortOption,
  ViewMode,
  MainTab,
} from './types.js';
import {
  fetchLinks,
  createLink,
  updateLink,
  deleteLink,
  recordLinkView,
  fetchCategories,
  createCategory,
  checkAuthStatus,
  loginWithPin,
  logout,
  onAuthRequired,
  ApiError,
} from './lib/api.js';
import { getHostname, getFaviconUrl } from './lib/favicon.js';
import { Loader2, Clock, Lock, KeyRound, ShieldAlert, AlertCircle } from 'lucide-react';

export default function App() {
  // Main Data States
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalLinks, setTotalLinks] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Layout State
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Links');
  const [activeTab, setActiveTab] = useState<MainTab>('all');
  const [sort, setSort] = useState<SortOption>('recent_viewed');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('lk_view_mode') as ViewMode) || 'grid';
    } catch {
      return 'grid';
    }
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Lock screen direct PIN input state
  const [lockPin, setLockPin] = useState<string>('');
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockSubmitting, setLockSubmitting] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Prevent duplicate view tracking within 3 seconds for the same link
  const recentViewTrackedMap = useRef<Map<string, number>>(new Map());

  // Save viewMode preference in localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('lk_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Check Auth & Initial Load
  const checkAuth = useCallback(async () => {
    try {
      const status = await checkAuthStatus();
      setIsAuthenticated(status.authenticated);
      return status.authenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setAuthChecking(false);
    }
  }, []);

  const loadSeq = useRef(0);
  const loadData = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    try {
      let querySort: SortOption = sort;
      let favoriteOnly = false;

      if (activeTab === 'recent_viewed') {
        querySort = 'recent_viewed';
      } else if (activeTab === 'recent_added') {
        querySort = 'recent_added';
      } else if (activeTab === 'favorites') {
        favoriteOnly = true;
      }

      const [linksRes, categoriesRes] = await Promise.all([
        fetchLinks({
          search: search.trim() || undefined,
          category: selectedCategory !== 'All Links' ? selectedCategory : undefined,
          favorite: favoriteOnly,
          sort: querySort,
        }),
        fetchCategories(),
      ]);

      if (seq !== loadSeq.current) return; // a newer request superseded this one
      setLinks(linksRes.links);
      setTotalLinks(linksRes.total);
      setFavoritesCount(linksRes.favoritesCount);
      setCategories(categoriesRes.categories);
    } catch (err: unknown) {
      if (seq !== loadSeq.current) return;
      if (err instanceof ApiError && err.status === 401) {
        setIsAuthenticated(false);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [search, selectedCategory, activeTab, sort]);

  useEffect(() => {
    const unsub = onAuthRequired(() => {
      setIsAuthenticated(false);
    });
    return unsub;
  }, []);

  // 1) Check auth once on mount
  useEffect(() => {
    checkAuth().then((authed) => {
      if (!authed) setLoading(false);
    });
  }, [checkAuth]);

  // 2) (Re)load data whenever filters change - only once authenticated; search is debounced
  useEffect(() => {
    if (!isAuthenticated) return;
    const delay = search ? 250 : 0;
    const t = setTimeout(() => {
      loadData();
    }, delay);
    return () => clearTimeout(t);
  }, [isAuthenticated, loadData, search]);

  // Handle Tab Switch
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    if (tab === 'recent_viewed') {
      setSort('recent_viewed');
    } else if (tab === 'recent_added') {
      setSort('recent_added');
    }
  };

  // Picking a sort option from the dropdown means "show everything in this order"
  const handleSortChange = (next: SortOption) => {
    setSort(next);
    if (activeTab === 'recent_viewed' || activeTab === 'recent_added') {
      setActiveTab('all');
    }
  };

  // Open link handler with Recently Viewed update
  const handleOpenLink = async (link: LinkItem) => {
    const now = Date.now();
    const lastTracked = recentViewTrackedMap.current.get(link.id) || 0;

    // Open link in new tab with security attributes
    window.open(link.url, '_blank', 'noopener,noreferrer');
    trackView(link, now, lastTracked);
  };

  const trackView = (link: LinkItem, now: number, lastTracked: number) => {
    // Throttled view event tracking
    if (now - lastTracked > 3000) {
      recentViewTrackedMap.current.set(link.id, now);

      const timestamp = new Date().toISOString();

      // Optimistic update in UI
      setLinks((prev) => {
        const updated = prev.map((item) =>
          item.id === link.id ? { ...item, lastViewedAt: timestamp } : item
        );

        // If currently in recent_viewed sort or tab, move this item to the top immediately!
        if (sort === 'recent_viewed') {
          const itemIndex = updated.findIndex((i) => i.id === link.id);
          if (itemIndex > -1) {
            const [movedItem] = updated.splice(itemIndex, 1);
            return [movedItem, ...updated];
          }
        }
        return updated;
      });

      // Background persist to Turso SQLite database
      recordLinkView(link.id).catch((err) => {
        console.warn('View tracking sync failed (link opened regardless):', err);
      });
    }
  };

  // Favorite toggle handler with optimistic UI update
  const handleToggleFavorite = async (link: LinkItem) => {
    const newStatus = !link.isFavorite;

    // Optimistic update
    setLinks((prev) =>
      prev.map((item) => (item.id === link.id ? { ...item, isFavorite: newStatus } : item))
    );
    setFavoritesCount((prev) => Math.max(0, prev + (newStatus ? 1 : -1)));

    try {
      await updateLink(link.id, { isFavorite: newStatus });
      showToast(newStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      // Revert on error
      setLinks((prev) =>
        prev.map((item) => (item.id === link.id ? { ...item, isFavorite: !newStatus } : item))
      );
      setFavoritesCount((prev) => Math.max(0, prev + (newStatus ? -1 : 1)));
      showToast('Failed to update favorite status');
    }
  };

  // Save (Add or Edit) Link
  const handleSaveLink = async (payload: {
    name: string;
    url: string;
    note?: string;
    category?: string;
    isFavorite?: boolean;
  }) => {
    if (editingLink) {
      // Edit mode
      await updateLink(editingLink.id, payload);
      showToast('Link updated successfully');
    } else {
      // Add mode
      await createLink(payload);
      showToast('Link saved to Link Keeper');
    }
    // Reload so ordering, filters, counts and categories all match the server
    await loadData();
  };

  // Delete Link
  const handleDeleteConfirm = async () => {
    if (!deletingLink) return;
    try {
      await deleteLink(deletingLink.id);
      setLinks((prev) => prev.filter((i) => i.id !== deletingLink.id));
      setTotalLinks((prev) => Math.max(0, prev - 1));
      if (deletingLink.isFavorite) {
        setFavoritesCount((prev) => Math.max(0, prev - 1));
      }
      showToast('Link deleted');
      setDeletingLink(null);
      // Refresh categories count
      fetchCategories().then((res) => setCategories(res.categories)).catch(() => {});
    } catch {
      showToast('Failed to delete link');
    }
  };

  // Add Category
  const handleAddCategory = async (name: string) => {
    const res = await createCategory(name);
    setCategories((prev) =>
      prev.some((c) => c.name === res.category.name) ? prev : [...prev, res.category]
    );
    setSelectedCategory(res.category.name);
    showToast(`Category "${res.category.name}" created`);
  };

  // Login handler
  const handleLogin = async (pin: string) => {
    await loginWithPin(pin);
    setIsAuthenticated(true);
    setLockError(null);
    setLockPin('');
    showToast('Link Keeper unlocked');
  };

  // Lock screen direct submit
  const handleLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockPin.trim()) {
      setLockError('Please enter your personal access PIN');
      return;
    }
    setLockSubmitting(true);
    setLockError(null);
    try {
      await handleLogin(lockPin.trim());
    } catch (err: unknown) {
      setLockError(err instanceof Error ? err.message : 'Invalid access PIN');
    } finally {
      setLockSubmitting(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setLinks([]);
    showToast('Session locked');
  };

  // Recently Viewed subset for quick carousel/row in "all" tab
  const recentlyViewedSubset = links
    .filter((l) => Boolean(l.lastViewedAt))
    .sort((a, b) => new Date(b.lastViewedAt!).getTime() - new Date(a.lastViewedAt!).getTime())
    .slice(0, 4);

  // Initial loading state before auth check completes
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] flex flex-col items-center justify-center text-[#929A96]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF64] mb-3" />
        <p className="text-xs font-mono">Initializing Link Keeper...</p>
      </div>
    );
  }

  // Locked Screen when unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] text-[#F5F7F4] flex flex-col justify-center items-center p-4 antialiased">
        <div className="w-full max-w-sm bg-[#15191C] border border-[#22282C] rounded-2xl p-7 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#D7FF64]/10 border border-[#D7FF64]/20 flex items-center justify-center text-[#D7FF64] mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-[#F5F7F4] tracking-tight">Link Keeper</h1>
            <p className="text-xs text-[#929A96] mt-1">Enter your personal access PIN to unlock</p>
          </div>

          <form onSubmit={handleLockSubmit} className="space-y-4">
            {lockError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#929A96] mb-1.5">
                Access PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929A96]" />
                <input
                  type="password"
                  autoFocus
                  value={lockPin}
                  onChange={(e) => setLockPin(e.target.value)}
                  placeholder="••••••••"
                  disabled={lockSubmitting}
                  className="w-full bg-[#111416] text-sm text-[#F5F7F4] placeholder-[#929A96]/40 pl-10 pr-3.5 py-2.5 rounded-lg border border-[#22282C] focus:outline-none focus:border-[#D7FF64] transition-colors font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={lockSubmitting || !lockPin.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] active:scale-[0.98] disabled:opacity-50 rounded-lg transition-all shadow-sm"
            >
              {lockSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <span>Unlock Link Keeper</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#F5F7F4] flex flex-col antialiased">
      {/* Top Header */}
      <Header
        search={search}
        onSearchChange={setSearch}
        totalLinks={totalLinks}
        favoritesCount={favoritesCount}
        onAddClick={() => {
          setEditingLink(null);
          setIsAddModalOpen(true);
        }}
        onExportClick={() => setIsExportModalOpen(true)}
        isAuthenticated={isAuthenticated}
        onAuthClick={() => setIsAccessModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Category Filter Pills / Bar */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={handleAddCategory}
          totalLinks={totalLinks}
        />

        {/* View & Sort Controls */}
        <SortAndViews
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sort={sort}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          favoritesCount={favoritesCount}
        />

        {/* Quick "Recently Viewed" Strip (when viewing All Links with no active search) */}
        {activeTab === 'all' && sort !== 'recent_viewed' && !search && selectedCategory === 'All Links' && recentlyViewedSubset.length > 0 && (
          <section className="p-4 bg-[#111416] border border-[#22282C] rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D7FF64]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#F5F7F4]">
                  Recently Viewed
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('recent_viewed')}
                className="text-xs text-[#D7FF64] hover:underline"
              >
                View all history →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentlyViewedSubset.map((item) => {
                const host = getHostname(item.url);
                return (
                  <div
                    key={`recent_${item.id}`}
                    onClick={() => handleOpenLink(item)}
                    className="flex items-center gap-3 p-2.5 bg-[#15191C] hover:bg-[#1B2023] border border-[#22282C] hover:border-[#323A40] rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0B0D0F] border border-[#22282C] flex items-center justify-center shrink-0">
                      <img
                        src={getFaviconUrl(item.url)}
                        alt=""
                        className="w-4 h-4 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-[#F5F7F4] truncate group-hover:text-[#D7FF64] transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-[#929A96] font-mono truncate block">
                        {host}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-[#929A96]">
            <Loader2 className="w-8 h-8 animate-spin text-[#D7FF64] mb-3" />
            <p className="text-xs font-mono">Loading saved bookmarks...</p>
          </div>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && links.length === 0 && (
          <EmptyState
            type={
              search
                ? 'search'
                : activeTab === 'favorites'
                ? 'favorites'
                : selectedCategory !== 'All Links'
                ? 'category'
                : 'empty'
            }
            searchQuery={search}
            categoryName={selectedCategory}
            onClearSearch={() => setSearch('')}
            onAddClick={() => {
              setEditingLink(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {/* Links Grid or List */}
        {!loading && !error && links.length > 0 && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5'
                : 'space-y-2'
            }
          >
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                viewMode={viewMode}
                onOpen={handleOpenLink}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(item) => {
                  setEditingLink(item);
                  setIsAddModalOpen(true);
                }}
                onDelete={(item) => setDeletingLink(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Link Modal */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        editLink={editingLink}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingLink)}
        title="Delete Saved Link"
        message="Are you sure you want to delete this bookmark? This action cannot be undone."
        itemName={deletingLink ? `${deletingLink.name} (${deletingLink.url})` : undefined}
        confirmLabel="Delete Link"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingLink(null)}
      />

      {/* Export & Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalLinks={totalLinks}
      />

      {/* Private Access Modal */}
      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={() => setIsAccessModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1B2023] text-[#F5F7F4] border border-[#323A40] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-[#D7FF64]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
