import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileWarningProps {
  onProceed: () => void;
  onCancel: () => void;
}

const MobileWarning: React.FC<MobileWarningProps> = ({ onProceed, onCancel }) => {
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
        onClick={onCancel} // Close on backdrop click
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
            <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-yellow-100 border-2 border-yellow-200 shadow-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold">Desktop Recommended</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              For the best experience, especially with complex diagrams, we recommend using a desktop browser. The mobile playground is available but may have limitations.
            </p>
          </div>
           <div className="p-6 bg-[var(--color-bg-input)] border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row justify-center items-center gap-3 rounded-b-2xl">
                <button onClick={onCancel} className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-button-bg)] text-sm font-medium text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-button-bg-hover)] transition-colors">
                    Go Back
                </button>
                <button 
                    onClick={onProceed} 
                    className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-text-strong)] rounded-lg hover:opacity-90 transition-opacity"
                >
                    Proceed Anyway
                </button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileWarning;
