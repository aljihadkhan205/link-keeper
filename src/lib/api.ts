import { LinkItem, CategoryItem, SortOption } from '../types.js';

export interface FetchLinksParams {
  search?: string;
  category?: string;
  favorite?: boolean;
  sort?: SortOption;
}

export interface FetchLinksResponse {
  links: LinkItem[];
  total: number;
  favoritesCount: number;
}

export interface AuthStatusResponse {
  authenticated: boolean;
}

// Global auth trigger for prompting access modal when 401 occurs
type AuthRequiredCallback = () => void;
const authRequiredListeners: Set<AuthRequiredCallback> = new Set();

export function onAuthRequired(callback: AuthRequiredCallback): () => void {
  authRequiredListeners.add(callback);
  return () => authRequiredListeners.delete(callback);
}

function notifyAuthRequired(): void {
  authRequiredListeners.forEach((fn) => fn());
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include', // send HTTP-only session cookie
  });

  if (response.status === 401) {
    notifyAuthRequired();
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.message || 'Access PIN required', 401, 'UNAUTHORIZED');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || errorData.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json();
}

export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  return request<AuthStatusResponse>('/api/auth/status');
}

export async function loginWithPin(pin: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export async function logout(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function fetchLinks(params: FetchLinksParams = {}): Promise<FetchLinksResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'All Links') query.set('category', params.category);
  if (params.favorite) query.set('favorite', 'true');
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return request<FetchLinksResponse>(`/api/links${qs ? `?${qs}` : ''}`);
}

export async function createLink(payload: {
  name: string;
  url: string;
  note?: string;
  category?: string;
  isFavorite?: boolean;
  remindAt?: string | null;
}): Promise<{ success: boolean; link: LinkItem }> {
  return request<{ success: boolean; link: LinkItem }>('/api/links', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLink(
  id: string,
  payload: Partial<{
    name: string;
    url: string;
    note: string | null;
    category: string;
    isFavorite: boolean;
    remindAt: string | null;
  }>
): Promise<{ success: boolean; link: LinkItem }> {
  return request<{ success: boolean; link: LinkItem }>(`/api/links/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLink(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/links/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function recordLinkView(id: string): Promise<{ success: boolean; lastViewedAt: string; link: LinkItem }> {
  return request<{ success: boolean; lastViewedAt: string; link: LinkItem }>(`/api/links/${encodeURIComponent(id)}/view`, {
    method: 'POST',
  });
}

export async function fetchCategories(): Promise<{ categories: CategoryItem[] }> {
  return request<{ categories: CategoryItem[] }>('/api/categories');
}

export async function createCategory(name: string): Promise<{ success: boolean; category: CategoryItem }> {
  return request<{ success: boolean; category: CategoryItem }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function getExportUrl(): string {
  return '/api/export';
}
