export function getHostname(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'link';
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const hostname = getHostname(url);
    if (!hostname || hostname === 'link') return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  } catch {
    return '';
  }
}

export function getDirectFaviconUrl(url: string): string {
  try {
    const hostname = getHostname(url);
    if (!hostname || hostname === 'link') return '';
    return `https://${hostname}/favicon.ico`;
  } catch {
    return '';
  }
}
