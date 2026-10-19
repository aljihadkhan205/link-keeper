// Shared between the browser (form validation) and the API (server validation)

export function normalizeAndValidateUrl(inputUrl: string): { valid: boolean; normalizedUrl?: string; hostname?: string; error?: string } {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'Website URL is required' };
  }

  let trimmed = inputUrl.trim();
  // Auto-prepend https:// if no protocol was specified
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { valid: false, error: 'Please enter a valid domain address (e.g., example.com)' };
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      hostname: parsed.hostname.toLowerCase(),
    };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function deriveFallbackName(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./i, '');
    const parts = host.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return host;
  } catch {
    return 'Website';
  }
}

