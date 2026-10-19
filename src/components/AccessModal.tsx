import React, { useState } from 'react';
import { Lock, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onLogin: (pin: string) => Promise<void>;
}

export const AccessModal: React.FC<AccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onLogin,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your personal access PIN');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onLogin(pin.trim());
      setPin('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid access PIN';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#15191C] border border-[#22282C] rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 pb-4 border-b border-[#22282C]">
          <div className="w-10 h-10 rounded-xl bg-[#D7FF64]/10 border border-[#D7FF64]/20 flex items-center justify-center text-[#D7FF64] shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F7F4]">Personal Access Required</h3>
            <p className="text-xs text-[#929A96]">Enter your access PIN to unlock Link Keeper</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#F5F7F4] mb-1.5">
              Personal Website Access PIN
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929A96]" />
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter access PIN..."
                disabled={loading}
                className="w-full bg-[#111416] text-sm text-[#F5F7F4] placeholder-[#929A96]/50 pl-10 pr-10 py-2.5 rounded-lg border border-[#22282C] focus:outline-none focus:border-[#D7FF64] transition-colors tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929A96] hover:text-[#F5F7F4] p-1"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#929A96]/70 mt-1.5">
              Verified server-side via <code className="text-[#F5F7F4]">PRIVATE_ACCESS_PIN</code>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#22282C]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-[#929A96] hover:text-[#F5F7F4] hover:bg-[#1B2023] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#0B0D0F] bg-[#D7FF64] hover:bg-[#c4f34d] active:scale-[0.98] disabled:opacity-50 rounded-lg transition-all shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Unlock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
