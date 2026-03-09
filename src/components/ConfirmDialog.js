import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog – a proper in-app confirmation dialog.
 * Replaces window.confirm() which can be blocked on mobile browsers.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     title="Delete workout?"
 *     message="This cannot be undone."
 *     confirmLabel="Delete"          // default "Confirm"
 *     danger                         // makes confirm button red
 *     onConfirm={() => { doIt(); setShowConfirm(false); }}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in-fast">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        onClick={onCancel}
      />
      {/* Panel */}
      <div
        className="relative w-full max-w-xs rounded-2xl p-6 animate-scale-in shadow-2xl"
        style={{ backgroundColor: 'var(--bg-sheet)', border: '1px solid var(--border-default)' }}
      >
        {danger && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10">
              <AlertTriangle size={22} className="text-red-400" />
            </div>
          </div>
        )}

        {title && (
          <h3 className="text-base font-bold text-center mb-2">{title}</h3>
        )}
        {message && (
          <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary !py-2.5 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 !py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 active:opacity-70 ${
              danger
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
