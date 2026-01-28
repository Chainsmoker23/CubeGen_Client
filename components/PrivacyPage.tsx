import React from 'react';
import { motion } from 'framer-motion';
import SharedFooter from './SharedFooter';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk';

interface PrivacyPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

const PrivacySection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-[#D6336C] mb-3">{title}</h2>
    <div className="text-[#555555] space-y-4 prose max-w-none">
      {children}
    </div>
  </div>
);

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, onNavigate }) => {
  return (
    <div className="bg-white text-[#2B2B2B] overflow-x-hidden">
      <header className="absolute top-0 left-0 w-full p-6 z-20">
        <button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#555555] hover:text-[#2B2B2B] transition-colors pulse-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back to Home
        </button>
      </header>

      <main>
        <section className="relative flex items-center justify-center overflow-hidden api-hero-bg py-20 pt-32 md:pt-40">
          <div className="container mx-auto px-6 z-10 text-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Privacy Policy
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-[#555555]">
                Your trust is important to us. Here's how we protect your privacy and handle your data.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <PrivacySection title="1. No Data Collection Policy">
              <p>At CubeGen AI, we believe in complete privacy. <strong>We do not collect, store, or share your personal data.</strong></p>
              <p>We are a tool, not a data broker. When you use our service to generate architecture diagrams, your prompts are processed and then immediately discarded. We do not maintain a database of user prompts, generated diagrams, or personal usage history.</p>
            </PrivacySection>

            <PrivacySection title="2. Your Information Stays With You">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>No Account Required:</strong> You can use all core features of CubeGen AI without creating an account or providing an email address.</li>
                <li><strong>Local Storage only:</strong> Any preferences or settings (like your API key) are stored locally in your browser's `localStorage`. This data never leaves your device and is never sent to our servers.</li>
                <li><strong>You Own Your Data:</strong> Since we don't store your diagrams, you are the sole owner of your creations. Make sure to export your work if you wish to save it.</li>
              </ul>
            </PrivacySection>

            <PrivacySection title="3. Communication & Email Policy">
              <p>We strictly respect your inbox. If you choose to contact us or provide your email for any reason:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Zero Spam:</strong> We will <strong>NEVER</strong> send you marketing emails, newsletters, or promotional offers.</li>
                <li><strong>Important Updates Only:</strong> We will only contact you for critical notifications regarding the service, such as security alerts or major breaking changes that affect your usage.</li>
                <li><strong>No Third-Party Sharing:</strong> We do not sell, trade, or transfer your email address to outside parties.</li>
              </ul>
            </PrivacySection>

            <PrivacySection title="4. Third-Party Services">
              <p>To provide our AI generation service, we use the Google Gemini API. When you generate a diagram:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your text prompt is sent securely to Google's servers for processing.</li>
                <li>Google processes this data in accordance with their <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D6336C] hover:underline">Privacy Policy</a>.</li>
                <li>We do not send any additional personal markers or user identifiers to Google.</li>
              </ul>
            </PrivacySection>

            <PrivacySection title="5. Contact Us">
              <p>If you have any questions about our strict privacy standards, please contact us at <a href="mailto:privacy@cubegen.ai" className="text-[#D6336C] hover:underline">privacy@cubegen.ai</a>.</p>
            </PrivacySection>
          </div>
        </section>
      </main>

      <SharedFooter onNavigate={onNavigate} activePage="privacy" />
    </div>
  );
};

export default PrivacyPage;
