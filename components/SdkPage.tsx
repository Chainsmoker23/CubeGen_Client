import React from 'react';
import { motion } from 'framer-motion';
import SharedFooter from './SharedFooter';
import ArchitectureIcon from './ArchitectureIcon';
import { IconType } from '../types';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk';

interface SdkPageProps {
  onBack: () => void;
  onLaunch: () => void;
  onNavigate: (page: Page) => void;
}

const SdkPage: React.FC<SdkPageProps> = ({ onBack, onLaunch, onNavigate }) => {
  const steps = [
    {
      icon: IconType.Google,
      title: '1. Get Your API Key',
      description: "For in-app usage: Visit Google AI Studio to generate your own free Gemini API key. For SDK usage: Get your personal API key from your Pro dashboard."
    },
    {
      icon: IconType.Gear,
      title: '2. Add to Settings',
      description: "To bypass limits in CubeGen AI app: Add your Gemini key in the Settings sidebar. To use SDK: Authenticate with your personal API key in your application."
    },
    {
      icon: IconType.Sparkles,
      title: '3. Enjoy Unlimited Access',
      description: "For in-app: Bypass all shared usage limits. For SDK: Integrate diagram generation into your own applications."
    }
  ];

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
                CubeGen AI SDK & API Keys
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-[#555555]">
                Two ways to enhance your CubeGen AI experience: Use our SDK in your own applications or add a personal key to bypass usage limits in our app.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-[#555555] max-w-3xl mx-auto mb-16">
                Two ways to enhance your experience: Connect your personal key for in-app usage or use our SDK in your own applications.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg max-w-3xl mx-auto mb-12">
                <h3 className="font-bold text-lg flex items-center gap-2"><ArchitectureIcon type={IconType.FileCode} className="w-5 h-5" /> Programmatic Access with CubeGen AI SDK</h3>
                <p className="text-sm mt-2">
                  Integrate CubeGen AI into your own applications using our official SDK. Install it with npm:
                </p>
                <div className="mt-3 bg-gray-800 text-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                  npm install cubegen-ai
                </div>
                <p className="text-xs mt-2 text-blue-600">
                  Use your personal API key (from your Pro dashboard) to authenticate requests to the SDK.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gray-200" />
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                {steps.map((step, index) => (
                  <motion.div 
                    key={step.title} 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white z-10 text-center"
                  >
                    <div className="flex items-center justify-center h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg">
                      <ArchitectureIcon type={step.icon} className="w-10 h-10 text-[#D6336C]" />
                    </div>
                    <h3 className="text-xl font-bold mt-6 mb-2">{step.title}</h3>
                    <p className="text-[#555555]">{step.description}</p>

                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-24 hero-gradient-bg">
          <div className="container mx-auto px-6 text-center">
            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-4xl md:text-5xl font-extrabold">Ready to Get Started?</h2>
              <p className="mt-4 text-lg text-[#555555]">Launch the app to add your key or start designing now.</p>
              <button onClick={onLaunch}
                className="mt-8 shimmer-button text-[#A61E4D] font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg">
                Launch the App
              </button>
              <p className="mt-4 text-sm text-[#555555]">
                For SDK integration in your own applications, visit our <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('api'); }} className="text-[#A61E4D] underline">API & SDK Documentation</a>.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      
      <SharedFooter onNavigate={onNavigate} />
    </div>
  );
};

export default SdkPage;
