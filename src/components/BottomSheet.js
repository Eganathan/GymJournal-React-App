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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#141414] border-t border-neutral-800 rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center
                       hover:bg-neutral-800 transition-all duration-200"
          >
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8 flex-1">{children}</div>
      </div>
    </div>
  );
}
