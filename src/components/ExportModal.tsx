import React, { useState } from 'react';
import { X, Download, Database, Check, Copy, ExternalLink, Shield } from 'lucide-react';
import { getExportUrl } from '../lib/api.js';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalLinks: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  totalLinks,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (cmd: string) => {
    navigator.clipboard?.writeText(cmd).catch(() => {});
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const dumpCmd = 'turso db dump link-keeper > link_keeper_backup.sql';
  const restoreCmd = 'turso db shell link-keeper < link_keeper_backup.sql';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#15191C] border border-[#22282C] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#22282C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D7FF64]/10 border border-[#D7FF64]/20 flex items-center justify-center text-[#D7FF64]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F7F4]">Export & Backup</h2>
              <p className="text-xs text-[#929A96]">Download your saved data or create a database replica</p>
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

        <div className="mt-5 space-y-5">
          {/* Section 1: JSON Export */}
          <div className="p-4 bg-[#111416] border border-[#22282C] rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#F5F7F4]">Instant JSON Export</h4>
                <p className="text-xs text-[#929A96] mt-0.5 leading-relaxed">
                  Export all {totalLinks} bookmarks with URLs, notes, categories, favorites, and view history directly from the database as a single JSON file.
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-[#22282C] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#929A96]">
                Format: <span className="text-[#F5F7F4]">link-keeper-backup.json</span>
              </span>
              <a
                href={getExportUrl()}
                download
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] active:scale-[0.98] rounded-lg transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </a>
            </div>
          </div>

          {/* Section 2: Full Database Backup Instructions */}
          <div className="p-4 bg-[#111416] border border-[#22282C] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F7F4]">
              <Database className="w-4 h-4 text-[#D7FF64]" />
              <span>Full Database Disaster Recovery (Turso)</span>
            </div>
            <p className="text-xs text-[#929A96] leading-relaxed">
              Downloading a JSON export is great for archiving and re-importing bookmarks, but for total database disaster recovery and exact binary replication, use the Turso CLI tools:
            </p>

            {/* Dump command */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#929A96] mb-1 font-mono">
                <span>1. Create SQL dump:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(dumpCmd)}
                  className="flex items-center gap-1 text-[#D7FF64] hover:underline"
                >
                  {copiedCmd === dumpCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === dumpCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-[#0B0D0F] border border-[#22282C] rounded-lg text-xs font-mono text-[#D7FF64] overflow-x-auto">
                {dumpCmd}
              </pre>
            </div>

            {/* Restore command */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#929A96] mb-1 font-mono">
                <span>2. Restore to Turso instance:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(restoreCmd)}
                  className="flex items-center gap-1 text-[#D7FF64] hover:underline"
                >
                  {copiedCmd === restoreCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === restoreCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-[#0B0D0F] border border-[#22282C] rounded-lg text-xs font-mono text-[#D7FF64] overflow-x-auto">
                {restoreCmd}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-4 border-t border-[#22282C]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#F5F7F4] bg-[#1B2023] hover:bg-[#22282C] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
