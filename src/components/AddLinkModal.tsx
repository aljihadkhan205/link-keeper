import React, { useState, useEffect } from 'react';
import { X, Globe, Star, Sparkles, Loader2, Link as LinkIcon, Plus, BellRing } from 'lucide-react';
import { LinkItem, CategoryItem } from '../types.js';
import { localDateString } from '../../shared/date.js';
import { normalizeAndValidateUrl, deriveFallbackName } from '../../shared/url.js';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    url: string;
    note?: string;
    category?: string;
    isFavorite?: boolean;
    remindAt?: string | null;
  }) => Promise<void>;
  editLink?: LinkItem | null;
  categories: CategoryItem[];
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editLink,
  categories,
}) => {
  const isEditing = Boolean(editLink);

  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Other');
  const [customCategory, setCustomCategory] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [remindAt, setRemindAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editLink) {
      setUrl(editLink.url);
      setName(editLink.name);
      setNote(editLink.note || '');
      setCategory(editLink.category || 'Other');
      setCustomCategory('');
      setIsFavorite(editLink.isFavorite);
      setRemindAt(editLink.remindAt || '');
    } else {
      setUrl('');
      setName('');
      setNote('');
      setCategory(categories.some((c) => c.name === 'Other') ? 'Other' : categories[0]?.name || 'Other');
      setCustomCategory('');
      setIsFavorite(false);
      setRemindAt('');
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens / target changes, not when categories refresh
  }, [editLink, isOpen]);

  if (!isOpen) return null;

  // Auto-derive fallback name when URL loses focus or changes, if name is currently blank
  const handleUrlBlur = () => {
    if (!name.trim() && url.trim()) {
      const derived = deriveFallbackName(url.trim());
      if (derived && derived !== 'Website') {
        setName(derived);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    // Validate URL
    const urlValidation = normalizeAndValidateUrl(url);
    if (!urlValidation.valid || !urlValidation.normalizedUrl) {
      newErrors.url = urlValidation.error || 'Please enter a valid HTTP or HTTPS URL';
    }

    // Validate Name
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Website name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() || 'Other' : category;

    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        url: urlValidation.normalizedUrl!,
        note: note.trim() || undefined,
        category: finalCategory,
        isFavorite,
        remindAt: remindAt || null,
      });
      onClose();
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save link' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#15191C] border border-[#22282C] rounded-2xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#22282C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D7FF64]/10 border border-[#D7FF64]/20 flex items-center justify-center text-[#D7FF64]">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F7F4]">
                {isEditing ? 'Edit Link' : 'Add New Link'}
              </h2>
              <p className="text-xs text-[#929A96]">
                {isEditing ? 'Update your saved website details' : 'Save a bookmark to your personal collection'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#1B2023] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errors.form && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {errors.form}
            </div>
          )}

          {/* URL Field */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F7F4] mb-1.5">
              Website URL <span className="text-[#D7FF64]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus={!isEditing}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com"
                className={`w-full bg-[#111416] text-sm text-[#F5F7F4] placeholder-[#929A96]/50 px-3.5 py-2.5 rounded-lg border focus:outline-none transition-colors ${
                  errors.url ? 'border-red-500 focus:border-red-500' : 'border-[#22282C] focus:border-[#D7FF64]'
                }`}
              />
            </div>
            {errors.url && <p className="text-xs text-red-400 mt-1">{errors.url}</p>}
          </div>

          {/* Website Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#F5F7F4]">
                Website Name <span className="text-[#D7FF64]">*</span>
              </label>
              {url && !name && (
                <button
                  type="button"
                  onClick={() => setName(deriveFallbackName(url))}
                  className="text-[11px] text-[#D7FF64] hover:underline"
                >
                  Auto-fill name
                </button>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GitHub, Tailwind Docs, Figma"
              className={`w-full bg-[#111416] text-sm text-[#F5F7F4] placeholder-[#929A96]/50 px-3.5 py-2.5 rounded-lg border focus:outline-none transition-colors ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#22282C] focus:border-[#D7FF64]'
              }`}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F7F4] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#111416] text-sm text-[#F5F7F4] px-3.5 py-2.5 rounded-lg border border-[#22282C] focus:outline-none focus:border-[#D7FF64] transition-colors cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name} className="bg-[#15191C] text-[#F5F7F4]">
                  {c.name}
                </option>
              ))}
              <option value="__custom__" className="bg-[#15191C] text-[#D7FF64]">
                + Add Custom Category...
              </option>
            </select>

            {category === '__custom__' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter new category name"
                className="mt-2 w-full bg-[#111416] text-sm text-[#F5F7F4] placeholder-[#929A96]/50 px-3.5 py-2 rounded-lg border border-[#D7FF64] focus:outline-none"
              />
            )}
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F7F4] mb-1.5">
              Note / Description <span className="text-[#929A96] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you saved this link or key information to remember..."
              className="w-full bg-[#111416] text-sm text-[#F5F7F4] placeholder-[#929A96]/50 px-3.5 py-2.5 rounded-lg border border-[#22282C] focus:outline-none focus:border-[#D7FF64] transition-colors resize-none"
            />
          </div>

          {/* Reminder date */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F7F4] mb-1.5">
              <BellRing className="w-3.5 h-3.5 text-[#D7FF64]" />
              <span>Remind me to visit</span>
              <span className="text-[#929A96] font-normal">(Optional)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={remindAt}
                min={isEditing ? undefined : localDateString()}
                onChange={(e) => setRemindAt(e.target.value)}
                className="bg-[#111416] text-sm text-[#F5F7F4] px-3 py-2 rounded-lg border border-[#22282C] focus:outline-none focus:border-[#D7FF64] transition-colors [color-scheme:dark]"
              />
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setRemindAt(localDateString(d));
                }}
                className="px-2.5 py-2 text-xs text-[#D7FF64] hover:bg-[#1B2023] border border-[#22282C] rounded-lg transition-colors"
              >
                Tomorrow
              </button>
              {remindAt && (
                <button
                  type="button"
                  onClick={() => setRemindAt('')}
                  className="px-2.5 py-2 text-xs text-[#929A96] hover:text-[#F5F7F4] rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#929A96]/70 mt-1.5">
              This link will be highlighted from that day until you open it.
            </p>
          </div>

          {/* Favorite Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center gap-2 text-xs font-medium text-[#F5F7F4] hover:text-[#D7FF64] cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isFavorite
                    ? 'bg-[#D7FF64] border-[#D7FF64] text-[#0B0D0F]'
                    : 'border-[#323A40] bg-[#111416]'
                }`}
              >
                {isFavorite && <Star className="w-3 h-3 fill-current" />}
              </div>
              <span>Mark as favorite</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#22282C]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#1B2023] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] active:scale-[0.98] disabled:opacity-50 rounded-lg transition-all shadow-sm"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Save Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
