import { X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-bg-main border border-accent/30 w-full max-w-md relative overflow-hidden shadow-[0_0_50px_rgba(255,99,33,0.1)]"
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px] z-50" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20 bg-accent/5">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-accent animate-pulse" />
                <h2 className="text-xs uppercase tracking-[0.3em] text-text-main font-black italic">
                  {title}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-accent/20 text-text-dim hover:text-text-accent transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-[11px] text-text-dim uppercase tracking-widest leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 bg-accent/5 border-t border-accent/20 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-text-dim hover:text-text-accent transition-all font-bold"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-6 py-2 ${isDestructive ? 'bg-red-600' : 'bg-accent'} text-bg-main text-[10px] uppercase tracking-[0.3em] font-black hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,99,33,0.2)]`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
