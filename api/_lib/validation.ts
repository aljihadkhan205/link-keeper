import { normalizeAndValidateUrl, deriveFallbackName } from '../../shared/url.js';

export { normalizeAndValidateUrl, deriveFallbackName };

export interface ValidateLinkInput {
  name: string;
  url: string;
  note?: string;
  category?: string;
  isFavorite?: boolean;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors?: Record<string, string>;
  data?: T;
}

export function validateLinkPayload(payload: unknown): ValidationResult<ValidateLinkInput> {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: { form: 'Invalid request body' } };
  }

  const data = payload as Record<string, unknown>;

  // URL check
  const urlValidation = normalizeAndValidateUrl(String(data.url || ''));
  if (!urlValidation.valid) {
    errors.url = urlValidation.error || 'Invalid URL';
  }

  // Name check
  let name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name && urlValidation.valid && urlValidation.normalizedUrl) {
    name = deriveFallbackName(urlValidation.normalizedUrl);
  } else if (!name) {
    errors.name = 'Website name is required';
  } else if (name.length > 150) {
    errors.name = 'Website name must be 150 characters or less';
  }

  // Note check
  let note: string | undefined = undefined;
  if (typeof data.note === 'string') {
    note = data.note.trim();
    if (note.length > 1000) {
      errors.note = 'Note must be 1,000 characters or less';
    }
  }

  // Category check
  let category = 'Other';
  if (typeof data.category === 'string' && data.category.trim().length > 0) {
    category = data.category.trim();
    if (category.length > 50) {
      errors.category = 'Category name must be 50 characters or less';
    }
  }

  const isFavorite = Boolean(data.isFavorite);

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name,
      url: urlValidation.normalizedUrl!,
      note: note || undefined,
      category,
      isFavorite,
    },
  };
}

export function makeCategoryId(): string {
  return `cat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// Escape LIKE wildcards so searching for "%" or "_" matches literally
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const ALLOWED_SORTS: Record<string, string> = {
  recent_viewed: 'CASE WHEN last_viewed_at IS NULL THEN 1 ELSE 0 END ASC, last_viewed_at DESC, created_at DESC',
  recent_added: 'created_at DESC',
  oldest_added: 'created_at ASC',
  alphabetical: 'LOWER(name) ASC',
};

export function getSafeSortClause(sortKey?: string | string[]): string {
  if (typeof sortKey === 'string' && ALLOWED_SORTS[sortKey]) {
    return ALLOWED_SORTS[sortKey];
  }
  return ALLOWED_SORTS.recent_added;
}
