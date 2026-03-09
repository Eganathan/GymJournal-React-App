import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in-fast">
      {/* Backdrop — solid enough to clearly separate sheet from page */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
        onClick={onClose}
      />
      {/* Sheet panel */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl flex flex-col animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-sheet)',
          borderTop: '1px solid var(--border-default)',
          maxHeight: '88vh',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-default)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-2 shrink-0">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-default)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content with safe-area bottom padding */}
        <div
          className="overflow-y-auto px-5 flex-1"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
