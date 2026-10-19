import React, { useState, useEffect } from 'react';
import { ExternalLink, Star, MoreVertical, Edit2, Trash2, Copy, Check, Globe } from 'lucide-react';
import { LinkItem, ViewMode } from '../types.js';
import { getFaviconUrl, getDirectFaviconUrl, getHostname } from '../lib/favicon.js';
import { formatRelativeTime, formatFullDateTime } from '../lib/formatDate.js';

interface LinkCardProps {
  link: LinkItem;
  viewMode: ViewMode;
  onOpen: (link: LinkItem) => void;
  onToggleFavorite: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  viewMode,
  onOpen,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [imageErrorLevel, setImageErrorLevel] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Retry favicon chain if the URL is edited
  useEffect(() => {
    setImageErrorLevel(0);
  }, [link.url]);

  const hostname = getHostname(link.url);
  const primaryFavicon = getFaviconUrl(link.url);
  const directFavicon = getDirectFaviconUrl(link.url);

  const handleImageError = () => {
    setImageErrorLevel((prev) => prev + 1);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      ?.writeText(link.url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handleCardClick = () => {
    onOpen(link);
  };

  // List View Mode
  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-[#15191C] hover:bg-[#1B2023] border border-[#22282C] hover:border-[#323A40] rounded-xl transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Favicon Box */}
          <div className="w-9 h-9 shrink-0 rounded-lg bg-[#111416] border border-[#22282C] flex items-center justify-center overflow-hidden">
            {imageErrorLevel === 0 && primaryFavicon ? (
              <img
                src={primaryFavicon}
                alt=""
                className="w-5 h-5 object-contain"
                onError={handleImageError}
                referrerPolicy="no-referrer"
              />
            ) : imageErrorLevel === 1 && directFavicon ? (
              <img
                src={directFavicon}
                alt=""
                className="w-5 h-5 object-contain"
                onError={handleImageError}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Globe className="w-4 h-4 text-[#929A96]" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F5F7F4] truncate group-hover:text-[#D7FF64] transition-colors">
                {link.name}
              </h3>
              <span className="text-xs text-[#929A96] truncate font-mono hidden sm:inline">
                {hostname}
              </span>
            </div>

            {link.note && (
              <p className="text-xs text-[#929A96] truncate mt-0.5 max-w-xl">
                {link.note}
              </p>
            )}

            {/* Zero-Pill unboxed metadata */}
            <div className="flex items-center gap-2 text-[11px] text-[#929A96] mt-1 font-mono">
              <span className="text-[#D7FF64]/90 font-sans font-medium">{link.category}</span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span title={`Added: ${formatFullDateTime(link.createdAt)}`}>
                Added {formatRelativeTime(link.createdAt)}
              </span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span title={link.lastViewedAt ? `Viewed: ${formatFullDateTime(link.lastViewedAt)}` : 'Never viewed'}>
                {link.lastViewedAt ? `Viewed ${formatRelativeTime(link.lastViewedAt)}` : 'Unviewed'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div
          className="flex items-center gap-1 shrink-0 self-end md:self-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={() => onToggleFavorite(link)}
            title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2 rounded-lg transition-colors ${
              link.isFavorite
                ? 'text-[#D7FF64] bg-[#D7FF64]/10 hover:bg-[#D7FF64]/20'
                : 'text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#111416]'
            }`}
          >
            <Star className={`w-4 h-4 ${link.isFavorite ? 'fill-[#D7FF64]' : ''}`} />
          </button>

          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'URL Copied!' : 'Copy URL'}
            className="p-2 rounded-lg text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#111416] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[#D7FF64]" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(link)}
            title="Edit link"
            className="p-2 rounded-lg text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#111416] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(link)}
            title="Delete link"
            className="p-2 rounded-lg text-[#929A96] hover:text-red-400 hover:bg-[#111416] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Direct Open Button */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              onOpen(link);
            }}
            title="Open website in new tab"
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Open</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Grid View Mode
  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between p-4 bg-[#15191C] hover:bg-[#1B2023] border border-[#22282C] hover:border-[#323A40] rounded-xl transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Header inside Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Favicon Box */}
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#111416] border border-[#22282C] flex items-center justify-center overflow-hidden">
              {imageErrorLevel === 0 && primaryFavicon ? (
                <img
                  src={primaryFavicon}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : imageErrorLevel === 1 && directFavicon ? (
                <img
                  src={directFavicon}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Globe className="w-5 h-5 text-[#929A96]" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#F5F7F4] truncate group-hover:text-[#D7FF64] transition-colors">
                {link.name}
              </h3>
              <p className="text-xs text-[#929A96] truncate font-mono">
                {hostname}
              </p>
            </div>
          </div>

          {/* Quick Favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(link);
            }}
            title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              link.isFavorite
                ? 'text-[#D7FF64] bg-[#D7FF64]/10 hover:bg-[#D7FF64]/20'
                : 'text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#111416]'
            }`}
          >
            <Star className={`w-4 h-4 ${link.isFavorite ? 'fill-[#D7FF64]' : ''}`} />
          </button>
        </div>

        {/* Note / Description */}
        {link.note ? (
          <p className="text-xs text-[#929A96] line-clamp-2 mb-3 leading-relaxed">
            {link.note}
          </p>
        ) : (
          <p className="text-xs text-[#929A96]/50 italic mb-3">No note added</p>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-[#22282C] mt-2">
        {/* Zero-Pill unboxed category and timestamps */}
        <div className="flex items-center justify-between text-[11px] text-[#929A96] mb-3 font-mono">
          <span className="text-[#D7FF64]/90 font-sans font-medium truncate max-w-[120px]">
            {link.category}
          </span>
          <span
            className="tabular-nums shrink-0"
            title={link.lastViewedAt ? `Viewed: ${formatFullDateTime(link.lastViewedAt)}` : 'Never viewed'}
          >
            {link.lastViewedAt ? `Viewed ${formatRelativeTime(link.lastViewedAt)}` : 'Unviewed'}
          </span>
        </div>

        {/* Action Row */}
        <div
          className="flex items-center justify-between gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? 'URL Copied!' : 'Copy URL'}
              className="p-1.5 rounded-lg text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#111416] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#D7FF64]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onEdit(link)}
              title="Edit link"
              className="p-1.5 rounded-lg text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#111416] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(link)}
              title="Delete link"
              className="p-1.5 rounded-lg text-[#929A96] hover:text-red-400 hover:bg-[#111416] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              onOpen(link);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
