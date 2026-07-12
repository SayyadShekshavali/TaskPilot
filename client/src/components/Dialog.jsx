import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dialog = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  className = ''
}) => {
  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative z-10 w-full max-w-lg glass-panel rounded-[24px] p-6 shadow-2xl border border-white/10 ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-zinc-800/40 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-700/30 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="text-sm text-zinc-300 leading-relaxed overflow-y-auto max-h-[70vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
