import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

const GlitchIcon: React.FC = () => (
    <div className="glitch-icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" className="glitch-icon-base" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="glitch-layer layer-1" />
        <div className="glitch-layer layer-2" />
        <div className="glitch-layer layer-3" />
    </div>
);


const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose, onRetry }) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-[var(--color-panel-bg)] rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-[var(--color-border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div className="flex items-center justify-center h-20 w-20 mx-auto mb-4">
                <GlitchIcon />
            </div>
            <h2 className="text-2xl font-bold">An Error Occurred</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              {message}
            </p>
          </div>
           <div className="p-6 bg-[var(--color-bg-input)] border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row justify-center items-center gap-3 rounded-b-2xl">
                {onRetry && (
                    <button 
                        onClick={onRetry} 
                        className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-text-strong)] rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Try Again
                    </button>
                )}
                <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-button-bg)] text-sm font-medium text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-button-bg-hover)] transition-colors">
                    Close
                </button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorModal;