import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl 
          border border-slate-100 dark:border-slate-800 overflow-hidden 
          animate-in zoom-in-95 duration-300 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
          <h3
            id="modal-title"
            className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em]"
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 
              hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Zamknij"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-10 max-h-[75vh] overflow-y-auto bg-white dark:bg-slate-900 transition-colors">
          {children}
        </div>
      </div>
    </div>
  );
};
